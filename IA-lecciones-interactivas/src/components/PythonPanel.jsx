import React, { useState } from 'react';
import { 
  Code, Sliders, Target, HelpCircle, CheckCircle2, 
  ChevronDown, ChevronUp, Sparkles, BookOpen 
} from 'lucide-react';
import CodeBlock from './CodeBlock';

export default function PythonPanel({ algorithm, params }) {
  const [completedChallenges, setCompletedChallenges] = useState({});
  const [openSolutions, setOpenSolutions] = useState({});

  if (!algorithm || !algorithm.generatePythonCode) return null;

  const { code, highlightedLines, paramExplanations } = algorithm.generatePythonCode(params);
  const challenges = algorithm.challenges || [];

  const toggleChallengeComplete = (id) => {
    setCompletedChallenges(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSolution = (id) => {
    setOpenSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Bloque de Código Python Dinámico */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-brand-400">
            <Code className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Código scikit-learn Dinámico
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
            Se sincroniza en tiempo real con los sliders del Laboratorio
          </span>
        </div>

        <CodeBlock
          code={code}
          highlightedLines={highlightedLines}
          filename={`${algorithm.id}.py`}
          title={`Python 3 • scikit-learn • ${algorithm.shortTitle}`}
        />
      </div>

      {/* 2. Desglose Didáctico de Hiperparámetros y Sesgo/Varianza */}
      {paramExplanations && paramExplanations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-brand-400 pb-2 border-b border-slate-800">
            <Sliders className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Efecto de Hiperparámetros: Dilema Sesgo vs Varianza
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paramExplanations.map((item, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-center space-x-2 font-mono text-xs font-bold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-md border border-brand-500/20 w-fit">
                  <span>{item.param}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {item.desc}
                </p>
                <div className="p-2.5 rounded-lg bg-[#080c14] border border-slate-800/80 text-[11px] text-amber-300/90 leading-relaxed">
                  <strong className="text-amber-400 font-sans block mb-0.5">Impacto en Generalización:</strong>
                  {item.biasVarianceImpact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Retos Prácticos para el Alumno */}
      {challenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-brand-400">
              <Target className="w-5 h-5" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Retos Prácticos para el Alumno (Misiones de Clase)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {Object.values(completedChallenges).filter(Boolean).length} de {challenges.length} completados
            </span>
          </div>

          <div className="space-y-3">
            {challenges.map((c) => {
              const isDone = completedChallenges[c.id];
              const isSolutionOpen = openSolutions[c.id];

              return (
                <div 
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDone 
                      ? 'bg-emerald-950/20 border-emerald-500/30' 
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleChallengeComplete(c.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isDone 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'border-slate-600 bg-slate-800 hover:border-brand-400'
                        }`}
                        title={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                      >
                        {isDone && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-bold ${isDone ? 'text-emerald-300 line-through' : 'text-white'}`}>
                            {c.title}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                            c.difficulty === 'Fácil'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : c.difficulty === 'Media'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {c.difficulty}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          <strong>Objetivo:</strong> {c.goal}
                        </p>

                        <div className="mt-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-brand-400 font-semibold">Pista de acción:</span> {c.actionHint}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSolution(c.id)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 shrink-0 border border-slate-700/60 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{isSolutionOpen ? 'Ocultar Solución' : 'Ver Solución'}</span>
                      {isSolutionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Solución desplegable */}
                  {isSolutionOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 bg-brand-950/30 p-3 rounded-lg border border-brand-500/20">
                      <strong className="text-brand-300 block mb-1">Explicación Didáctica y Conclusión:</strong>
                      {c.solution}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
