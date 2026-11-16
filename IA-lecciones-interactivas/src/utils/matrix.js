/**
 * Utilidades de álgebra lineal y matemáticas en JavaScript puro para modelos de ML.
 */

// Transpuesta de matriz A (filas x cols -> cols x filas)
export function transpose(A) {
  const m = A.length;
  const n = A[0].length;
  const AT = Array.from({ length: n }, () => new Float64Array(m));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      AT[j][i] = A[i][j];
    }
  }
  return AT;
}

// Multiplicación matricial C = A * B
export function multiply(A, B) {
  const m = A.length;
  const k = A[0].length;
  const n = B[0].length;
  const C = Array.from({ length: m }, () => new Float64Array(n));
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      const a = A[i][p];
      for (let j = 0; j < n; j++) {
        C[i][j] += a * B[p][j];
      }
    }
  }
  return C;
}

// Multiplicación matriz por vector: y = A * x
export function multiplyVector(A, x) {
  const m = A.length;
  const k = A[0].length;
  const y = new Float64Array(m);
  for (let i = 0; i < m; i++) {
    let sum = 0;
    for (let j = 0; j < k; j++) {
      sum += A[i][j] * x[j];
    }
    y[i] = sum;
  }
  return y;
}

// Resuelve sistema lineal A * w = b mediante eliminación de Gauss-Jordan con pivoteo parcial
export function solveLinearSystem(A, b) {
  const n = A.length;
  // Matriz aumentada [A | b]
  const M = Array.from({ length: n }, (row, i) => {
    const r = new Float64Array(n + 1);
    for (let j = 0; j < n; j++) r[j] = A[i][j];
    r[n] = b[i];
    return r;
  });

  for (let i = 0; i < n; i++) {
    // Buscar pivote máximo
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      const val = Math.abs(M[k][i]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      // Matriz singular o casi singular, agregar pequeña regularización
      M[i][i] += 1e-6;
    }

    // Intercambiar fila si es necesario
    if (maxRow !== i) {
      const tmp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = tmp;
    }

    // Normalizar fila pivote
    const pivot = M[i][i];
    for (let j = i; j <= n; j++) {
      M[i][j] /= pivot;
    }

    // Eliminar resto de filas
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        if (factor !== 0) {
          for (let j = i; j <= n; j++) {
            M[k][j] -= factor * M[i][j];
          }
        }
      }
    }
  }

  const solution = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    solution[i] = M[i][n];
  }
  return solution;
}

// Expansión de características polinómicas: x -> [1, x, x^2, ..., x^d]
export function polynomialFeatures(xValues, degree) {
  const N = xValues.length;
  const X = Array.from({ length: N }, (_, i) => {
    const x = xValues[i];
    const row = new Float64Array(degree + 1);
    let term = 1;
    for (let d = 0; d <= degree; d++) {
      row[d] = term;
      term *= x;
    }
    return row;
  });
  return X;
}

/**
 * Ajusta una Regresión Polinómica con Regularización Ridge (L2):
 * min_w ||y - Xw||^2 + alpha * ||w_{1..d}||^2
 * (Normalmente no se penaliza el término independiente w_0)
 */
export function fitPolynomialRidge(xValues, yValues, degree, alpha = 0) {
  if (!xValues.length || xValues.length !== yValues.length) {
    return { weights: new Float64Array(degree + 1), mse: 0, r2: 0 };
  }

  const X = polynomialFeatures(xValues, degree);
  const XT = transpose(X);
  const XTX = multiply(XT, X);
  const XTy = multiplyVector(XT, yValues);

  const numCols = degree + 1;
  // Añadir regularización Ridge L2 (lambda * I)
  // Nota didáctica: Por convención estadística, el bias (w_0) no se penaliza
  for (let j = 1; j < numCols; j++) {
    XTX[j][j] += alpha;
  }
  // Pequeño epsilon numérico para estabilidad si alpha es 0
  XTX[0][0] += 1e-8;

  const weights = solveLinearSystem(XTX, XTy);

  // Calcular predicciones y métricas
  const N = yValues.length;
  let sse = 0; // Sum of Squared Errors
  let sumY = 0;
  for (let i = 0; i < N; i++) {
    sumY += yValues[i];
  }
  const meanY = sumY / N;
  let sst = 0; // Total Sum of Squares

  for (let i = 0; i < N; i++) {
    const pred = predictPolynomial(xValues[i], weights);
    const err = yValues[i] - pred;
    sse += err * err;
    const diffMean = yValues[i] - meanY;
    sst += diffMean * diffMean;
  }

  const mse = sse / N;
  const r2 = sst === 0 ? 1 : Math.max(-1, 1 - sse / sst);

  return { weights, mse, r2 };
}

// Evalúa el polinomio en x: y = w_0 + w_1 * x + w_2 * x^2 + ...
export function predictPolynomial(x, weights) {
  let y = 0;
  let term = 1;
  for (let i = 0; i < weights.length; i++) {
    y += weights[i] * term;
    term *= x;
  }
  return y;
}
