import React from 'react';
import { Lock, Sparkles, Calendar, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function UpcomingView({ algorithm }) {
  if (!algorithm) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div className="p-8 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/30 text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Próximamente en el Plan de Estudios</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {algorithm.title}
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {algorithm.description}
        </p>

        <div className="pt-4 flex flex-wrap justify-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Nivel: <strong>{algorithm.level}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Categoría: <strong>{algorithm.badge}</strong></span>
          </div>
        </div>
      </div>

      {/* Qué se aprenderá en este módulo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
            <Layers className="w-4 h-4" />
            <span>Objetivos Didácticos del Módulo</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>Simulación visual e interactiva en Canvas a 60 FPS con ajuste de hiperparámetros.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>Demostración matemática KaTeX y derivaciones algebraicas rigurosas.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>Generación de scripts en Python con <code>scikit-learn</code> y <code>PyTorch</code>.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center space-x-2 text-brand-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Prerrequisitos Recomendados</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Para aprovechar al máximo este módulo, se recomienda haber completado los laboratorios interactivos previos:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
              ✓ Regresión Polinómica (Sesgo vs Varianza)
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
              ✓ K-Nearest Neighbors (Fronteras y Distancias)
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
              ✓ K-Means (Optimización Iterativa)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
