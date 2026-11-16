import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TheoryPanel from './components/TheoryPanel';
import PythonPanel from './components/PythonPanel';
import UpcomingView from './components/UpcomingView';
import { activeAlgorithms, getAlgorithmById } from './algorithms';
import { BookOpen, Sliders, Code2, Sparkles, ChevronRight, GraduationCap } from 'lucide-react';

export default function App() {
  // Soporte para deep-linking con URL hash o parámetros (?algo=...&tab=...)
  const getInitialState = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace('#', '');
      const algoParam = urlParams.get('algo') || hash.split('/')[0];
      const tabParam = urlParams.get('tab') || hash.split('/')[1];

      const validAlgo = getAlgorithmById(algoParam);
      return {
        algoId: validAlgo ? validAlgo.id : activeAlgorithms[0].id,
        tab: ['theory', 'lab', 'python'].includes(tabParam) ? tabParam : 'lab'
      };
    } catch {
      return { algoId: activeAlgorithms[0].id, tab: 'lab' };
    }
  };

  const initial = getInitialState();
  const [selectedAlgoId, setSelectedAlgoId] = useState(initial.algoId);
  const [activeTab, setActiveTab] = useState(initial.tab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Almacenar los parámetros de cada algoritmo de forma independiente
  const [paramsState, setParamsState] = useState(() => {
    const initial = {};
    activeAlgorithms.forEach(algo => {
      initial[algo.id] = { ...algo.defaultParams };
    });
    return initial;
  });

  // Métricas en vivo reportadas por el laboratorio activo
  const [currentMetrics, setCurrentMetrics] = useState({});

  // Algoritmo actual seleccionado
  const currentAlgorithm = useMemo(() => {
    return getAlgorithmById(selectedAlgoId);
  }, [selectedAlgoId]);

  const isLocked = Boolean(currentAlgorithm?.isLocked);

  // Parámetros actuales para el algoritmo seleccionado
  const currentParams = paramsState[selectedAlgoId] || currentAlgorithm.defaultParams || {};

  const handleParamChange = (key, value) => {
    setParamsState(prev => ({
      ...prev,
      [selectedAlgoId]: {
        ...prev[selectedAlgoId],
        [key]: value
      }
    }));
  };

  // Sincronizar URL hash al cambiar de algoritmo o pestaña para permitir compartir enlaces
  React.useEffect(() => {
    try {
      window.location.hash = `${selectedAlgoId}/${activeTab}`;
    } catch {
      // Ignorar en entornos sin soporte de hash
    }
  }, [selectedAlgoId, activeTab]);

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Barra superior de navegación */}
      <Navbar 
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        activeAlgorithm={currentAlgorithm}
      />

      {/* Contenedor Principal (Sidebar + Área de Contenido) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Barra lateral de navegación por bloques del curso */}
        <Sidebar
          selectedAlgorithmId={selectedAlgoId}
          onSelectAlgorithm={(id) => {
            setSelectedAlgoId(id);
            // Si el algoritmo es locked, no forzar tab lab
            const algo = getAlgorithmById(id);
            if (algo.isLocked) {
              setActiveTab('theory');
            }
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Área de trabajo / Lección activa */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Cabecera del Algoritmo Actual */}
          <div className="space-y-2 pb-4 border-b border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Bloque Temático:</span>
              <span className="font-semibold text-brand-400 uppercase tracking-wider text-[11px] bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                {currentAlgorithm.category}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-300 font-semibold">{currentAlgorithm.badge}</span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Nivel: <strong>{currentAlgorithm.level}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {currentAlgorithm.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-4xl">
              {currentAlgorithm.description}
            </p>
          </div>

          {/* Si el algoritmo está bloqueado ("Próximamente"), mostrar vista de roadmap */}
          {isLocked ? (
            <UpcomingView algorithm={currentAlgorithm} />
          ) : (
            <div className="space-y-6">
              {/* Barra de Pestañas Didácticas (3 Paneles Integrados) */}
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-px">
                <button
                  onClick={() => setActiveTab('theory')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-t border-x ${
                    activeTab === 'theory'
                      ? 'bg-slate-900 text-brand-400 border-slate-800 border-b-2 border-b-brand-500'
                      : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>1. Teoría e Intuición</span>
                </button>

                <button
                  onClick={() => setActiveTab('lab')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-t border-x relative ${
                    activeTab === 'lab'
                      ? 'bg-slate-900 text-brand-400 border-slate-800 border-b-2 border-b-brand-500'
                      : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>2. Laboratorio Interactivo (Tiempo Real)</span>
                  <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>

                <button
                  onClick={() => setActiveTab('python')}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-t border-x ${
                    activeTab === 'python'
                      ? 'bg-slate-900 text-brand-400 border-slate-800 border-b-2 border-b-brand-500'
                      : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>3. Implementación Python (scikit-learn)</span>
                </button>
              </div>

              {/* Contenido de la Pestaña Activa */}
              <div className="pt-2">
                {activeTab === 'theory' && (
                  <TheoryPanel algorithm={currentAlgorithm} />
                )}

                {activeTab === 'lab' && currentAlgorithm.Visualizer && (
                  <currentAlgorithm.Visualizer
                    params={currentParams}
                    onParamChange={handleParamChange}
                    metrics={currentMetrics}
                    setMetrics={setCurrentMetrics}
                  />
                )}

                {activeTab === 'python' && (
                  <PythonPanel
                    algorithm={currentAlgorithm}
                    params={currentParams}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
