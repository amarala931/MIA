import React, { useState } from 'react';
import { 
  TrendingUp, GitCommit, Network, Cpu, GitFork, 
  Maximize2, Minimize2, Gamepad2, Lock, Search, 
  ChevronRight, Sparkles, BookOpen 
} from 'lucide-react';
import { COURSE_CATEGORIES, getCategoriesWithAlgorithms } from '../algorithms';

const ICON_MAP = {
  TrendingUp,
  GitCommit,
  Network,
  Cpu,
  GitFork,
  Maximize2,
  Minimize2,
  Gamepad2
};

export default function Sidebar({ 
  selectedAlgorithmId, 
  onSelectAlgorithm, 
  isOpen, 
  onClose 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const categories = getCategoriesWithAlgorithms();

  // Filtrar algoritmos por búsqueda
  const filteredCategories = categories.map(cat => ({
    ...cat,
    algorithms: cat.algorithms.filter(algo => 
      algo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.badge.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.algorithms.length > 0);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-slate-950 border-r border-slate-800/80 
        flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header / Search bar */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Temario del Curso
            </span>
            <span className="text-[10px] font-mono bg-slate-900 text-brand-400 px-2 py-0.5 rounded border border-slate-800">
              ML 2026
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar algoritmo o tema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable category list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="space-y-1.5">
              {/* Category Header */}
              <div className="px-2 py-1 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {category.title}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                  category.isUpcoming 
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {category.badge}
                </span>
              </div>

              {/* Algorithms in this category */}
              <div className="space-y-1">
                {category.algorithms.map((algo) => {
                  const Icon = ICON_MAP[algo.icon] || BookOpen;
                  const isSelected = selectedAlgorithmId === algo.id;
                  const isLocked = algo.isLocked;

                  return (
                    <button
                      key={algo.id}
                      onClick={() => {
                        onSelectAlgorithm(algo.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`
                        w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-start space-x-3 group relative
                        ${isSelected 
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' 
                          : isLocked
                          ? 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent hover:border-slate-800/80'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent hover:border-slate-800'
                        }
                      `}
                    >
                      {/* Icon */}
                      <div className={`
                        p-2 rounded-lg shrink-0 mt-0.5 transition-colors
                        ${isSelected 
                          ? 'bg-white/20 text-white' 
                          : isLocked
                          ? 'bg-slate-800/60 text-slate-500 group-hover:text-purple-400'
                          : 'bg-slate-800 text-brand-400 group-hover:bg-slate-700'
                        }
                      `}>
                        {isLocked ? (
                          <Lock className="w-4 h-4 text-purple-400/80" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate">
                            {algo.shortTitle || algo.title}
                          </span>
                        </div>

                        <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {algo.badge}
                        </p>

                        {/* Locked Badge */}
                        {isLocked && (
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 font-medium">
                            Próximamente en el curso
                          </span>
                        )}
                      </div>

                      {/* Active indicator dot or chevron */}
                      {isSelected && (
                        <ChevronRight className="w-4 h-4 text-white shrink-0 self-center" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Vite + React + KaTeX</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
        </div>
      </aside>
    </>
  );
}
