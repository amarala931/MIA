import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  TrendingUp, RotateCcw, Plus, Trash2, Sliders, Info, 
  HelpCircle, CheckCircle2, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';
import { fitPolynomialRidge, predictPolynomial } from '../utils/matrix';
import { generateRegressionDataset } from '../utils/datasets';
import MetricsBadge from '../components/MetricsBadge';

// ====================================================================
// COMPONENTE VISUALIZADOR DEL LABORATORIO (60 FPS CANVAS)
// ====================================================================
function LinearRegressionVisualizer({ params, onParamChange, setMetrics }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [points, setPoints] = useState(() => 
    generateRegressionDataset(params.dataset || 'sinusoidal', 28, params.noise || 15)
  );
  const [hoverCoord, setHoverCoord] = useState(null);

  // Regenerar dataset cuando cambia el tipo predefinido o el ruido
  const handleRegenerate = useCallback((datasetType = params.dataset, noise = params.noise) => {
    const newPoints = generateRegressionDataset(datasetType, 28, noise);
    setPoints(newPoints);
  }, [params.dataset, params.noise]);

  // Ajuste del modelo matemático en JS puro
  const { weights, mse, r2 } = useMemo(() => {
    if (!points.length) {
      return { weights: new Float64Array(params.degree + 1), mse: 0, r2: 0 };
    }
    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);
    return fitPolynomialRidge(xVals, yVals, params.degree, params.alpha);
  }, [points, params.degree, params.alpha]);

  // Actualizar métricas globales para la interfaz
  useEffect(() => {
    let diagnosis = 'Ajuste Óptimo';
    let status = 'good';
    if (params.degree === 1 && (params.dataset === 'sinusoidal' || params.dataset === 'cubic')) {
      diagnosis = 'Subajuste (Underfitting) - Sesgo Alto';
      status = 'warning';
    } else if (params.degree >= 5 && params.alpha === 0 && points.length < 40) {
      diagnosis = 'Sobreajuste (Overfitting) - Varianza Alta';
      status = 'danger';
    } else if (params.alpha > 20) {
      diagnosis = 'Exceso de Regularización';
      status = 'warning';
    }

    setMetrics({
      mse: mse.toFixed(4),
      r2: r2.toFixed(3),
      pointsCount: points.length,
      degree: params.degree,
      alpha: params.alpha,
      diagnosis,
      status
    });
  }, [mse, r2, points.length, params.degree, params.alpha, params.dataset, setMetrics]);

  // Dibujar en Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Sistema de coordenadas matemáticas [-1.15, 1.15] x [-1.35, 1.35]
    const xMin = -1.15, xMax = 1.15;
    const yMin = -1.35, yMax = 1.35;

    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Limpiar fondo
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Cuadrícula sutil
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;

    for (let x = -1.0; x <= 1.0; x += 0.5) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(x.toFixed(1), cx - 10, height - 8);
    }

    for (let y = -1.0; y <= 1.0; y += 0.5) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(y.toFixed(1), 8, cy + 4);
    }

    // Ejes cartesianos principales
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), height);
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(width, toCanvasY(0));
    ctx.stroke();

    // Dibujar Residuos (líneas de error verticales desde cada punto a la curva)
    if (points.length > 0 && points.length <= 60) {
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1.2;
      points.forEach(p => {
        const yPred = predictPolynomial(p.x, weights);
        const px = toCanvasX(p.x);
        const py = toCanvasY(p.y);
        const predY = toCanvasY(yPred);

        // Color según magnitud del error
        const err = Math.abs(p.y - yPred);
        ctx.strokeStyle = err > 0.4 ? 'rgba(244, 63, 94, 0.7)' : 'rgba(251, 146, 60, 0.5)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, predY);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // Dibujar Curva Ajustada
    if (weights.length > 0) {
      // Gradiente brillante
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#38bdf8');
      gradient.addColorStop(0.5, '#0e8ce9');
      gradient.addColorStop(1, '#818cf8');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3.5;
      ctx.beginPath();

      const steps = 180;
      for (let i = 0; i <= steps; i++) {
        const x = xMin + ((xMax - xMin) * i) / steps;
        const y = predictPolynomial(x, weights);
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);

        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Dibujar Puntos de Datos
    points.forEach((p) => {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);

      // Halo exterior
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14, 140, 233, 0.25)';
      ctx.fill();

      // Círculo central
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });

  }, [points, weights]);

  // Manejo de clic para añadir o borrar puntos
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Escalar por resolución interna del canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = clickX * scaleX;
    const cy = clickY * scaleY;

    const xMin = -1.15, xMax = 1.15;
    const yMin = -1.35, yMax = 1.35;

    const toMathX = (px) => xMin + (px / canvas.width) * (xMax - xMin);
    const toMathY = (py) => yMin + ((canvas.height - py) / canvas.height) * (yMax - yMin);

    const mathX = toMathX(cx);
    const mathY = toMathY(cy);

    // Verificar si hizo clic sobre un punto existente para eliminarlo
    const deleteRadius = 0.08;
    const existingIndex = points.findIndex(
      p => Math.hypot(p.x - mathX, p.y - mathY) < deleteRadius
    );

    if (existingIndex !== -1) {
      setPoints(prev => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      // Añadir nuevo punto
      setPoints(prev => [...prev, { x: mathX, y: mathY, id: `custom-${Date.now()}` }].sort((a, b) => a.x - b.x));
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xMin = -1.15, xMax = 1.15;
    const yMin = -1.35, yMax = 1.35;
    const mx = xMin + (clickX / rect.width) * (xMax - xMin);
    const my = yMin + ((rect.height - clickY) / rect.height) * (yMax - yMin);

    setHoverCoord({ x: mx.toFixed(2), y: my.toFixed(2) });
  };

  return (
    <div className="space-y-4">
      {/* Barra superior de controles del canvas */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dataset:</span>
          {[
            { id: 'sinusoidal', label: 'Sinusoidal (No lineal)' },
            { id: 'cubic', label: 'Polinomio Cúbico' },
            { id: 'linear', label: 'Lineal Simple' },
            { id: 'outliers', label: 'Con Outliers Extremos' }
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

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleRegenerate(params.dataset, params.noise)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            title="Generar nueva muestra aleatoria"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Regenerar</span>
          </button>
          <button
            onClick={() => setPoints([])}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30 transition-colors"
            title="Borrar todos los puntos para dibujar desde cero"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Grid: Canvas + Sliders interactivos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Canvas central */}
        <div className="lg:col-span-3 flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-[#0b0f19] shadow-xl relative" ref={containerRef}>
          <div className="relative w-full aspect-[16/10] max-h-[460px]">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onClick={handleCanvasClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverCoord(null)}
              className="w-full h-full cursor-crosshair block"
            />
          </div>

          {/* Barra de ayuda interactiva */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
              <span><strong>Clic:</strong> Añadir punto | <strong>Clic sobre punto:</strong> Eliminar</span>
            </div>
            {hoverCoord && (
              <span className="font-mono text-slate-300">
                x: {hoverCoord.x}, y: {hoverCoord.y}
              </span>
            )}
          </div>
        </div>

        {/* Panel lateral de Sliders e Hiperparámetros */}
        <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-brand-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Hiperparámetros</h4>
          </div>

          {/* Slider 1: Grado Polinómico (1 a 6) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Grado Polinomio (d):</span>
              <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                {params.degree} {params.degree === 1 ? '(Lineal)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={params.degree}
              onChange={(e) => onParamChange('degree', parseInt(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 (Baja Varianza)</span>
              <span>6 (Alta Varianza)</span>
            </div>
          </div>

          {/* Slider 2: Regularización Ridge Alpha (0 a 30) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Ridge Alpha (L2 λ):</span>
              <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                {params.alpha.toFixed(1)} {params.alpha === 0 ? '(Sin Regularizar / OLS)' : ''}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={params.alpha}
              onChange={(e) => onParamChange('alpha', parseFloat(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 (OLS estándar)</span>
              <span>30 (Alta penalización)</span>
            </div>
          </div>

          {/* Slider 3: Nivel de Ruido Gaussiano */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-300">Ruido de datos:</span>
              <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                {params.noise}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={params.noise}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onParamChange('noise', val);
                handleRegenerate(params.dataset, val);
              }}
              className="w-full accent-slate-400 cursor-pointer"
            />
          </div>

          {/* Diagnóstico en tiempo real */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-1">Diagnóstico del Modelo:</div>
            <div className={`p-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
              params.degree >= 5 && params.alpha === 0
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/25'
                : params.degree === 1 && (params.dataset === 'sinusoidal' || params.dataset === 'cubic')
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {params.degree >= 5 && params.alpha === 0
                  ? 'Sobreajuste: El polinomio oscila memorizando ruido.'
                  : params.degree === 1 && (params.dataset === 'sinusoidal' || params.dataset === 'cubic')
                  ? 'Subajuste: Una recta no puede capturar la curvatura.'
                  : 'Ajuste balanceado entre sesgo y varianza.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila de Métricas en vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricsBadge
          label="Coeficiente R²"
          value={r2.toFixed(3)}
          status={r2 > 0.85 ? 'good' : r2 > 0.5 ? 'warning' : 'danger'}
          subtitle="Capacidad de explicar varianza (1.0 = perfecto)"
        />
        <MetricsBadge
          label="Error Cuadrático Medio (MSE)"
          value={mse.toFixed(4)}
          status={mse < 0.05 ? 'good' : mse < 0.15 ? 'warning' : 'danger'}
          subtitle="Promedio de residuos al cuadrado"
        />
        <MetricsBadge
          label="Grado del Modelo"
          value={params.degree}
          subtitle={params.degree === 1 ? 'Lineal estándar' : `Polinomio grado ${params.degree}`}
        />
        <MetricsBadge
          label="Penalización Ridge L2"
          value={params.alpha.toFixed(1)}
          subtitle={params.alpha === 0 ? 'Sin regularización (OLS)' : 'Amortiguación de pesos'}
        />
      </div>
    </div>
  );
}

// ====================================================================
// EXPORTACIÓN PRINCIPAL DEL OBJETO DEL ALGORITMO
// ====================================================================
export default {
  id: 'linear-regression',
  title: 'Regresión Lineal y Polinómica con Ridge (L2)',
  shortTitle: 'Regresión Polinómica',
  category: 'supervised-regression',
  level: 'Principiante',
  badge: 'Fundamentos de ML',
  icon: 'TrendingUp',
  description: 'Aprende cómo ajustar relaciones continuas, el dilema Sesgo vs Varianza y cómo la regularización L2 previene el sobreajuste.',

  defaultParams: {
    degree: 2,
    alpha: 0,
    noise: 15,
    dataset: 'sinusoidal'
  },

  // 1. Pestaña de Teoría e Intuición Matemática
  theory: {
    summary: 'La regresión busca encontrar una función continua f(x) que minimice las discrepancias cuadráticas con respecto a las observaciones observadas.',
    intuition: 'Imagina pasar una cuerda elástica entre un conjunto de clavos dispersos. Una cuerda rígida (recta, grado 1) no doblará lo suficiente (subajuste). Una cuerda infinitamente flexible (polinomio de grado alto) pasará por cada clavo exacto pero se agitará en curvas salvajes sin predecir la tendencia real (sobreajuste). La regularización Ridge actúa aplicando tensión a la cuerda para obligarla a ser suave.',
    useCases: [
      {
        title: 'Valoración Inmobiliaria',
        desc: 'Predecir el precio de una vivienda a partir de metros cuadrados, antigüedad y habitaciones.'
      },
      {
        title: 'Estimación de Demanda Energética',
        desc: 'Modelar el consumo eléctrico horario en función de la temperatura exterior (relación polinómica convexa).'
      },
      {
        title: 'Bioestadística y Farmacología',
        desc: 'Curvas dosis-respuesta para calibrar concentraciones óptimas de medicamentos.'
      }
    ],
    mathFormulas: [
      {
        title: '1. Modelo de Regresión Polinómica',
        latex: 'y = w_0 + w_1 x + w_2 x^2 + \\dots + w_d x^d + \\epsilon = \\sum_{j=0}^{d} w_j x^j + \\epsilon',
        explanation: 'Expandimos la variable escalar x en potencias hasta el grado d para permitir fronteras curvilíneas.'
      },
      {
        title: '2. Función de Pérdida con Regularización Ridge (L2)',
        latex: 'J(w) = \\frac{1}{N} \\sum_{i=1}^{N} (y_i - \\hat{y}_i)^2 + \\alpha \\sum_{j=1}^{d} w_j^2 = \\frac{1}{N}\\|y - Xw\\|^2 + \\alpha \\|w_{1..d}\\|^2',
        explanation: 'Minimiza la suma de residuos al cuadrado (MSE) penalizando el cuadrado de la magnitud de los coeficientes para evitar pesos astronómicos.'
      },
      {
        title: '3. Solución Analítica (Ecuaciones Normales)',
        latex: '\\mathbf{w}^* = (\\mathbf{X}^T \\mathbf{X} + \\alpha \\mathbf{I})^{-1} \\mathbf{X}^T \\mathbf{y}',
        explanation: 'Al añadir alpha * I a la matriz de Gram X^T X garantizamos que siempre sea invertible y numéricamente estable.'
      }
    ],
    tradeoffs: {
      pros: [
        'Solución analítica exacta, determinista y computacionalmente instantánea.',
        'Extremadamente interpretable: los pesos reflejan el impacto directo de cada variable.',
        'Con regularización Ridge (L2), es robusto ante colinealidad numérica.'
      ],
      cons: [
        'Muy sensible a valores atípicos (outliers) debido al término cuadrático (y - pred)^2.',
        'La expansión polinómica sufre la maldición de la dimensionalidad si hay muchas variables de entrada.',
        'Asume independencia del ruido gaussiano homocedástico.'
      ]
    }
  },

  // 2. Generador Dinámico de Código Python
  generatePythonCode: (params) => {
    const isRidge = params.alpha > 0;
    const code = `import numpy as np
import matplotlib.pyplot as plt
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import ${isRidge ? 'Ridge' : 'LinearRegression'}
from sklearn.metrics import mean_squared_error, r2_score

# 1. Generación de datos sintéticos con ruido
np.random.seed(42)
X = np.sort(np.random.uniform(-1, 1, 35)).reshape(-1, 1)
y = np.sin(np.pi * X.ravel() * 1.5) * 0.8 + np.random.normal(0, ${((params.noise || 15) / 100 * 0.4).toFixed(3)}, size=len(X))

# 2. Construcción del Pipeline de scikit-learn
# Se transforman las características a potencias hasta grado ${params.degree}
# y se aplica el estimador lineal correspondiente
model = make_pipeline(
    PolynomialFeatures(degree=${params.degree}, include_bias=False),
    ${isRidge 
      ? `Ridge(alpha=${params.alpha.toFixed(1)}, random_state=42)` 
      : `LinearRegression()`}
)

# 3. Entrenamiento (Ajuste del modelo)
model.fit(X, y)

# 4. Evaluación de rendimiento
y_pred = model.predict(X)
mse = mean_squared_error(y, y_pred)
r2 = r2_score(y, y_pred)

print(f"Grado del Polinomio: {${params.degree}}")
print(f"MSE: {mse:.4f}")
print(f"R²: {r2:.4f}")

# 5. Visualización de la curva ajustada
X_plot = np.linspace(-1.1, 1.1, 200).reshape(-1, 1)
plt.figure(figsize=(8, 5))
plt.scatter(X, y, color='dodgerblue', label='Datos observados')
plt.plot(X_plot, model.predict(X_plot), color='crimson', lw=2, label=f'Modelo (Grado {${params.degree}})')
plt.title(f"Regresión Polinómica (Grado={${params.degree}}, Alpha={${params.alpha}})")
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()`;

    // Resaltamos las líneas donde se configuran los hiperparámetros
    const highlightedLines = [18, 19, 20];

    const paramExplanations = [
      {
        param: `degree = ${params.degree}`,
        desc: 'Potencia máxima a la que se eleva la variable independiente x.',
        biasVarianceImpact: params.degree === 1
          ? 'Grado 1: Sesgo alto (Underfitting). Incapaz de modelar curvas no lineales.'
          : params.degree <= 3
          ? 'Grado 2-3: Buen equilibrio entre capacidad de representación y generalización.'
          : 'Grado 5+: Varianza muy alta (Overfitting). El polinomio memoriza el ruido y crea oscilaciones salvajes en los bordes.'
      },
      {
        param: `alpha = ${params.alpha}`,
        desc: 'Constante de regularización L2 (Ridge). Controla la penalización a coeficientes gigantescos.',
        biasVarianceImpact: params.alpha === 0
          ? 'Alpha = 0: Estimación por Mínimos Cuadrados Ordinarios (OLS). Cero penalización, riesgo alto de overfitting en grados altos.'
          : 'Alpha > 0: Contrae los pesos hacia cero, reduciendo la varianza del modelo a cambio de un ligero sesgo controlado.'
      }
    ];

    return { code, highlightedLines, paramExplanations };
  },

  // 3. Retos Prácticos para el Alumno
  challenges: [
    {
      id: 1,
      title: 'Misión 1: Provocar Overfitting Extremo',
      difficulty: 'Fácil',
      goal: 'Provoca un sobreajuste severo en el modelo con pocos datos ruidosos.',
      actionHint: 'Selecciona el dataset "Sinusoidal", sube el Grado a 6 y asegúrate de que Alpha = 0. Luego haz clic para añadir un único punto atípico cerca de la esquina superior derecha.',
      solution: 'Observa cómo el polinomio de grado 6 cambia bruscamente toda su trayectoria solo para tocar ese nuevo punto. El R² sobre los puntos de entrenamiento puede parecer alto, pero la curva en los extremos se descontrola completamente.'
    },
    {
      id: 2,
      title: 'Misión 2: Domar el Sobreajuste con Ridge',
      difficulty: 'Media',
      goal: 'Mantén el grado en 6, pero estabiliza la curva usando regularización L2.',
      actionHint: 'Con Grado = 6 y el dataset con outliers o ruido, arrastra el slider de Ridge Alpha desde 0 hasta 10 o 15.',
      solution: 'Al aumentar Alpha, la función de coste penaliza la magnitud de los pesos (w_j^2). La curva se suaviza dramáticamente y ya no se retuerce para perseguir el ruido, logrando una mejor generalización.'
    },
    {
      id: 3,
      title: 'Misión 3: Diagnosticar Subajuste (Underfitting)',
      difficulty: 'Fácil',
      goal: 'Identifica los síntomas de un modelo con sesgo alto e incapacidad de aprendizaje.',
      actionHint: 'Selecciona el dataset "Polinomio Cúbico" y ajusta el Grado a 1.',
      solution: 'Una línea recta es estructuralmente incapaz de curvarse para seguir una cúbica. El MSE permanece alto y el R² cae fuertemente sin importar cuántos datos añadamos. La solución es aumentar la capacidad del modelo (aumentar grado a 3).'
    }
  ],

  // 4. Componente Visualizador
  Visualizer: LinearRegressionVisualizer
};
