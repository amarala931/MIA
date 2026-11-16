import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  GitCommit, RotateCcw, Trash2, Sliders, Crosshair, 
  Layers, CheckCircle2, AlertCircle, Compass 
} from 'lucide-react';
import { generateClassificationDataset } from '../utils/datasets';
import MetricsBadge from '../components/MetricsBadge';

// ====================================================================
// MATEMÁTICAS PURAS PARA KNN EN JS
// ====================================================================

function calculateDistance(x1, y1, x2, y2, metric = 'euclidean') {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  if (metric === 'manhattan') {
    return dx + dy;
  }
  // Euclídea por defecto
  return Math.sqrt(dx * dx + dy * dy);
}

// Clasifica una coordenada (x, y) dados los puntos de entrenamiento
function predictKNN(x, y, points, k, metric = 'euclidean', weights = 'uniform') {
  if (!points.length) return { predictedLabel: 0, prob0: 0.5, prob1: 0.5, neighbors: [] };

  // Calcular distancias a todos los puntos
  const distances = points.map((p, index) => ({
    index,
    point: p,
    dist: calculateDistance(x, y, p.x, p.y, metric)
  }));

  // Ordenar por distancia ascendente
  distances.sort((a, b) => a.dist - b.dist);

  // Seleccionar los K vecinos más cercanos
  const actualK = Math.min(k, points.length);
  const neighbors = distances.slice(0, actualK);

  let vote0 = 0;
  let vote1 = 0;

  neighbors.forEach(n => {
    let weight = 1;
    if (weights === 'distance') {
      weight = 1 / (n.dist + 1e-5);
    }
    if (n.point.label === 0) {
      vote0 += weight;
    } else {
      vote1 += weight;
    }
  });

  const totalVotes = vote0 + vote1;
  const prob0 = totalVotes > 0 ? vote0 / totalVotes : 0.5;
  const prob1 = totalVotes > 0 ? vote1 / totalVotes : 0.5;
  const predictedLabel = vote1 > vote0 ? 1 : 0;

  return {
    predictedLabel,
    prob0,
    prob1,
    neighbors,
    maxDistance: neighbors.length ? neighbors[neighbors.length - 1].dist : 0
  };
}

// ====================================================================
// COMPONENTE VISUALIZADOR DEL LABORATORIO
// ====================================================================
function KNNVisualizer({ params, onParamChange, setMetrics }) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState(() => 
    generateClassificationDataset(params.dataset || 'moons', 50, params.noise || 10)
  );

  // Sonda de prueba interactiva
  const [probe, setProbe] = useState({ x: 0.05, y: 0.05 });
  const [activeClass, setActiveClass] = useState(0); // 0 = Azul, 1 = Naranja para añadir
  const [isDraggingProbe, setIsDraggingProbe] = useState(false);

  // Regenerar dataset
  const handleRegenerate = useCallback((datasetType = params.dataset, noise = params.noise) => {
    const newPoints = generateClassificationDataset(datasetType, 50, noise);
    setPoints(newPoints);
  }, [params.dataset, params.noise]);

  // Predicción sobre la sonda de prueba actual
  const probePrediction = useMemo(() => {
    return predictKNN(probe.x, probe.y, points, params.k, params.metric, params.weights);
  }, [probe, points, params.k, params.metric, params.weights]);

  // Calcular métrica de precisión en entrenamiento (Leave-one-out aprox)
  const accuracy = useMemo(() => {
    if (points.length < 2) return 100;
    let correct = 0;
    points.forEach((p, idx) => {
      // Excluirse a sí mismo para validación cruzada realista
      const rest = points.filter((_, i) => i !== idx);
      const res = predictKNN(p.x, p.y, rest, params.k, params.metric, params.weights);
      if (res.predictedLabel === p.label) correct++;
    });
    return (correct / points.length) * 100;
  }, [points, params.k, params.metric, params.weights]);

  // Actualizar métricas para la UI global
  useEffect(() => {
    let diagnosis = 'Frontera Equilibrada';
    let status = 'good';
    if (params.k === 1) {
      diagnosis = 'Varianza Alta (Sensible a ruido / Islas)';
      status = 'danger';
    } else if (params.k >= 13) {
      diagnosis = 'Sesgo Alto (Fronteras simplificadas)';
      status = 'warning';
    }

    setMetrics({
      k: params.k,
      accuracy: `${accuracy.toFixed(1)}%`,
      probeClass: probePrediction.predictedLabel === 0 ? 'Clase 0 (Azul)' : 'Clase 1 (Naranja)',
      probeConf: `${(Math.max(probePrediction.prob0, probePrediction.prob1) * 100).toFixed(1)}%`,
      metric: params.metric,
      weights: params.weights,
      diagnosis,
      status
    });
  }, [accuracy, probePrediction, params.k, params.metric, params.weights, setMetrics]);

  // Dibujar en Canvas (Frontera de decisión + puntos + sonda interactiva)
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

    // 1. Dibujar Mapa de Calor de Fronteras de Decisión en tiempo real
    // Resolución de malla optimizada 55x55 para mantener 60 FPS fluidos
    const gridRes = 55;
    const cellW = width / gridRes;
    const cellH = height / gridRes;

    for (let gi = 0; gi < gridRes; gi++) {
      for (let gj = 0; gj < gridRes; gj++) {
        const mx = xMin + ((gi + 0.5) / gridRes) * (xMax - xMin);
        const my = yMin + ((gridRes - 1 - gj + 0.5) / gridRes) * (yMax - yMin);

        const res = predictKNN(mx, my, points, params.k, params.metric, params.weights);
        
        // Color suave según clase y probabilidad
        if (res.predictedLabel === 0) {
          const alpha = 0.12 + res.prob0 * 0.28;
          ctx.fillStyle = `rgba(14, 140, 233, ${alpha})`;
        } else {
          const alpha = 0.12 + res.prob1 * 0.28;
          ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
        }
        ctx.fillRect(gi * cellW, gj * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Cuadrícula y ejes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), height);
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(width, toCanvasY(0));
    ctx.stroke();

    // 2. Dibujar líneas de conexión desde la Sonda a sus K vecinos más cercanos
    if (probePrediction.neighbors.length > 0) {
      const px = toCanvasX(probe.x);
      const py = toCanvasY(probe.y);

      // Círculo o contorno de vecindario
      const maxDist = probePrediction.maxDistance;
      const radiusCanvas = (maxDist / (xMax - xMin)) * width;
      
      ctx.beginPath();
      if (params.metric === 'manhattan') {
        // En distancia Manhattan el vecindario es un rombo rotado a 45°
        ctx.moveTo(px, py - radiusCanvas);
        ctx.lineTo(px + radiusCanvas, py);
        ctx.lineTo(px, py + radiusCanvas);
        ctx.lineTo(px - radiusCanvas, py);
        ctx.closePath();
      } else {
        ctx.arc(px, py, radiusCanvas, 0, Math.PI * 2);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Trazas hacia los K vecinos
      probePrediction.neighbors.forEach(({ point }) => {
        const nx = toCanvasX(point.x);
        const ny = toCanvasY(point.y);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = point.label === 0 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(251, 146, 60, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Resaltar el vecino seleccionado
        ctx.beginPath();
        ctx.arc(nx, ny, 8.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // 3. Dibujar Puntos de Datos de Entrenamiento
    points.forEach((p) => {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);

      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      if (p.label === 0) {
        ctx.fillStyle = '#0e8ce9';
        ctx.strokeStyle = '#bae0fd';
      } else {
        ctx.fillStyle = '#f97316';
        ctx.strokeStyle = '#ffedd5';
      }
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();
    });

    // 4. Dibujar Sonda de Prueba Interactiva
    const probeX = toCanvasX(probe.x);
    const probeY = toCanvasY(probe.y);

    // Halo palpitante
    ctx.beginPath();
    ctx.arc(probeX, probeY, 14, 0, Math.PI * 2);
    ctx.fillStyle = probePrediction.predictedLabel === 0 ? 'rgba(14, 140, 233, 0.35)' : 'rgba(249, 115, 22, 0.35)';
    ctx.fill();

    // Cruz de mira de precisión
    ctx.beginPath();
    ctx.arc(probeX, probeY, 8, 0, Math.PI * 2);
    ctx.fillStyle = probePrediction.predictedLabel === 0 ? '#38bdf8' : '#fb923c';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(probeX - 12, probeY);
    ctx.lineTo(probeX + 12, probeY);
    ctx.moveTo(probeX, probeY - 12);
    ctx.lineTo(probeX, probeY + 12);
    ctx.stroke();

  }, [points, probe, probePrediction, params.k, params.metric, params.weights]);

  // Manejadores de interacción (añadir/borrar puntos o arrastrar sonda)
  const getCoordinatesFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xMin = -1.15, xMax = 1.15;
    const yMin = -1.15, yMax = 1.15;

    const mathX = xMin + (clickX / rect.width) * (xMax - xMin);
    const mathY = yMin + ((rect.height - clickY) / rect.height) * (yMax - yMin);

    return { mathX, mathY };
  };

  const handleMouseDown = (e) => {
    const { mathX, mathY } = getCoordinatesFromEvent(e);

    // Comprobar si hizo clic cerca de la sonda de prueba para arrastrarla
    if (Math.hypot(probe.x - mathX, probe.y - mathY) < 0.15) {
      setIsDraggingProbe(true);
      return;
    }

    // Comprobar si hizo clic sobre un punto existente para eliminarlo
    const existingIndex = points.findIndex(
      p => Math.hypot(p.x - mathX, p.y - mathY) < 0.08
    );

    if (existingIndex !== -1) {
      setPoints(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // Si mantiene presionada la tecla Shift o hace clic secundario, mueve la sonda directamente
      if (e.shiftKey || e.button === 2) {
        setProbe({ x: mathX, y: mathY });
      } else {
        // Añadir nuevo punto con la clase activa seleccionada
        setPoints(prev => [...prev, { x: mathX, y: mathY, label: activeClass, id: `knn-custom-${Date.now()}` }]);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDraggingProbe) return;
    const { mathX, mathY } = getCoordinatesFromEvent(e);
    setProbe({
      x: Math.max(-1.1, Math.min(1.1, mathX)),
      y: Math.max(-1.1, Math.min(1.1, mathY))
    });
  };

  const handleMouseUp = () => {
    setIsDraggingProbe(false);
  };

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp}>
      {/* Barra superior de controles del dataset y clase activa */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dataset:</span>
          {[
            { id: 'moons', label: 'Dos Lunas (Entrelazadas)' },
            { id: 'circles', label: 'Círculos Concéntricos' },
            { id: 'blobs', label: 'Grupos Gaussianos' }
          ].map(ds => (
            <button
              key={ds.id}
              onClick={() => {
                onParamChange('dataset', ds.id);
                handleRegenerate(ds.id, params.noise);
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

        {/* Selector de clase para dibujar */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 px-1 font-medium">Añadir punto:</span>
          <button
            onClick={() => setActiveClass(0)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeClass === 0
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-brand-400"></span>
            <span>Clase 0 (Azul)</span>
          </button>
          <button
            onClick={() => setActiveClass(1)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeClass === 1
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
            <span>Clase 1 (Naranja)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleRegenerate(params.dataset, params.noise)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Regenerar</span>
          </button>
          <button
            onClick={() => setPoints([])}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Grid: Canvas + Hiperparámetros */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas de Clasificación */}
        <div className="lg:col-span-3 flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-xl">
          <div className="relative w-full aspect-[16/10] max-h-[460px]">
            <canvas
              ref={canvasRef}
              width={750}
              height={470}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full cursor-crosshair block"
            />
          </div>

          {/* Barra de estado y ayuda */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1 text-slate-300">
                <Crosshair className="w-3.5 h-3.5 text-brand-400" />
                <span><strong>Arrastra la sonda</strong> para inspeccionar vecinos</span>
              </span>
              <span>•</span>
              <span><strong>Clic:</strong> Añadir punto | <strong>Clic sobre punto:</strong> Borrar</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Predicción Sonda:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                probePrediction.predictedLabel === 0 
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' 
                  : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              }`}>
                {probePrediction.predictedLabel === 0 ? 'Azul (P0)' : 'Naranja (P1)'} ({(Math.max(probePrediction.prob0, probePrediction.prob1) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Panel de Hiperparámetros */}
        <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-brand-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Hiperparámetros KNN</h4>
          </div>

          {/* Slider K Vecinos (1 a 15) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Número de Vecinos (K):</span>
              <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                K = {params.k}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={params.k}
              onChange={(e) => onParamChange('k', parseInt(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>K=1 (Islas/Overfitting)</span>
              <span>K=15 (Suave)</span>
            </div>
          </div>

          {/* Métrica de Distancia: Euclídea vs Manhattan */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-300">Métrica de Distancia:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onParamChange('metric', 'euclidean')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all text-center ${
                  params.metric === 'euclidean'
                    ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Euclídea (L2)
              </button>
              <button
                onClick={() => onParamChange('metric', 'manhattan')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all text-center ${
                  params.metric === 'manhattan'
                    ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Manhattan (L1)
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              {params.metric === 'euclidean' ? 'Fronteras redondeadas suaves' : 'Fronteras anguladas con rombos a 45°'}
            </p>
          </div>

          {/* Ponderación: Uniforme vs Inversa de la Distancia */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-300">Ponderación de Votos:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onParamChange('weights', 'uniform')}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all text-center ${
                  params.weights === 'uniform'
                    ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Uniforme
              </button>
              <button
                onClick={() => onParamChange('weights', 'distance')}
                className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all text-center ${
                  params.weights === 'distance'
                    ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Por Distancia
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              {params.weights === 'uniform' ? 'Cada vecino tiene 1 voto igual' : 'Los más cercanos votan con más fuerza'}
            </p>
          </div>

          {/* Diagnóstico en tiempo real */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-1">Diagnóstico Didáctico:</div>
            <div className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
              params.k === 1
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/25'
                : params.k >= 13
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {params.k === 1
                  ? 'K=1 memoriza cada muestra. Cualquier punto de ruido genera una isla de decisión.'
                  : params.k >= 13
                  ? 'K alto suaviza la frontera en exceso, pudiendo perder patrones sutiles.'
                  : 'K moderado: Buena resistencia al ruido y frontera coherente.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricsBadge
          label="Precisión (Leave-One-Out)"
          value={`${accuracy.toFixed(1)}%`}
          status={accuracy > 90 ? 'good' : accuracy > 75 ? 'warning' : 'danger'}
          subtitle="Tasa de acierto estimada"
        />
        <MetricsBadge
          label="Vecinos Considerados"
          value={`K = ${params.k}`}
          subtitle={`${params.weights === 'uniform' ? 'Voto democrático' : 'Ponderado por 1/d'}`}
        />
        <MetricsBadge
          label="Métrica Geométrica"
          value={params.metric === 'euclidean' ? 'L2 (Euclídea)' : 'L1 (Manhattan)'}
          subtitle="Función de distancia en ℝ²"
        />
        <MetricsBadge
          label="Radio del Vecindario"
          value={probePrediction.maxDistance.toFixed(2)}
          subtitle="Distancia al K-ésimo vecino"
        />
      </div>
    </div>
  );
}

// ====================================================================
// EXPORTACIÓN PRINCIPAL DEL OBJETO DEL ALGORITMO
// ====================================================================
export default {
  id: 'knn-classification',
  title: 'K-Nearest Neighbors (KNN - Clasificación)',
  shortTitle: 'KNN Clasificador',
  category: 'supervised-classification',
  level: 'Principiante',
  badge: 'Algoritmo Basado en Instancias',
  icon: 'GitCommit',
  description: 'Clasificación basada en la analogía de la mayoría y la proximidad geométrica en el espacio de características.',

  defaultParams: {
    k: 5,
    metric: 'euclidean',
    weights: 'uniform',
    dataset: 'moons',
    noise: 10
  },

  theory: {
    summary: 'KNN es un algoritmo no paramétrico y perezoso (lazy learner) que no construye un modelo explícito durante el entrenamiento, sino que clasifica nuevas consultas consultando directamente las K muestras más cercanas en memoria.',
    intuition: 'Dime con quién andas y te diré quién eres. Si te encuentras en un territorio desconocido y te rodean 4 personas que hablan francés y 1 que habla español, la suposición más probable (K=5) es que estés en una región francófona. El valor de K define el tamaño de tu vecindario de consulta.',
    useCases: [
      {
        title: 'Sistemas de Recomendación Basados en Contenido',
        desc: 'Recomendar películas o artículos encontrando usuarios o ítems con características similares en un espacio latente.'
      },
      {
        title: 'Detección de Fraude en Transacciones',
        desc: 'Identificar operaciones anómalas que caen en regiones donde abundan antecedentes de transacciones fraudulentas.'
      },
      {
        title: 'Diagnóstico Clínico Asistido',
        desc: 'Clasificar patologías según historiales médicos de pacientes con sintomatología y biomarcadores vecinos.'
      }
    ],
    mathFormulas: [
      {
        title: '1. Distancia Euclídea (Norma L2)',
        latex: 'd(\\mathbf{x}, \\mathbf{z}) = \\|\\mathbf{x} - \\mathbf{z}\\|_2 = \\sqrt{\\sum_{j=1}^{p} (x_j - z_j)^2}',
        explanation: 'Mide la distancia en línea recta habitual en geometría euclídea.'
      },
      {
        title: '2. Distancia Manhattan (Norma L1)',
        latex: 'd(\\mathbf{x}, \\mathbf{z}) = \\|\\mathbf{x} - \\mathbf{z}\\|_1 = \\sum_{j=1}^{p} |x_j - z_j|',
        explanation: 'Suma de las diferencias absolutas, asemejándose a caminar por una cuadrícula urbana de calles ortogonales.'
      },
      {
        title: '3. Regla de Votación Ponderada',
        latex: '\\hat{y} = \\arg\\max_{c} \\sum_{i \\in \\mathcal{N}_K(\\mathbf{x})} w_i \\cdot \\mathbb{I}(y_i = c), \\quad w_i = \\frac{1}{d(\\mathbf{x}, \\mathbf{x}_i) + \\epsilon}',
        explanation: 'En ponderación por distancia, los vecinos más cercanos ejercen una influencia gravitacional superior a los lejanos.'
      }
    ],
    tradeoffs: {
      pros: [
        'Concepto intuitivo y fácil de explicar a alumnos sin base matemática compleja.',
        'Sin fase de entrenamiento explícita (ajuste en O(1) tiempo de memoria).',
        'Capaz de aprender fronteras no lineales de cualquier forma arbitraria (lunas, espirales).'
      ],
      cons: [
        'Predicción costosa O(N * d): debe calcular la distancia a cada muestra en tiempo de inferencia.',
        'Muy sensible a la escala de las variables (requiere obligatoriamente StandardScaler).',
        'Sufre severamente la Maldición de la Dimensionalidad en espacios de muchas variables.'
      ]
    }
  },

  generatePythonCode: (params) => {
    const code = `import numpy as np
import matplotlib.pyplot as plt
from sklearn.neighbors import KNeighborsClassifier
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# 1. Generar dataset sintético de clasificación
X, y = make_moons(n_samples=120, noise=0.15, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 2. Instanciar el Clasificador KNN con los hiperparámetros elegidos
clf = KNeighborsClassifier(
    n_neighbors=${params.k},
    metric='${params.metric}',
    weights='${params.weights}'
)

# 3. "Entrenamiento" (almacenamiento de instancias en memoria o estructura KD-Tree)
clf.fit(X_train, y_train)

# 4. Evaluación en conjunto de prueba
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Número de Vecinos (K): {${params.k}}")
print(f"Métrica: ${params.metric}")
print(f"Exactitud (Accuracy): {acc * 100:.2f}%\\n")
print(classification_report(y_test, y_pred))

# 5. Visualizar la frontera de decisión en 2D
x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
xx, yy = np.meshgrid(np.linspace(x_min, x_max, 200), np.linspace(y_min, y_max, 200))
Z = clf.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

plt.figure(figsize=(8, 6))
plt.contourf(xx, yy, Z, alpha=0.3, cmap=plt.cm.coolwarm)
plt.scatter(X[:, 0], X[:, 1], c=y, cmap=plt.cm.coolwarm, edgecolors='k')
plt.title(f"Frontera KNN (K={${params.k}}, métrica='{clf.metric}')")
plt.show()`;

    const highlightedLines = [14, 15, 16];

    const paramExplanations = [
      {
        param: `n_neighbors = ${params.k}`,
        desc: 'Cantidad de vecinos más próximos que participan en la votación mayoritaria.',
        biasVarianceImpact: params.k === 1
          ? 'K = 1: Varianza extrema. La frontera rodea cada punto individual, creando pequeñas islas y memorizando anomalías.'
          : params.k <= 7
          ? 'K = 3-7: Suele ser el punto dulce empírico para balancear varianza y sesgo.'
          : 'K >= 15: Sesgo alto. La frontera se aplana y tiende a favorecer a la clase mayoritaria.'
      },
      {
        param: `metric = '${params.metric}'`,
        desc: 'Fórmula geométrica para calcular la cercanía entre vectores.',
        biasVarianceImpact: params.metric === 'euclidean'
          ? 'Euclídea (L2): Fronteras suaves y radiales, apropiada para magnitudes continuas isotrópicas.'
          : 'Manhattan (L1): Fronteras con esquinas a 45 grados, más robusta ante diferencias en dimensiones aisladas.'
      },
      {
        param: `weights = '${params.weights}'`,
        desc: 'Estrategia de ponderación del voto de cada vecino.',
        biasVarianceImpact: params.weights === 'uniform'
          ? 'Uniform: Cada vecino pesa exactamente 1 punto sin importar si está a 0.01 o a 0.99 de distancia.'
          : 'Distance: Los vecinos íntimos tienen mucho más peso que los lejanos, reduciendo el sesgo con K grande.'
      }
    ];

    return { code, highlightedLines, paramExplanations };
  },

  challenges: [
    {
      id: 1,
      title: 'Misión 1: Las "Islas de Decisión" con K = 1',
      difficulty: 'Fácil',
      goal: 'Comprueba cómo un clasificador con K=1 es vulnerable al ruido creando micro-regiones ficticias.',
      actionHint: 'Pon K = 1. Ahora haz clic en el selector "Añadir Clase 1 (Naranja)" y coloca un único punto naranja en mitad de la masa azul.',
      solution: 'Observa cómo el mapa de calor abre inmediatamente una "isla" naranja alrededor de ese punto solitario. En K=1 el error de entrenamiento es 0%, pero la varianza es máxima. Ahora sube K a 7 y mira cómo la isla desaparece absorbida por la mayoría.'
    },
    {
      id: 2,
      title: 'Misión 2: Huella Geométrica de la Métrica Manhattan',
      difficulty: 'Media',
      goal: 'Diferencia visualmente la geometría L2 frente a L1.',
      actionHint: 'Arrastra la sonda de prueba cerca del centro y alterna entre "Euclídea (L2)" y "Manhattan (L1)".',
      solution: 'En distancia euclídea, la zona de búsqueda es una circunferencia perfecta. En distancia Manhattan, la zona de búsqueda se transforma en un rombo o cuadrado girado 45°, reflejando la métrica taxi de Manhattan |dx| + |dy|.'
    },
    {
      id: 3,
      title: 'Misión 3: Círculos Concéntricos No Lineales',
      difficulty: 'Media',
      goal: 'Observa la superioridad de KNN sobre modelos puramente lineales en datos no linealmente separables.',
      actionHint: 'Selecciona el dataset "Círculos Concéntricos" con K = 5.',
      solution: 'Un modelo lineal (como regresión logística simple) fracasaría con 50% de error al intentar trazar una recta. KNN envuelve naturalmente el anillo exterior e interior adaptándose a la geometría local sin transformaciones previas.'
    }
  ],

  Visualizer: KNNVisualizer
};
