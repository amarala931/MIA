import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Network, RotateCcw, Trash2, Sliders, Play, StepForward, 
  RefreshCw, CheckCircle2, AlertCircle, Compass, Zap 
} from 'lucide-react';
import { generateClusteringDataset } from '../utils/datasets';
import MetricsBadge from '../components/MetricsBadge';

// Paleta de colores vibrantes para hasta 6 clusters
const CLUSTER_COLORS = [
  { main: '#0e8ce9', light: '#7cc7fb', bg: 'rgba(14, 140, 233, 0.15)', name: 'Azul' },
  { main: '#f97316', light: '#fdba74', bg: 'rgba(249, 115, 22, 0.15)', name: 'Naranja' },
  { main: '#10b981', light: '#6ee7b7', bg: 'rgba(16, 185, 129, 0.15)', name: 'Verde' },
  { main: '#a855f7', light: '#d8b4fe', bg: 'rgba(168, 85, 247, 0.15)', name: 'Púrpura' },
  { main: '#f43f5e', light: '#fda4af', bg: 'rgba(244, 63, 94, 0.15)', name: 'Rosa' },
  { main: '#eab308', light: '#fde047', bg: 'rgba(234, 179, 8, 0.15)', name: 'Amarillo' }
];

export function calculateInertia(points, centroids, assignments) {
  if (!points.length || !centroids.length) return 0;
  let totalInertia = 0;
  for (let i = 0; i < points.length; i++) {
    const clusterIdx = assignments[i];
    if (clusterIdx !== undefined && clusterIdx >= 0 && clusterIdx < centroids.length) {
      const c = centroids[clusterIdx];
      const dx = points[i].x - c.x;
      const dy = points[i].y - c.y;
      totalInertia += dx * dx + dy * dy;
    }
  }
  return totalInertia;
}

// ====================================================================
// COMPONENTE VISUALIZADOR DEL LABORATORIO K-MEANS
// ====================================================================
function KMeansVisualizer({ params, onParamChange, setMetrics }) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState(() => 
    generateClusteringDataset(params.dataset || '3blobs', 75)
  );

  // Estado del algoritmo iterativo
  const [centroids, setCentroids] = useState([]);
  const [centroidHistory, setCentroidHistory] = useState([]); // Historial de movimientos
  const [assignments, setAssignments] = useState([]); // cluster para cada punto
  const [iteration, setIteration] = useState(0);
  const [phase, setPhase] = useState('uninitialized'); // 'uninitialized' | 'assigned' | 'moved' | 'converged'
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  // Inicialización de centroides (estrategia K-Means++ o aleatoria inteligente)
  const initializeCentroids = useCallback((kCount = params.k, pts = points) => {
    if (!pts.length) return;
    const newCentroids = [];
    
    // Primer centroide al azar de entre los datos existentes
    const firstIdx = Math.floor(Math.random() * pts.length);
    newCentroids.push({ x: pts[firstIdx].x, y: pts[firstIdx].y });

    // K-Means++ para el resto de centroides
    for (let c = 1; c < kCount; c++) {
      let bestPt = pts[Math.floor(Math.random() * pts.length)];
      let maxDist = -1;

      for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = pts[Math.floor(Math.random() * pts.length)];
        // Distancia mínima a centroides ya existentes
        let minDist = Infinity;
        for (const existing of newCentroids) {
          const d = Math.hypot(candidate.x - existing.x, candidate.y - existing.y);
          if (d < minDist) minDist = d;
        }
        if (minDist > maxDist) {
          maxDist = minDist;
          bestPt = candidate;
        }
      }
      newCentroids.push({ x: bestPt.x, y: bestPt.y });
    }

    setCentroids(newCentroids);
    setCentroidHistory([newCentroids.map(c => ({ ...c }))]);
    setAssignments(new Array(pts.length).fill(-1));
    setIteration(0);
    setPhase('uninitialized');
    setIsAutoRunning(false);
  }, [params.k, points]);

  // Inicializar al montar o cambiar K
  useEffect(() => {
    initializeCentroids(params.k, points);
  }, [params.k, points.length]);

  // Paso 1: Asignar cada punto al centroide más cercano
  const assignPointsStep = useCallback(() => {
    if (!centroids.length || !points.length) return false;

    const newAssignments = points.map(p => {
      let closestIdx = 0;
      let minDist = Infinity;
      centroids.forEach((c, cIdx) => {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d < minDist) {
          minDist = d;
          closestIdx = cIdx;
        }
      });
      return closestIdx;
    });

    // Comprobar si hubo cambios en las asignaciones
    let changed = false;
    if (assignments.length !== newAssignments.length) {
      changed = true;
    } else {
      for (let i = 0; i < assignments.length; i++) {
        if (assignments[i] !== newAssignments[i]) {
          changed = true;
          break;
        }
      }
    }

    setAssignments(newAssignments);
    setPhase('assigned');
    return changed;
  }, [centroids, points, assignments]);

  // Paso 2: Mover centroides a la media aritmética de sus puntos
  const moveCentroidsStep = useCallback(() => {
    if (!centroids.length || !points.length) return false;

    const newCentroids = centroids.map((c, cIdx) => {
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      points.forEach((p, pIdx) => {
        if (assignments[pIdx] === cIdx) {
          sumX += p.x;
          sumY += p.y;
          count++;
        }
      });

      if (count === 0) {
        // Si un centroide se queda sin puntos, mantenerlo o reposicionar ligeramente
        return { ...c };
      }

      return {
        x: sumX / count,
        y: sumY / count
      };
    });

    // Comprobar distancia máxima de movimiento
    let maxShift = 0;
    centroids.forEach((c, idx) => {
      const shift = Math.hypot(c.x - newCentroids[idx].x, c.y - newCentroids[idx].y);
      if (shift > maxShift) maxShift = shift;
    });

    setCentroids(newCentroids);
    setCentroidHistory(prev => [...prev, newCentroids.map(nc => ({ ...nc }))]);
    setIteration(prev => prev + 1);

    if (maxShift < 0.001) {
      setPhase('converged');
      return false; // Convergencia alcanzada
    } else {
      setPhase('moved');
      return true; // Continúa moviéndose
    }
  }, [centroids, points, assignments]);

  // Ejecutar un ciclo completo (Asignar -> Mover)
  const handleNextStep = useCallback(() => {
    if (phase === 'uninitialized' || phase === 'moved') {
      assignPointsStep();
    } else if (phase === 'assigned') {
      moveCentroidsStep();
    }
  }, [phase, assignPointsStep, moveCentroidsStep]);

  // Bucle automático hasta convergencia
  useEffect(() => {
    if (!isAutoRunning) return;

    const timer = setTimeout(() => {
      if (phase === 'converged' || iteration >= 30) {
        setIsAutoRunning(false);
        setPhase('converged');
        return;
      }

      if (phase === 'uninitialized' || phase === 'moved') {
        assignPointsStep();
      } else if (phase === 'assigned') {
        const keptMoving = moveCentroidsStep();
        if (!keptMoving) {
          setIsAutoRunning(false);
          setPhase('converged');
        }
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [isAutoRunning, phase, iteration, assignPointsStep, moveCentroidsStep]);

  // Inercia actual (WCSS)
  const inertia = useMemo(() => {
    return calculateInertia(points, centroids, assignments);
  }, [points, centroids, assignments]);

  // Actualizar métricas para la UI global
  useEffect(() => {
    let diagnosis = 'En progreso';
    let status = 'neutral';
    if (phase === 'converged') {
      diagnosis = '¡Convergencia Alcanzada!';
      status = 'good';
    } else if (phase === 'uninitialized') {
      diagnosis = 'Esperando Inicialización';
      status = 'warning';
    }

    setMetrics({
      k: params.k,
      inertia: inertia.toFixed(3),
      iteration,
      phaseText: phase === 'converged' ? 'Convergido' : phase === 'assigned' ? 'Puntos asignados' : phase === 'moved' ? 'Centroides actualizados' : 'Inicial',
      diagnosis,
      status
    });
  }, [params.k, inertia, iteration, phase, setMetrics]);

  // Dibujar en Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const xMin = -1.15, xMax = 1.15;
    const yMin = -1.15, yMax = 1.15;

    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Limpiar fondo
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Cuadrícula sutil
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), height);
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(width, toCanvasY(0));
    ctx.stroke();

    // 1. Dibujar líneas de asignación de cada punto a su centroide
    if (phase !== 'uninitialized' && centroids.length > 0) {
      ctx.lineWidth = 0.8;
      points.forEach((p, idx) => {
        const cIdx = assignments[idx];
        if (cIdx !== undefined && cIdx >= 0 && cIdx < centroids.length) {
          const c = centroids[cIdx];
          const colorObj = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];
          ctx.strokeStyle = colorObj.bg.replace('0.15', '0.25');
          ctx.beginPath();
          ctx.moveTo(toCanvasX(p.x), toCanvasY(p.y));
          ctx.lineTo(toCanvasX(c.x), toCanvasY(c.y));
          ctx.stroke();
        }
      });
    }

    // 2. Dibujar historial de trayectorias de los centroides
    if (centroidHistory.length > 1) {
      for (let cIdx = 0; cIdx < centroids.length; cIdx++) {
        const colorObj = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];
        ctx.strokeStyle = colorObj.main;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let h = 0; h < centroidHistory.length; h++) {
          const pos = centroidHistory[h][cIdx];
          if (!pos) continue;
          const cx = toCanvasX(pos.x);
          const cy = toCanvasY(pos.y);
          if (h === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);

          // Marcador de paso histórico
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 3. Dibujar puntos de datos
    points.forEach((p, idx) => {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      const cIdx = assignments[idx];

      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);

      if (cIdx !== undefined && cIdx >= 0 && cIdx < CLUSTER_COLORS.length) {
        const colorObj = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];
        ctx.fillStyle = colorObj.main;
        ctx.strokeStyle = colorObj.light;
      } else {
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#94a3b8';
      }

      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });

    // 4. Dibujar Centroides Actuales (Grandes estrellas / dianas)
    centroids.forEach((c, cIdx) => {
      const cx = toCanvasX(c.x);
      const cy = toCanvasY(c.y);
      const colorObj = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];

      // Halo brillante pulsante
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = colorObj.bg.replace('0.15', '0.4');
      ctx.fill();

      // Círculo exterior
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = colorObj.main;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Cruz interna blanca
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy);
      ctx.lineTo(cx + 6, cy);
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx, cy + 6);
      ctx.stroke();

      // Etiqueta del centroide (C1, C2, ...)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`μ${cIdx + 1}`, cx + 13, cy + 4);
    });

  }, [points, centroids, centroidHistory, assignments, phase]);

  // Manejador de clics en el lienzo para añadir o borrar puntos
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xMin = -1.15, xMax = 1.15;
    const yMin = -1.15, yMax = 1.15;

    const mathX = xMin + (clickX / rect.width) * (xMax - xMin);
    const mathY = yMin + ((rect.height - clickY) / rect.height) * (yMax - yMin);

    // Verificar si hizo clic sobre un punto para eliminarlo
    const existingIndex = points.findIndex(
      p => Math.hypot(p.x - mathX, p.y - mathY) < 0.08
    );

    if (existingIndex !== -1) {
      setPoints(prev => prev.filter((_, idx) => idx !== existingIndex));
      setAssignments(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // Añadir punto
      setPoints(prev => [...prev, { x: mathX, y: mathY, id: `km-cust-${Date.now()}` }]);
      setAssignments(prev => [...prev, -1]);
      setPhase('uninitialized');
    }
  };

  const handleRegenerate = (datasetType = params.dataset) => {
    const newPoints = generateClusteringDataset(datasetType, 75);
    setPoints(newPoints);
    initializeCentroids(params.k, newPoints);
  };

  return (
    <div className="space-y-4">
      {/* Barra superior de selección de dataset */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dataset:</span>
          {[
            { id: '3blobs', label: '3 Grupos Bien Separados' },
            { id: 'anisotropic', label: 'Blobs Alargados (Anisótropos)' },
            { id: 'uniform', label: 'Distribución Uniforme' }
          ].map(ds => (
            <button
              key={ds.id}
              onClick={() => {
                onParamChange('dataset', ds.id);
                handleRegenerate(ds.id);
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                params.dataset === ds.id
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {ds.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleRegenerate(params.dataset)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nuevos datos</span>
          </button>
          <button
            onClick={() => {
              setPoints([]);
              setCentroids([]);
              setAssignments([]);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Controles de Ejecución Paso a Paso Didácticos */}
      <div className="p-3 bg-slate-900/95 rounded-xl border border-brand-500/30 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón 1: Inicializar */}
          <button
            onClick={() => initializeCentroids(params.k, points)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Inicializar Centroides</span>
          </button>

          {/* Botón 2: Asignar */}
          <button
            onClick={assignPointsStep}
            disabled={!centroids.length || isAutoRunning}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              phase === 'uninitialized' || phase === 'moved'
                ? 'bg-brand-600 text-white border-brand-500 shadow-sm shadow-brand-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-800'
            }`}
          >
            <StepForward className="w-3.5 h-3.5 text-brand-300" />
            <span>2. Asignar Puntos</span>
          </button>

          {/* Botón 3: Mover */}
          <button
            onClick={moveCentroidsStep}
            disabled={!centroids.length || phase === 'uninitialized' || isAutoRunning}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              phase === 'assigned'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-300" />
            <span>3. Mover Centroides</span>
          </button>

          {/* Botón 4: Ejecutar hasta convergencia */}
          <button
            onClick={() => setIsAutoRunning(prev => !prev)}
            disabled={!centroids.length || phase === 'converged'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isAutoRunning
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/30'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isAutoRunning ? 'Pausar' : 'Ejecutar hasta Convergencia'}</span>
          </button>
        </div>

        {/* Indicador de fase actual */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Estado:</span>
          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
            phase === 'converged'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : phase === 'assigned'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
              : phase === 'moved'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {phase === 'converged' && '¡Convergencia Lograda!'}
            {phase === 'assigned' && 'Puntos Asignados al Más Próximo'}
            {phase === 'moved' && 'Centroides Reubicados a la Media'}
            {phase === 'uninitialized' && 'Esperando Asignación'}
          </span>
        </div>
      </div>

      {/* Grid: Canvas + Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas de Clustering */}
        <div className="lg:col-span-3 flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-xl">
          <div className="relative w-full aspect-[16/10] max-h-[460px]">
            <canvas
              ref={canvasRef}
              width={750}
              height={470}
              onClick={handleCanvasClick}
              className="w-full h-full cursor-crosshair block"
            />
          </div>

          {/* Barra de ayuda inferior */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400">
            <div>
              <span><strong>Clic:</strong> Añadir punto no etiquetado | <strong>Clic sobre punto:</strong> Eliminar</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-slate-300">Iteración: <strong>{iteration}</strong></span>
              <span>•</span>
              <span className="font-mono text-slate-300">Inercia: <strong>{inertia.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* Panel de Hiperparámetros K */}
        <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-brand-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Configuración K-Means</h4>
          </div>

          {/* Slider K Clusters (2 a 6) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Número de Clusters (K):</span>
              <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                K = {params.k}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={params.k}
              onChange={(e) => onParamChange('k', parseInt(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>K = 2</span>
              <span>K = 6</span>
            </div>
          </div>

          {/* Leyenda de Clusters y Población */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Distribución de Puntos:</span>
            <div className="space-y-1">
              {centroids.map((c, idx) => {
                const colorObj = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
                const count = assignments.filter(a => a === idx).length;
                const pct = points.length ? ((count / points.length) * 100).toFixed(0) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-800/60">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorObj.main }}></span>
                      <span className="text-slate-300 font-medium">Cluster {idx + 1} ({colorObj.name})</span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{count} pts ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnóstico didáctico */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-1">Mínimos Locales:</div>
            <div className="p-2 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
              K-Means no garantiza encontrar el óptimo global. Prueba a presionar "1. Inicializar Centroides" varias veces para ver cómo cambian las trayectorias de convergencia.
            </div>
          </div>
        </div>
      </div>

      {/* Fila de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricsBadge
          label="Inercia WCSS"
          value={inertia.toFixed(2)}
          subtitle="Suma de distancias cuadradas intra-cluster"
          status={inertia < 8 ? 'good' : 'neutral'}
        />
        <MetricsBadge
          label="Iteraciones"
          value={iteration}
          subtitle={phase === 'converged' ? 'Convergencia alcanzada' : 'Ciclos de recálculo'}
        />
        <MetricsBadge
          label="Clusters Activos"
          value={`K = ${params.k}`}
          subtitle={`${points.length} puntos observados`}
        />
        <MetricsBadge
          label="Estado Algoritmo"
          value={phase === 'converged' ? '100% Estable' : `${phase}`}
          status={phase === 'converged' ? 'good' : 'warning'}
          subtitle={phase === 'converged' ? 'Centroides estacionarios' : 'En optimización'}
        />
      </div>
    </div>
  );
}

// ====================================================================
// EXPORTACIÓN PRINCIPAL DEL OBJETO DEL ALGORITMO
// ====================================================================
export default {
  id: 'kmeans-clustering',
  title: 'K-Means (Clustering No Supervisado)',
  shortTitle: 'K-Means Clustering',
  category: 'unsupervised-clustering',
  level: 'Principiante',
  badge: 'Aprendizaje No Supervisado',
  icon: 'Network',
  description: 'Descubre patrones y agrupaciones naturales en datos no etiquetados mediante la optimización iterativa de centroides.',

  defaultParams: {
    k: 3,
    dataset: '3blobs'
  },

  theory: {
    summary: 'K-Means es el algoritmo de agrupamiento no supervisado más popular. Particiona N observaciones en K clusters donde cada muestra pertenece al grupo con la media geométrica (centroide) más cercana.',
    intuition: 'Imagina que quieres colocar 3 centros de distribución logística para abastecer a 75 tiendas. Empiezas colocando los 3 centros en cualquier lugar al azar. Luego asignas cada tienda a su centro más cercano. A continuación, trasladas cada centro de distribución al centro de gravedad exacto de sus tiendas asignadas. Repites este proceso una y otra vez hasta que los centros ya no necesiten moverse.',
    useCases: [
      {
        title: 'Segmentación de Clientes y Marketing',
        desc: 'Agrupar perfiles de compradores según frecuencia de compra, ticket promedio y categorías de productos preferidas.'
      },
      {
        title: 'Compresión y Cuantización de Color',
        desc: 'Reducir una paleta de 16 millones de colores RGB a solo K colores representativos (centroides) en imágenes.'
      },
      {
        title: 'Detección de Anomalías y Ciberseguridad',
        desc: 'Identificar peticiones de red que se encuentran a distancias anormalmente grandes de cualquier centroide normal.'
      }
    ],
    mathFormulas: [
      {
        title: '1. Función Objetivo: Inercia WCSS (Within-Cluster Sum of Squares)',
        latex: 'J(C, \\boldsymbol{\\mu}) = \\sum_{k=1}^{K} \\sum_{i \\in S_k} \\|\\mathbf{x}_i - \\boldsymbol{\\mu}_k\\|^2',
        explanation: 'Minimiza la dispersión cuadrática total entre cada punto x_i y su centroide asignado mu_k.'
      },
      {
        title: '2. Paso de Asignación (Expectation / Voronoi)',
        latex: 'S_k^{(t)} = \\left\\{ \\mathbf{x}_i : \\|\\mathbf{x}_i - \\boldsymbol{\\mu}_k^{(t)}\\|^2 \\le \\|\\mathbf{x}_i - \\boldsymbol{\\mu}_j^{(t)}\\|^2 \\; \\forall j, \\; 1 \\le j \\le K \\right\\}',
        explanation: 'Cada observación se asigna al cluster cuyo centroide actual se encuentra a menor distancia euclídea.'
      },
      {
        title: '3. Paso de Actualización (Maximization / Media Aritmética)',
        latex: '\\boldsymbol{\\mu}_k^{(t+1)} = \\frac{1}{|S_k^{(t)}|} \\sum_{\\mathbf{x}_i \\in S_k^{(t)}} \\mathbf{x}_i',
        explanation: 'El nuevo centroide es el promedio vectorial de todos los puntos asignados a ese grupo.'
      }
    ],
    tradeoffs: {
      pros: [
        'Extremadamente rápido y escalable con orden de complejidad O(T * K * N * d).',
        'Fácil de entender e implementar paso a paso en el aula.',
        'Convergencia garantizada (la inercia siempre decrece monótonamente en cada iteración).'
      ],
      cons: [
        'Exige fijar el número K a priori (requiere método del codo o coeficiente de silueta).',
        'Asume clusters convexos, isotrópicos (esféricos) y de tamaño similar.',
        'Sensible a la inicialización aleatoria (puede converger a mínimos locales subóptimos).'
      ]
    }
  },

  generatePythonCode: (params) => {
    const code = `import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.datasets import make_blobs

# 1. Generar datos sintéticos no etiquetados (X)
X, _ = make_blobs(
    n_samples=150, 
    centers=3, 
    cluster_std=0.6, 
    random_state=42
)

# 2. Configurar el estimador K-Means
# Se especifica K=${params.k} clusters y la inicialización 'k-means++'
kmeans = KMeans(
    n_clusters=${params.k},
    init='k-means++',
    n_init=10,
    max_iter=300,
    random_state=42
)

# 3. Ajuste del modelo (Descubrimiento no supervisado de patrones)
kmeans.fit(X)

# 4. Resultados del agrupamiento
labels = kmeans.labels_
centroids = kmeans.cluster_centers_
inertia = kmeans.inertia_

print(f"Número de Clusters (K): {${params.k}}")
print(f"Inercia Final (WCSS): {inertia:.2f}")
print(f"Iteraciones requeridas: {kmeans.n_iter_}")
print(f"Coordenadas de los Centroides:\\n{centroids}")

# 5. Visualización de los clusters y sus centroides
plt.figure(figsize=(8, 6))
plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6, edgecolors='none')
plt.scatter(
    centroids[:, 0], centroids[:, 1], 
    c='red', marker='X', s=200, linewidths=2, label='Centroides'
)
plt.title(f"K-Means Clustering (K={${params.k}}, Inercia={inertia:.1f})")
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`;

    const highlightedLines = [15, 16, 17];

    const paramExplanations = [
      {
        param: `n_clusters = ${params.k}`,
        desc: 'Cantidad de grupos o centroides que buscará el algoritmo en el espacio.',
        biasVarianceImpact: params.k < 3
          ? 'K subestimado: Agrupa artificialmente clusters distintos en uno solo (Inercia alta).'
          : params.k === 3
          ? 'K óptimo: Coincide con la topología real de los datos.'
          : 'K sobreestimado: Fragmenta grupos naturales en subclusters ficticios (Inercia decrece artificialmente).'
      },
      {
        param: "init = 'k-means++'",
        desc: 'Algoritmo de inicialización inteligente que distancia los primeros centroides entre sí.',
        biasVarianceImpact: 'Evita mínimos locales pobres y acelera la velocidad de convergencia en un 50-70% respecto a inicialización aleatoria uniforme.'
      }
    ];

    return { code, highlightedLines, paramExplanations };
  },

  challenges: [
    {
      id: 1,
      title: 'Misión 1: Atrapado en un Mínimo Local',
      difficulty: 'Media',
      goal: 'Experimenta cómo la inicialización puede provocar que K-Means converja a una solución subóptima.',
      actionHint: 'Con el dataset "3 Grupos", haz clic en "1. Inicializar Centroides" varias veces y luego en "Ejecutar hasta Convergencia". Fíjate en el valor final de la Inercia WCSS.',
      solution: 'Si dos centroides comienzan por azar dentro del mismo grupo natural, se repartirán ese grupo a la mitad, dejando a uno de los otros grupos naturales sin centroide propio. La Inercia resultante será significativamente superior a la del óptimo global.'
    },
    {
      id: 2,
      title: 'Misión 2: El dilema de la Inercia y el "Codo"',
      difficulty: 'Fácil',
      goal: 'Descubre por qué una menor inercia no significa necesariamente un mejor modelo.',
      actionHint: 'Aumenta K progresivamente de 2 a 6 en el dataset de 3 grupos y compara la Inercia.',
      solution: 'Si pusiéramos K = N (un centroide por cada punto), la Inercia sería exactamente 0, pero el modelo no aportaría ninguna generalización útil. El punto de inflexión donde la inercia deja de caer drásticamente (el "codo") revela el K natural (K=3).'
    },
    {
      id: 3,
      title: 'Misión 3: El Fracaso de K-Means con Formas Alargadas',
      difficulty: 'Avanzada',
      goal: 'Comprende la limitación geométrica de las distancias euclídeas y las celdas de Voronoi.',
      actionHint: 'Selecciona el dataset "Blobs Alargados (Anisótropos)" con K = 2 y ejecuta hasta convergencia.',
      solution: 'K-Means asume implícitamente que los clusters son nubes esféricas. Al enfrentarse a dos elipses alargadas diagonales paralelas, K-Means corta los grupos transversalmente por la mitad en lugar de seguir la estructura natural de cada línea.'
    }
  ],

  Visualizer: KMeansVisualizer
};
