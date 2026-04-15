const OPERATORS = ["Jose", "Carlos", "Ximena", "Karla", "Manuel"];
const DAYS = ["Jornada 1", "Jornada 2", "Jornada 3", "Jornada 4"];

const DEFAULT_MATRIX = [
  [15, 9, 20, 11, 18],
  [12, 14, 25, 19, 22],
  [18, 17, 19, 14, 12],
  [10, 10, 18, 10, 15],
];

function formatNumber(value, digits = 4) {
  return Number(value).toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function formatPValue(value) {
  if (value < 0.001) {
    return value.toExponential(3);
  }
  return formatNumber(value, 6);
}

function logGamma(z) {
  const p = [
    0.9999999999998099,
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = p[0];
  for (let i = 1; i < p.length; i += 1) {
    x += p[i] / (z + i);
  }
  const t = z + 7.5;
  return 0.9189385332046727 + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(a, b, x) {
  const maxIterations = 220;
  const epsilon = 3e-14;
  const fpmin = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;

    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < epsilon) {
      break;
    }
  }

  return h;
}

function regularizedIncompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  }
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

function fCdf(x, d1, d2) {
  if (x <= 0) return 0;
  const z = (d1 * x) / (d1 * x + d2);
  return regularizedIncompleteBeta(z, d1 / 2, d2 / 2);
}

function fSurvival(x, d1, d2) {
  return Math.max(0, 1 - fCdf(x, d1, d2));
}

function fCritical(alpha, d1, d2) {
  const target = 1 - alpha;
  let low = 0;
  let high = 1;

  while (fCdf(high, d1, d2) < target && high < 1e7) {
    high *= 2;
  }

  for (let i = 0; i < 120; i += 1) {
    const mid = (low + high) / 2;
    if (fCdf(mid, d1, d2) < target) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

function solveTwoFactorFromSummary({
  nOperators,
  nDays,
  ssOperators,
  ssDays,
  ssError,
  alpha,
}) {
  if (!Number.isInteger(nOperators) || nOperators < 2) {
    throw new Error("El numero de operadores debe ser entero y >= 2.");
  }
  if (!Number.isInteger(nDays) || nDays < 2) {
    throw new Error("El numero de jornadas debe ser entero y >= 2.");
  }
  if (!Number.isFinite(ssOperators) || ssOperators <= 0) {
    throw new Error("SC Operadores debe ser > 0.");
  }
  if (!Number.isFinite(ssDays) || ssDays <= 0) {
    throw new Error("SC Jornadas debe ser > 0.");
  }
  if (!Number.isFinite(ssError) || ssError <= 0) {
    throw new Error("SC Error debe ser > 0.");
  }
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) {
    throw new Error("a debe estar entre 0 y 1.");
  }

  const dfOperators = nOperators - 1;
  const dfDays = nDays - 1;
  const dfError = (nOperators - 1) * (nDays - 1);
  const dfTotal = nOperators * nDays - 1;

  const msOperators = ssOperators / dfOperators;
  const msDays = ssDays / dfDays;
  const msError = ssError / dfError;

  const fOperators = msOperators / msError;
  const fDays = msDays / msError;

  const fCritOperators = fCritical(alpha, dfOperators, dfError);
  const fCritDays = fCritical(alpha, dfDays, dfError);

  const pOperators = fSurvival(fOperators, dfOperators, dfError);
  const pDays = fSurvival(fDays, dfDays, dfError);

  return {
    dfOperators,
    dfDays,
    dfError,
    dfTotal,
    msOperators,
    msDays,
    msError,
    fOperators,
    fDays,
    fCritOperators,
    fCritDays,
    pOperators,
    pDays,
    rejectOperators: pOperators < alpha,
    rejectDays: pDays < alpha,
  };
}

function renderSummaryResult(result, alpha) {
  const target = document.getElementById("summary-output");
  const decisionOps = result.rejectOperators
    ? "<strong class='reject'>Se rechaza H0</strong>"
    : "<strong class='ok'>No se rechaza H0</strong>";
  const decisionDays = result.rejectDays
    ? "<strong class='reject'>Se rechaza H0</strong>"
    : "<strong class='ok'>No se rechaza H0</strong>";

  target.innerHTML = `
    <div class="summary-blocks">
      <div><strong>GL operadores</strong><br>${result.dfOperators}</div>
      <div><strong>GL jornadas</strong><br>${result.dfDays}</div>
      <div><strong>GL error</strong><br>${result.dfError}</div>
      <div><strong>GL total</strong><br>${result.dfTotal}</div>
      <div><strong>CM operadores</strong><br>${formatNumber(result.msOperators, 4)}</div>
      <div><strong>CM jornadas</strong><br>${formatNumber(result.msDays, 4)}</div>
      <div><strong>CM error</strong><br>${formatNumber(result.msError, 4)}</div>
      <div><strong>a</strong><br>${formatNumber(alpha, 4)}</div>
    </div>

    <p><strong>Operadores:</strong> F = ${formatNumber(result.fOperators, 4)} | F crit = ${formatNumber(result.fCritOperators, 4)} | p = ${formatPValue(result.pOperators)} | ${decisionOps}</p>
    <p><strong>Jornadas:</strong> F = ${formatNumber(result.fDays, 4)} | F crit = ${formatNumber(result.fCritDays, 4)} | p = ${formatPValue(result.pDays)} | ${decisionDays}</p>
  `;
}

function setupSummaryCalculator() {
  const form = document.getElementById("summary-form");

  const run = () => {
    try {
      const alpha = Number.parseFloat(document.getElementById("alphaInput").value);
      const result = solveTwoFactorFromSummary({
        nOperators: Number.parseInt(document.getElementById("cInput").value, 10),
        nDays: Number.parseInt(document.getElementById("rInput").value, 10),
        ssOperators: Number.parseFloat(document.getElementById("ssOperatorInput").value),
        ssDays: Number.parseFloat(document.getElementById("ssDayInput").value),
        ssError: Number.parseFloat(document.getElementById("ssErrorInput").value),
        alpha,
      });
      renderSummaryResult(result, alpha);
    } catch (error) {
      document.getElementById("summary-output").innerHTML =
        `<p><strong class="reject">Error:</strong> ${error.message}</p>`;
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  run();
}

function buildMatrixEditor(matrix) {
  const host = document.getElementById("matrix-editor");
  let html = "<table class='matrix-table'><thead><tr><th>Jornada / Operador</th>";
  OPERATORS.forEach((name) => {
    html += `<th>${name}</th>`;
  });
  html += "</tr></thead><tbody>";

  matrix.forEach((row, rowIndex) => {
    html += `<tr><td>${DAYS[rowIndex]}</td>`;
    row.forEach((value, colIndex) => {
      html += `<td><input type="number" step="1" id="cell-${rowIndex}-${colIndex}" value="${value}"></td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  host.innerHTML = html;
}

function readMatrix() {
  const matrix = [];
  for (let r = 0; r < DAYS.length; r += 1) {
    const row = [];
    for (let c = 0; c < OPERATORS.length; c += 1) {
      const value = Number.parseFloat(document.getElementById(`cell-${r}-${c}`).value);
      if (!Number.isFinite(value)) {
        throw new Error("Todos los valores de la matriz deben ser numericos.");
      }
      row.push(value);
    }
    matrix.push(row);
  }
  return matrix;
}

function matrixColumnMeans(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const means = [];

  for (let c = 0; c < cols; c += 1) {
    let sum = 0;
    for (let r = 0; r < rows; r += 1) {
      sum += matrix[r][c];
    }
    means.push(sum / rows);
  }
  return means;
}

function matrixRowMeans(matrix) {
  return matrix.map((row) => row.reduce((acc, v) => acc + v, 0) / row.length);
}

function calculateFromMatrix(matrix) {
  const flattened = matrix.flat();
  const grandMean = flattened.reduce((acc, v) => acc + v, 0) / flattened.length;

  const operatorMeans = matrixColumnMeans(matrix);
  const dayMeans = matrixRowMeans(matrix);

  const minValue = Math.min(...flattened);
  const maxValue = Math.max(...flattened);
  const valueRange = maxValue - minValue;

  return {
    grandMean,
    operatorMeans,
    dayMeans,
    minValue,
    maxValue,
    valueRange,
  };
}

function renderBars(containerId, labels, values) {
  const target = document.getElementById(containerId);
  target.innerHTML = "";
  const max = Math.max(...values) * 1.08;

  labels.forEach((label, index) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const width = (values[index] / max) * 100;
    row.innerHTML = `
      <span>${label}</span>
      <div class="bar-shell"><div class="bar-fill" style="width:${width.toFixed(2)}%"></div></div>
      <span>${formatNumber(values[index], 2)}</span>
    `;
    target.appendChild(row);
  });
}

function renderMatrixOutput(result) {
  const target = document.getElementById("matrix-output");

  const bestOperatorIndex = result.operatorMeans.indexOf(Math.max(...result.operatorMeans));
  const bestDayIndex = result.dayMeans.indexOf(Math.max(...result.dayMeans));
  const worstDayIndex = result.dayMeans.indexOf(Math.min(...result.dayMeans));

  target.innerHTML = `
    <div class="summary-blocks">
      <div><strong>Media global</strong><br>${formatNumber(result.grandMean, 4)}</div>
      <div><strong>Valor minimo</strong><br>${formatNumber(result.minValue, 2)}</div>
      <div><strong>Valor maximo</strong><br>${formatNumber(result.maxValue, 2)}</div>
      <div><strong>Rango</strong><br>${formatNumber(result.valueRange, 2)}</div>
    </div>

    <p><strong>Operador con mayor media:</strong> ${OPERATORS[bestOperatorIndex]} (${formatNumber(result.operatorMeans[bestOperatorIndex], 2)}).</p>
    <p><strong>Mejor jornada:</strong> ${DAYS[bestDayIndex]} (${formatNumber(result.dayMeans[bestDayIndex], 2)}). <strong>Peor jornada:</strong> ${DAYS[worstDayIndex]} (${formatNumber(result.dayMeans[worstDayIndex], 2)}).</p>
  `;

  renderBars("operator-chart", OPERATORS, result.operatorMeans);
  renderBars("day-chart", DAYS, result.dayMeans);
}

function resetMatrixToDefaults() {
  DEFAULT_MATRIX.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      document.getElementById(`cell-${rowIndex}-${colIndex}`).value = String(value);
    });
  });
}

function setupMatrixExplorer() {
  buildMatrixEditor(DEFAULT_MATRIX);

  const run = () => {
    try {
      const matrix = readMatrix();
      const result = calculateFromMatrix(matrix);
      renderMatrixOutput(result);
    } catch (error) {
      document.getElementById("matrix-output").innerHTML =
        `<p><strong class="reject">Error:</strong> ${error.message}</p>`;
      document.getElementById("operator-chart").innerHTML = "";
      document.getElementById("day-chart").innerHTML = "";
    }
  };

  document.getElementById("recalculate-matrix").addEventListener("click", run);
  document.getElementById("reset-matrix").addEventListener("click", () => {
    resetMatrixToDefaults();
    run();
  });

  run();
}

function setupCopyPythonButton() {
  const button = document.getElementById("copy-python");
  button.addEventListener("click", async () => {
    const code = document.getElementById("python-code").innerText;
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "Snippet copiado";
      window.setTimeout(() => {
        button.textContent = "Copiar snippet";
      }, 1400);
    } catch {
      button.textContent = "No se pudo copiar";
      window.setTimeout(() => {
        button.textContent = "Copiar snippet";
      }, 1400);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSummaryCalculator();
  setupMatrixExplorer();
  setupCopyPythonButton();
});
