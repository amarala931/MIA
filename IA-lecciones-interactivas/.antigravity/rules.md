# Guía de Contribución y Esquema de Algoritmos (.antigravity/rules.md)

Este documento define la arquitectura y el estándar estricto que debe seguir cualquier nuevo algoritmo agregado al catálogo interactivo de **IA Lecciones Interactivas**.

---

## 1. Estructura de Carpetas

```text
src/
├── algorithms/
│   ├── index.js                     <-- Registro centralizado de algoritmos
│   ├── linear-regression.jsx        <-- Algoritmo 1: Regresión Lineal y Polinómica
│   ├── knn-classification.jsx       <-- Algoritmo 2: K-Nearest Neighbors
│   ├── kmeans-clustering.jsx        <-- Algoritmo 3: K-Means Clustering
│   └── [nuevo-algoritmo].jsx        <-- Nuevos algoritmos siguiendo la plantilla
├── components/
│   ├── Layout.jsx                   <-- Layout general (Navbar, Sidebar responsive)
│   ├── Sidebar.jsx                  <-- Navegación con categorías y badges de estado
│   ├── MathBlock.jsx                <-- Renderizador KaTeX con soporte para LaTeX interactivo
│   ├── PythonPanel.jsx              <-- Resaltador de sintaxis dinámico, retos y exportación
│   ├── MetricsBadge.jsx             <-- Tarjetas de métricas en vivo a 60fps
│   └── TabNavigation.jsx            <-- Pestañas: Teoría, Laboratorio, Python
└── utils/
    ├── matrix.js                    <-- Álgebra lineal en JS puro (inversión de matrices, OLS)
    ├── datasets.js                  <-- Generadores sintéticos de puntos (lunas, círculos, etc.)
    └── exportPython.js              <-- Descarga de scripts ejecutables .py
```

---

## 2. Esquema Estricto del Objeto Exportado por Cada Algoritmo

Cada archivo en `src/algorithms/<nombre>.jsx` debe exportar por defecto (`export default`) un objeto con la siguiente forma:

```javascript
export default {
  // Identificador URL-friendly único
  id: 'logistic-regression',
  
  // Títulos y metadatos
  title: 'Regresión Logística',
  shortTitle: 'Reg. Logística',
  category: 'supervised-classification', 
  // Categorías válidas:
  // - 'supervised-regression'
  // - 'supervised-classification'
  // - 'unsupervised-clustering'
  // - 'upcoming'

  level: 'Principiante', // 'Principiante' | 'Intermedio' | 'Avanzado'
  badge: 'Clasificación Lineal',
  description: 'Descripción concisa de qué hace el algoritmo y su intuición visual.',
  icon: 'GitCommit', // Nombre de icono compatible con lucide-react

  // 1. Pestaña: Teoría e Intuición
  theory: {
    summary: 'Resumen didáctico del algoritmo.',
    intuition: 'Analogía o intuición geométrica comprensible para alumnos.',
    useCases: [
      { title: 'Caso 1', desc: 'Descripción del uso en la industria.' },
      { title: 'Caso 2', desc: 'Descripción del segundo caso de uso.' }
    ],
    mathFormulas: [
      {
        title: 'Función Sigmoide',
        latex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}',
        explanation: 'Mapea cualquier valor real al intervalo (0, 1) como probabilidad.'
      }
    ],
    tradeoffs: {
      pros: [
        'Interpretable y probabilístico.',
        'Rápido de entrenar.'
      ],
      cons: [
        'Solo aprende fronteras lineales sin trucos de kernels.',
        'Sensible a correlaciones y outliers.'
      ]
    }
  },

  // 2. Parámetros del Laboratorio
  defaultParams: {
    learningRate: 0.1,
    iterations: 100,
    threshold: 0.5
  },

  // 3. Generación Dinámica de Código Python (scikit-learn)
  generatePythonCode: (params) => {
    return {
      code: `import numpy as np\n...`,
      highlightedLines: [12, 13], // Números de línea a resaltar basados en los sliders activos
      paramExplanations: [
        {
          param: 'C / regularización',
          desc: 'Inverso de la fuerza de regularización.',
          biasVarianceImpact: 'Valores altos reducen el sesgo pero aumentan el riesgo de overfitting.'
        }
      ]
    }
  },

  // 4. Retos Prácticos para el Alumno
  challenges: [
    {
      id: 1,
      title: 'Misión 1: Frontera de decisión no lineal',
      difficulty: 'Media',
      goal: 'Consigue separar el dataset de círculos concéntricos.',
      actionHint: 'Prueba a añadir regularización o modificar el umbral.',
      solution: 'Un modelo puramente lineal no puede trazar un círculo sin ingeniería de características polinómicas.'
    }
  ],

  // 5. Componente Visualizador Interactivo
  // Recibe: { params, onParamChange, metrics, setMetrics }
  Visualizer: ({ params, onParamChange, metrics, setMetrics }) => {
    // Canvas o SVG interactivo a 60 FPS con listeners de clic para añadir/borrar puntos
    return (
      <div className="w-full h-full">...</div>
    )
  }
}
```

---

## 3. Requisitos para el Visualizador (Laboratorio)
1. **Puntos interactivos:** El usuario debe poder hacer clic en el gráfico para añadir nuevos datos (o elegir la clase de punto) y resetear al estado inicial con presets.
2. **Respuesta en tiempo real (60 FPS):** Usar `requestAnimationFrame` o cálculo vectorizado ligero en JS puro sin bloquear el hilo principal.
3. **Métricas en vivo:** Llamar a `setMetrics({ ... })` con métricas pertinentes (MSE, $R^2$, Accuracy, Inercia, Tiempo de convergencia).
4. **Accesibilidad y feedback:** Tooltips informativos, leyendas claras de color y cursores descriptivos.

---

## 4. Registro de Nuevos Algoritmos
Para que un algoritmo aparezca automáticamente en la barra lateral y en el enrutamiento:
1. Crear el archivo `src/algorithms/<id>.jsx`.
2. Importarlo y agregarlo al array `algorithms` en `src/algorithms/index.js`.
3. ¡Listo! El sidebar y las pestañas se configurarán automáticamente.
