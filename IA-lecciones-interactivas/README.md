# AI Lab Interactivo 🎓🤖
### Plataforma Educativa Modular y 100% Portable para Enseñar Algoritmos de Machine Learning

Una aplicación web educativa, reactiva y portable diseñada para la docencia universitaria y técnica de Inteligencia Artificial y Machine Learning. Combina **intuición visual en tiempo real**, **rigor matemático con KaTeX** e **implementación en Python (`scikit-learn`) con sincronización dinámica de hiperparámetros**.

---

## 🚀 Características Principales

- **100% Client-Side y Portable:** Sin backend ni dependencias de servidor. Ejecutable en cualquier navegador moderno.
- **Doble Modo de Compilación:**
  - `npm run build`: Genera una aplicación estática lista para desplegar en Vercel, Netlify o GitHub Pages.
  - `npm run build:singlefile`: Compila **TODO** el HTML, CSS, JavaScript y fuentes matemáticas en **un único archivo `.html` autocontenido**, ideal para que los estudiantes lo abran en un pendrive o sin conexión a internet.
- **Laboratorio Interactivo a 60 FPS:**
  - Lienzo interactivo para añadir, mover o eliminar puntos haciendo clic.
  - Generación de datasets sintéticos clásicos (lunas, círculos, blobs, ruido Gaussiano).
  - Cálculo instantáneo de métricas ($R^2$, MSE, Precisión, Inercia WCSS, Iteraciones).
- **Código Python Dinámico:**
  - El bloque de código `scikit-learn` se reescribe al instante mientras el alumno desplaza los controles.
  - Resaltado de líneas alteradas y panel didáctico de Sesgo vs Varianza (*Underfitting* vs *Overfitting*).
  - Botón para copiar y **descargar directamente el script `.py` ejecutable**.
- **Misiones y Retos Prácticos:** Retos guiados paso a paso para experimentar en clase.

---

## 📚 Bloques Temáticos y Algoritmos Disponibles

### 1. Aprendizaje Supervisado: Regresión
- **Regresión Lineal y Polinómica con Regularización Ridge (L2):**
  - Ajuste de grado polinómico ($d=1$ a $d=6$).
  - Visualización de residuos (errores verticales) y penalización $\alpha$ de Ridge.

### 2. Aprendizaje Supervisado: Clasificación
- **K-Nearest Neighbors (KNN):**
  - Ajuste interactivo de $K$ (1 a 15), distancia Euclídea vs Manhattan y pesos uniformes vs por distancia.
  - Mapa de calor de frontera de decisión en tiempo real y sonda de prueba con trazas a los vecinos más cercanos.

### 3. Aprendizaje No Supervisado: Clustering
- **K-Means Clustering:**
  - Control paso a paso: *Inicialización $\to$ Asignación $\to$ Recálculo de centroides $\to$ Convergencia*.
  - Cálculo de inercia y visualización de trayectorias de centroides.

### 4. Próximamente (Roadmap del Curso)
- *Redes Neuronales (Perceptrón Multicapa y Backpropagation)*
- *Árboles de Decisión y Random Forests*
- *Máquinas de Vectores de Soporte (SVM)*
- *Reducción de Dimensionalidad (PCA)*
- *Aprendizaje por Refuerzo (Q-Learning en GridWorld)*

---

## 🛠️ Instalación y Uso

### Prerrequisitos
- Node.js (v18 o superior) y npm.

### Ejecución en Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor local interactivo
npm run dev
```

### Compilación para Distribución Estándar
```bash
npm run build
# Los archivos listos para producción se generan en dist/
```

### Compilación en un Único Archivo Portable (.html)
```bash
npm run build:singlefile
# Genera dist-singlefile/index.html (¡Ábrelo directamente con doble clic sin servidor!)
```

---

## 🧩 Cómo Añadir Nuevos Algoritmos

El proyecto utiliza una arquitectura de plugins modulares. Para añadir un nuevo algoritmo:

1. Crea un archivo en `src/algorithms/<mi-algoritmo>.jsx`.
2. Implementa el esquema documentado en [.antigravity/rules.md](file:///.antigravity/rules.md).
3. Regístralo en `src/algorithms/index.js`.
4. La barra lateral, las pestañas de teoría, el laboratorio y el generador de Python se integrarán automáticamente.

---

## 📄 Licencia
Distribuido bajo licencia MIT con propósitos educativos.
