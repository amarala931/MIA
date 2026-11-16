/**
 * Generadores de datasets sintéticos clásicos para Machine Learning en el navegador.
 */

// Utilidad para números aleatorios con distribución Gaussiana (Box-Muller)
export function randomGaussian(mean = 0, stdev = 1) {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdev;
}

// ==========================================
// DATASETS PARA REGRESIÓN
// Rango normalizado x en [-1, 1], y aproximadamente en [-1.2, 1.2]
// ==========================================

export function generateRegressionDataset(type = 'sinusoidal', count = 30, noiseLevel = 15) {
  const noiseScale = (noiseLevel / 100) * 0.4;
  const points = [];

  for (let i = 0; i < count; i++) {
    // Distribuir x con ligera dispersión uniforme en [-0.95, 0.95]
    const x = -0.9 + (1.8 * i) / (count - 1) + (Math.random() - 0.5) * 0.05;
    let yTrue = 0;

    switch (type) {
      case 'linear':
        yTrue = 0.8 * x + 0.05;
        break;
      case 'sinusoidal':
        yTrue = Math.sin(Math.PI * x * 1.5) * 0.8;
        break;
      case 'cubic':
        yTrue = 1.3 * Math.pow(x, 3) - 0.4 * x;
        break;
      case 'step':
        yTrue = x < 0 ? -0.6 : 0.6;
        break;
      case 'outliers':
        yTrue = 0.6 * x;
        // Puntos específicos con gran error intencionado
        if (i === Math.floor(count * 0.25)) yTrue = 0.9;
        if (i === Math.floor(count * 0.75)) yTrue = -0.85;
        break;
      default:
        yTrue = Math.sin(Math.PI * x) * 0.8;
    }

    const noise = type === 'outliers' ? (Math.random() - 0.5) * 0.08 : randomGaussian(0, noiseScale);
    const y = Math.max(-1.4, Math.min(1.4, yTrue + noise));
    points.push({ x, y, id: `reg-${i}-${Date.now()}` });
  }

  return points.sort((a, b) => a.x - b.x);
}

// ==========================================
// DATASETS PARA CLASIFICACIÓN (KNN)
// Puntos con clase 0 o 1 en coordenadas [-1, 1] x [-1, 1]
// ==========================================

export function generateClassificationDataset(type = 'moons', count = 60, noiseLevel = 10) {
  const points = [];
  const noiseScale = (noiseLevel / 100) * 0.15;
  const n = Math.floor(count / 2);

  if (type === 'moons') {
    // Luna Superior (Clase 0)
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * i) / (n - 1);
      const r = 0.65;
      const x = r * Math.cos(angle) - 0.3 + randomGaussian(0, noiseScale);
      const y = r * Math.sin(angle) - 0.1 + randomGaussian(0, noiseScale);
      points.push({ x, y, label: 0, id: `knn-0-${i}` });
    }
    // Luna Inferior (Clase 1)
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * i) / (n - 1);
      const r = 0.65;
      const x = r * Math.cos(angle) + 0.3 + randomGaussian(0, noiseScale);
      const y = -r * Math.sin(angle) + 0.2 + randomGaussian(0, noiseScale);
      points.push({ x, y, label: 1, id: `knn-1-${i}` });
    }
  } else if (type === 'circles') {
    // Círculo Interior (Clase 0)
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.35 + randomGaussian(0, noiseScale * 0.5);
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      points.push({ x, y, label: 0, id: `knn-c0-${i}` });
    }
    // Círculo Exterior (Clase 1)
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.78 + randomGaussian(0, noiseScale * 0.5);
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      points.push({ x, y, label: 1, id: `knn-c1-${i}` });
    }
  } else {
    // Blobs lineales / gaussianos
    // Centro 0: (-0.45, -0.35)
    for (let i = 0; i < n; i++) {
      const x = -0.4 + randomGaussian(0, 0.22 + noiseScale);
      const y = -0.3 + randomGaussian(0, 0.22 + noiseScale);
      points.push({ x, y, label: 0, id: `knn-b0-${i}` });
    }
    // Centro 1: (0.45, 0.35)
    for (let i = 0; i < n; i++) {
      const x = 0.4 + randomGaussian(0, 0.22 + noiseScale);
      const y = 0.3 + randomGaussian(0, 0.22 + noiseScale);
      points.push({ x, y, label: 1, id: `knn-b1-${i}` });
    }
  }

  return points;
}

// ==========================================
// DATASETS PARA CLUSTERING (K-MEANS)
// ==========================================

export function generateClusteringDataset(type = '3blobs', count = 75) {
  const points = [];

  if (type === '3blobs') {
    const centers = [
      { x: -0.5, y: -0.4, std: 0.16 },
      { x: 0.5, y: -0.4, std: 0.16 },
      { x: 0.0, y: 0.5, std: 0.18 }
    ];
    const perCenter = Math.floor(count / centers.length);
    centers.forEach((c, idx) => {
      for (let i = 0; i < perCenter; i++) {
        points.push({
          x: c.x + randomGaussian(0, c.std),
          y: c.y + randomGaussian(0, c.std),
          id: `km-${idx}-${i}`
        });
      }
    });
  } else if (type === 'anisotropic') {
    // Grupos alargados
    const centers = [
      { x: -0.4, y: 0.0, angle: Math.PI / 4 },
      { x: 0.4, y: 0.0, angle: -Math.PI / 4 }
    ];
    const perCenter = Math.floor(count / 2);
    centers.forEach((c, idx) => {
      for (let i = 0; i < perCenter; i++) {
        const u = randomGaussian(0, 0.35);
        const v = randomGaussian(0, 0.08);
        const cos = Math.cos(c.angle);
        const sin = Math.sin(c.angle);
        points.push({
          x: c.x + (u * cos - v * sin),
          y: c.y + (u * sin + v * cos),
          id: `km-an-${idx}-${i}`
        });
      }
    });
  } else {
    // Uniforme / Sin estructura obvia
    for (let i = 0; i < count; i++) {
      points.push({
        x: (Math.random() - 0.5) * 1.6,
        y: (Math.random() - 0.5) * 1.6,
        id: `km-un-${i}`
      });
    }
  }

  return points;
}
