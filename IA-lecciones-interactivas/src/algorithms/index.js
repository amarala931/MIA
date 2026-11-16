import linearRegression from './linear-regression';
import knnClassification from './knn-classification';
import kmeansClustering from './kmeans-clustering';

// Catálogo de algoritmos activos totalmente funcionales
export const activeAlgorithms = [
  linearRegression,
  knnClassification,
  kmeansClustering
];

// Temas y módulos futuros del curso (tarjetas informativas con badge "Próximamente")
export const upcomingAlgorithms = [
  {
    id: 'neural-network-mlp',
    title: 'Redes Neuronales: Perceptrón Multicapa y Backpropagation',
    shortTitle: 'Perceptrón Multicapa',
    category: 'upcoming',
    level: 'Intermedio',
    badge: 'Deep Learning',
    icon: 'Cpu',
    description: 'Propagación hacia adelante, funciones de activación (ReLU, Sigmoid) y descenso del gradiente mediante retropropagación del error.',
    isLocked: true,
    releaseInfo: 'Próximamente en el curso: Módulo Deep Learning'
  },
  {
    id: 'decision-trees',
    title: 'Árboles de Decisión y Random Forest',
    shortTitle: 'Árboles de Decisión',
    category: 'upcoming',
    level: 'Principiante',
    badge: 'Ensemble Learning',
    icon: 'GitFork',
    description: 'División recursiva basada en impureza de Gini y Entropía, poda contra sobreajuste y agregación bootstrap (bagging).',
    isLocked: true,
    releaseInfo: 'Próximamente en el curso: Módulo Modelos Basados en Árboles'
  },
  {
    id: 'svm',
    title: 'Support Vector Machines (SVM)',
    shortTitle: 'SVM y Kernel Trick',
    category: 'upcoming',
    level: 'Avanzado',
    badge: 'Margen Máximo',
    icon: 'Maximize2',
    description: 'Hiperplanos de margen óptimo, vectores de soporte y truco del kernel (RBF) para transformar espacios no lineales.',
    isLocked: true,
    releaseInfo: 'Próximamente en el curso: Módulo Clasificación Avanzada'
  },
  {
    id: 'pca-dimensionality',
    title: 'Análisis de Componentes Principales (PCA)',
    shortTitle: 'PCA Dimensionalidad',
    category: 'upcoming',
    level: 'Intermedio',
    badge: 'No Supervisado',
    icon: 'Minimize2',
    description: 'Proyección ortogonal en autovectores de máxima varianza y compresión de datos multidimensionales.',
    isLocked: true,
    releaseInfo: 'Próximamente en el curso: Módulo Reducción de Dimensionalidad'
  },
  {
    id: 'reinforcement-learning-q',
    title: 'Aprendizaje por Refuerzo: Q-Learning en GridWorld',
    shortTitle: 'Q-Learning',
    category: 'upcoming',
    level: 'Avanzado',
    badge: 'Reinforcement Learning',
    icon: 'Gamepad2',
    description: 'Agentes autónomos, balance exploración-explotación (epsilon-greedy), recompensas acumuladas y ecuación de Bellman.',
    isLocked: true,
    releaseInfo: 'Próximamente en el curso: Módulo Aprendizaje por Refuerzo'
  }
];

// Estructura oficial de bloques temáticos del curso
export const COURSE_CATEGORIES = [
  {
    id: 'supervised-regression',
    title: 'Aprendizaje Supervisado: Regresión',
    shortName: 'Regresión',
    description: 'Modelado y predicción de variables continuas y relaciones numéricas.',
    badge: 'Módulo 1'
  },
  {
    id: 'supervised-classification',
    title: 'Aprendizaje Supervisado: Clasificación',
    shortName: 'Clasificación',
    description: 'Separación y asignación de etiquetas discretas y categorías categóricas.',
    badge: 'Módulo 2'
  },
  {
    id: 'unsupervised-clustering',
    title: 'Aprendizaje No Supervisado: Clustering',
    shortName: 'Clustering',
    description: 'Detección automática de agrupaciones y estructuras ocultas sin etiquetas.',
    badge: 'Módulo 3'
  },
  {
    id: 'upcoming',
    title: 'Próximamente (Redes Neuronales / Aprendizaje por Refuerzo)',
    shortName: 'Próximamente',
    description: 'Módulos avanzados en preparación para el temario semestral.',
    badge: 'En Desarrollo',
    isUpcoming: true
  }
];

// Agrupa los algoritmos automáticamente por categoría para el sidebar
export function getCategoriesWithAlgorithms() {
  const all = [...activeAlgorithms, ...upcomingAlgorithms];
  return COURSE_CATEGORIES.map(category => ({
    ...category,
    algorithms: all.filter(algo => algo.category === category.id)
  }));
}

// Búsqueda de algoritmo por ID
export function getAlgorithmById(id) {
  return [...activeAlgorithms, ...upcomingAlgorithms].find(algo => algo.id === id) || activeAlgorithms[0];
}

export default activeAlgorithms;
