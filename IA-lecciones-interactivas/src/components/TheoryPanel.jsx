import React from 'react';
import { 
  Lightbulb, BookOpen, CheckCircle, XCircle, 
  Briefcase, Sigma, ArrowRight 
} from 'lucide-react';
import MathBlock from './MathBlock';

export default function TheoryPanel({ algorithm }) {
  const { theory } = algorithm;
  if (!theory) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Intuición y Resumen Didáctico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 text-brand-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Fundamentos del Algoritmo
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {theory.summary}
          </p>

          <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-500/20 text-slate-200">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Intuición Geométrica
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {theory.intuition}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Casos de Uso Reales en la Industria */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-slate-200">
            <Briefcase className="w-4 h-4 text-brand-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Casos de Uso en la Industria
            </h4>
          </div>
          <div className="space-y-2.5">
            {theory.useCases.map((uc, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs font-semibold text-brand-300">{uc.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{uc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Formulación Matemática con KaTeX */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-brand-400 pb-2 border-b border-slate-800">
          <Sigma className="w-5 h-5" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Formulación Matemática Rigurosa
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {theory.mathFormulas.map((formula, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">
                  {formula.title}
                </h4>
                <div className="bg-[#080c14] p-3 rounded-lg border border-slate-800/80 shadow-inner">
                  <MathBlock math={formula.latex} />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60 leading-relaxed">
                {formula.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Tabla de Ventajas vs Desventajas */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-wide">
          Análisis de Pros y Contras (Trade-offs)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ventajas */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle className="w-4 h-4" />
              <span>Ventajas y Fortalezas</span>
            </div>
            <ul className="space-y-2">
              {theory.tradeoffs.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Desventajas */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2.5">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <XCircle className="w-4 h-4" />
              <span>Limitaciones y Desventajas</span>
            </div>
            <ul className="space-y-2">
              {theory.tradeoffs.cons.map((con, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-rose-400 font-bold shrink-0">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
