# 📊 Introducción a Ciencia de Datos

> Repositorio del curso práctico de Ciencia de Datos con Python, orientado al análisis exploratorio, visualización y estadística descriptiva aplicada a datasets reales.

[![GitHub](https://img.shields.io/badge/GitHub-Juan--Vega18-black?logo=github)](https://github.com/Juan-Vega18/INTRODUC.-CIENCIA-DE-DATOS)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![Jupyter](https://img.shields.io/badge/Jupyter-Notebook-orange?logo=jupyter)](https://jupyter.org/)
[![Colab](https://img.shields.io/badge/Google-Colab-F9AB00?logo=googlecolab)](https://colab.research.google.com/)

---

## 📁 Estructura del Repositorio

```
INTRODUC.-CIENCIA-DE-DATOS/
│
├── 📓 clase_4_pandas_profilereport.py          # Clase 4 – EDA con ydata-profiling
├── 📓 Clase_boxplot_introduc.ipynb             # Clase 5A – Introducción al Boxplot
├── 📓 clase5_multiples_boxplots_y_anatomia...  # Clase 5B – Anatomía del Boxplot (dataset TechCorp)
├── 📓 clase_5_analisis_de_clientes.ipynb       # Clase 5C – Análisis de Clientes
├── 📓 Copy_of_clase_5_analisis_de_clientes...  # Clase 5C (extendida) – Correlación y Plotly
├── 📄 customers_1.csv                          # Dataset principal del curso
└── 📄 LICENSE
```

---

## 🗂️ Contenidos del Curso

### Clase 4 – Análisis Exploratorio con `ydata-profiling`

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1bRgkd8PWL8s7weaRmif6xs3i6M64ypuj)

Introducción al análisis exploratorio automatizado. Se trabajó con un dataset de tarjetas de crédito (`credit_card.csv`).

**Temas cubiertos:**

| Tema | Descripción |
|------|-------------|
| `df.info()` | Estructura del dataframe, tipos y nulos |
| `df.describe()` | Estadística descriptiva básica |
| `isnull().sum()` | Conteo de valores nulos por columna |
| `value_counts()` | Frecuencia de categorías |
| `plt.hist()` | Histogramas con matplotlib |
| `sns.histplot()` | Histogramas con seaborn |
| `sns.boxplot()` | Boxplot comparativo por género |
| `ProfileReport` | Reporte HTML automatizado con `ydata-profiling` |

**Snippet de ejemplo – Histograma con matplotlib:**
```python
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 10))
plt.hist(df['CREDIT'], bins=1000, histtype='stepfilled',
         align='right', color='orange', orientation='horizontal')
plt.show()
```

**Snippet de ejemplo – Reporte automatizado:**
```python
from ydata_profiling import ProfileReport

profile = ProfileReport(df, title="Profiling Report")
profile.to_file("your_report.html")
```

---

### Clase 5A – Introducción al Boxplot

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Juan-Vega18/INTRODUC.-CIENCIA-DE-DATOS/blob/main/Clase_boxplot_introduc.ipynb)

Construcción manual del boxplot e introducción a los conceptos estadísticos fundamentales.

**Dataset de ejemplo (manual):**

| Departamento | Salarios |
|--------------|----------|
| Data | 4500, 4700, 5000, 5200, 12000 |
| Marketing | 3000, 3100, 3200, 3300, 9000 |
| Engineering | 6000, 6100, 6200, 6300, 6400 |

**Fórmulas del IQR aplicadas:**

```
IQR  = Q3 - Q1
Límite inferior = Q1 - 1.5 × IQR
Límite superior = Q3 + 1.5 × IQR
```

**Métricas agregadas con pandas:**
```python
columnas = df.groupby('Department')['Salary']
columnas.agg(['mean', 'median', 'min', 'max', 'std'])
```

---

### Clase 5B – Anatomía del Boxplot y Múltiples Boxplots

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Juan-Vega18/INTRODUC.-CIENCIA-DE-DATOS/blob/main/clase5_multiples_boxplots_y_anatomia_del_boxplot.ipynb)

Generación de un dataset sintético complejo de 1000 empleados de la empresa ficticia **TechCorp**, análisis de medidas de tendencia central y visualización de outliers reales.

**Dataset generado con `numpy`:**

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `ID_Empleado` | int | Identificador único |
| `Departamento` | categórica | Ingeniería / Ventas / Marketing / Directivos |
| `Edad` | int | Distribución normal (μ=34, σ=8) |
| `Años_Experiencia` | int | Normal recortada (0–40 años) |
| `Puntaje_desempeño` | float | Normal (μ=75, σ=12), rango 0–100 |
| `Salario_USD` | float | Salario base + experiencia + ruido normal |

**Outliers inyectados (CEOs):**
```python
outlier_idx = df_hr[df_hr['Departamento'] == 'Directivos'].sample(5).index
df_hr.loc[outlier_idx, 'Salario_USD'] = [1_500_000, 2_800_000, 320_000, 190_000, 450_000]
```

**Ejemplo – Boxplot con anatomía completa:**
```python
sns.boxplot(x=df_hr['Edad'], color='lightgreen', width=0.4)

plt.axvline(Q1,      color='blue',   linestyle='--', label=f'Q1 ({Q1:.0f} años)')
plt.axvline(Q3,      color='red',    linestyle='--', label=f'Q3 ({Q3:.0f} años)')
plt.axvline(lim_sup, color='purple', linestyle='--', label=f'Frontera Outlier Sup ({lim_sup:.0f})')
```

---

### Clase 5C – Análisis de Clientes

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Juan-Vega18/INTRODUC.-CIENCIA-DE-DATOS/blob/main/clase_5_analisis_de_clientes.ipynb)
[![Open Copia Extendida](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Juan-Vega18/INTRODUC.-CIENCIA-DE-DATOS/blob/main/Copy_of_clase_5_analisis_de_clientes.ipynb)

Análisis real sobre el dataset `customers_1.csv`. Incluye estadística descriptiva, visualizaciones avanzadas, correlación de Pearson y gráficos interactivos con Plotly.

**Variables del dataset `customers_1.csv`:**

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `CustomerID` | `int64` | Identificador único del cliente |
| `Age` | `int64` | Edad del cliente (años) |
| `Education` | `object` | Nivel educativo (High School, University…) |
| `Income` | `int64` | Ingreso económico anual (USD) |
| `Occupation` | `object` | Ocupación (Official, Unemployed…) |
| `Gender` | `object` | Género (Male / Female) |
| `Marital Status` | `object` | Estado civil (Single, Married…) |
| `Settlement Size` | `object` | Tipo de ciudad (Small City, Mid City, Big City) |

**Visualizaciones implementadas:**

| Gráfica | Librería | Propósito |
|---------|----------|-----------|
| Histograma con KDE | `seaborn` | Distribución de ingresos + media vs mediana |
| Violin plot | `seaborn` | Distribución de edad por género |
| Boxplot con cuartiles | `seaborn` | Anatomía del boxplot sobre Income |
| Regplot | `seaborn` | Regresión lineal edad vs ingreso |
| Subplots comparativos | `matplotlib` | General vs Hombres vs Mujeres |
| Scatterplot multivariado | `seaborn` | Edad/Ingreso + Estado Civil + Género |
| Gráfico interactivo | `plotly.express` | Explorer con hover, zoom y filtros |

**Correlación de Pearson:**

$$r = \frac{\sum_{i=1}^{n}(X_i - \bar{X})(Y_i - \bar{Y})}{\sqrt{\sum(X_i-\bar{X})^2}\sqrt{\sum(Y_i-\bar{Y})^2}} = \frac{Cov(X,Y)}{\sigma_X \sigma_Y}$$

```python
correlacion = df_hr[['Age', 'Income']].corr(method='pearson')
display(correlacion)
```

> 💡 El coeficiente de Pearson solo detecta relaciones **lineales**. Para relaciones no lineales existen: Spearman (ρ) para monotónicas y Kendall (τ) basada en ordenamientos.

**Gráfico interactivo con Plotly:**
```python
import plotly.express as px

fig = px.scatter(df_hr, x='Age', y='Income',
                 color='Marital Status', symbol='Gender',
                 hover_data=['Education', 'Occupation', 'Settlement Size'],
                 title='Explorador de Clientes Interactivo',
                 opacity=0.7)
fig.show()
```

---

## 🛠️ Stack Tecnológico

### Lenguajes y Entornos

| Herramienta | Uso |
|-------------|-----|
| ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white) | Lenguaje principal del curso |
| ![Jupyter](https://img.shields.io/badge/Jupyter-F37626?logo=jupyter&logoColor=white) | Entorno de notebooks interactivos |
| ![Google Colab](https://img.shields.io/badge/Google%20Colab-F9AB00?logo=googlecolab&logoColor=white) | Ejecución en la nube con GPU/TPU |
| ![Markdown](https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white) | Documentación de notebooks |
| ![LaTeX](https://img.shields.io/badge/LaTeX-008080?logo=latex&logoColor=white) | Fórmulas matemáticas en notebooks |

### Librerías Python

| Librería | Versión sugerida | Propósito |
|----------|-----------------|-----------|
| `pandas` | ≥ 2.0 | Manipulación y análisis de datos |
| `numpy` | ≥ 1.24 | Operaciones numéricas y generación de datos |
| `matplotlib` | ≥ 3.7 | Visualización base |
| `seaborn` | ≥ 0.12 | Visualización estadística de alto nivel |
| `plotly` | ≥ 5.0 | Gráficos interactivos |
| `scipy` | ≥ 1.10 | Estadística avanzada |
| `ydata-profiling` | ≥ 4.0 | EDA automatizado (reemplaza pandas-profiling) |

---

## ⚙️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Juan-Vega18/INTRODUC.-CIENCIA-DE-DATOS.git
cd INTRODUC.-CIENCIA-DE-DATOS

# Instalar dependencias
pip install pandas numpy matplotlib seaborn plotly scipy ydata-profiling
```

En **Google Colab** solo se necesita instalar `ydata-profiling`:
```python
!pip install ydata-profiling
```

---

## 🧠 Habilidades Demostradas

### Programación y Herramientas

- **Python** – Manipulación de datos, lógica condicional, f-strings, funciones lambda, slicing
- **Jupyter / Google Colab** – Notebooks interactivos con celdas de código y markdown combinadas
- **Markdown** – Documentación estructurada con tablas, badges, encabezados y código formateado
- **LaTeX** – Escritura de fórmulas matemáticas dentro de notebooks (`$$r = \frac{Cov(X,Y)}{\sigma_X \sigma_Y}$$`)
- **Git / GitHub** – Control de versiones y publicación de notebooks en repositorio público

### Ciencia de Datos

- **EDA (Análisis Exploratorio)** – Uso de `.info()`, `.describe()`, `.value_counts()`, `isnull()`
- **Estadística Descriptiva** – Media, mediana, cuartiles, IQR, desviación estándar, outliers
- **Correlación** – Pearson, Spearman, Kendall; interpretación del coeficiente `r`
- **Visualización** – Histogramas, boxplots, violin plots, regplots, scatterplots multivariados, subplots
- **Visualización Interactiva** – Plotly Express con hover data, leyendas filtrables y zoom
- **Generación de Datos Sintéticos** – `numpy.random` con distribuciones normales y semillas reproducibles
- **Agrupación y Agregación** – `groupby`, `agg`, `map`, filtros booleanos

---

## 📌 Cómo Usar Este Repositorio

1. Abre cualquier notebook directamente en **Google Colab** usando los badges [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)]() al inicio de cada sección
2. Sube el archivo `customers_1.csv` a tu Google Drive en la carpeta `ciencia_de_datos/`
3. Ejecuta las celdas en orden para reproducir todos los análisis
4. Modifica los parámetros (bins, paletas, variables) para explorar el dataset

---

## 📜 Licencia

Este proyecto está bajo la licencia especificada en el archivo [`LICENSE`](./LICENSE).

---

<div align="center">
  <sub>Curso de Introducción a Ciencia de Datos · Repositorio mantenido por <a href="https://github.com/Juan-Vega18">Juan Vega</a></sub>
</div>
