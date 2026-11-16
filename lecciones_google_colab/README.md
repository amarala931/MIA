# Lecciones de Google Colab

Esta carpeta reúne cuadernos Jupyter (`.ipynb`) para las prácticas del módulo. Se pueden abrir en Google Colab sin instalar un entorno local o descargar y ejecutar con Jupyter.

## Contenido

```text
lecciones_google_colab/
└── UD1/
    └── entrenamiento_supervisado.ipynb
```

### UD1 — Entrenamiento supervisado

El notebook [entrenamiento_supervisado.ipynb](./UD1/entrenamiento_supervisado.ipynb) introduce el aprendizaje supervisado mediante un ejercicio de **regresión lineal simple**. Usa el conjunto de diabetes incluido en scikit-learn y el índice de masa corporal (BMI) como única característica para estimar la progresión de la enfermedad.

La práctica recorre estos pasos:

1. Cargar y explorar los datos, incluida una visualización inicial.
2. Separar las observaciones en conjuntos de entrenamiento y prueba (80/20).
3. Entrenar un modelo de regresión lineal.
4. Generar predicciones y evaluar el error absoluto medio (MAE).
5. Visualizar la recta ajustada y probar predicciones para nuevos valores de BMI.

**Abrir en Google Colab:** [entrenamiento_supervisado.ipynb](https://colab.research.google.com/github/amarala931/MIA/blob/main/lecciones_google_colab/UD1/entrenamiento_supervisado.ipynb)

## Ejecución local

El cuaderno usa Python 3 y las bibliotecas `pandas`, `numpy`, `seaborn`, `matplotlib` y `scikit-learn`. Para ejecutarlo localmente, instala las dependencias si aún no están disponibles en tu entorno y abre el archivo con Jupyter Notebook o JupyterLab.

## Nota sobre el conjunto de datos

El ejercicio tiene fines educativos. El conjunto de datos y el modelo simplificado no son herramientas clínicas y no deben utilizarse para diagnosticar ni tomar decisiones médicas.
