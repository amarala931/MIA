import React from 'react';
import { Sparkles, BookOpen, Menu, Download, ShieldCheck, GraduationCap } from 'lucide-react';

export default function Navbar({ onToggleSidebar, activeAlgorithm }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger + App Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Abrir menú de lecciones"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 text-white shadow-md shadow-brand-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base text-white tracking-tight">AI Lab Interactivo</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Docencia ML
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Intuición geométrica, formulación matemática KaTeX y Python scikit-learn
              </p>
            </div>
          </div>
        </div>

        {/* Center / Current Algorithm Title (Desktop) */}
        {activeAlgorithm && (
          <div className="hidden md:flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Módulo actual:</span>
            <span className="font-semibold text-slate-200 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              {activeAlgorithm.title}
            </span>
          </div>
        )}

        {/* Right: Portability Badge & Offline Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">100% Client-Side</span>
            <span>(Sin Servidor)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
