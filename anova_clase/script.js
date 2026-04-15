const DEFAULT_MEANS = {
  alfa: 60.4,
  beta: 55.6,
  gamma: 65.2,
  sigma: 64.6,
};

const LABELS = {
  alfa: "Alfa",
  beta: "Beta",
  gamma: "Gamma",
  sigma: "Sigma",
};

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

function solveAnovaFromSummary({ k, nTotal, ssBetween, ssWithin, alpha }) {
  if (!Number.isFinite(k) || !Number.isInteger(k) || k < 2) {
    throw new Error("k debe ser un entero mayor o igual a 2.");
  }
  if (!Number.isFinite(nTotal) || !Number.isInteger(nTotal) || nTotal <= k) {
    throw new Error("N debe ser entero y mayor que k.");
  }
  if (!Number.isFinite(ssBetween) || ssBetween <= 0) {
    throw new Error("SC entre grupos debe ser mayor que cero.");
  }
  if (!Number.isFinite(ssWithin) || ssWithin <= 0) {
    throw new Error("SC dentro de grupos debe ser mayor que cero.");
  }
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha >= 1) {
    throw new Error("α debe estar entre 0 y 1.");
  }

  const dfBetween = k - 1;
  const dfWithin = nTotal - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const fCalc = msBetween / msWithin;
  const pValue = fSurvival(fCalc, dfBetween, dfWithin);
  const fCrit = fCritical(alpha, dfBetween, dfWithin);

  return {
    dfBetween,
    dfWithin,
    msBetween,
    msWithin,
    fCalc,
    fCrit,
    pValue,
    rejectH0: pValue < alpha,
  };
}

function renderAnovaResult(result, alpha) {
  const output = document.getElementById("anova-output");
  const decision = result.rejectH0
    ? "<strong class='reject'>Se rechaza H₀</strong>"
    : "<strong class='ok'>No se rechaza H₀</strong>";

  output.innerHTML = `
    <div class="summary-grid">
      <div><strong>GL entre</strong><br>${result.dfBetween}</div>
      <div><strong>GL dentro</strong><br>${result.dfWithin}</div>
      <div><strong>CM entre</strong><br>${formatNumber(result.msBetween, 4)}</div>
      <div><strong>CM dentro</strong><br>${formatNumber(result.msWithin, 4)}</div>
      <div><strong>F calculado</strong><br>${formatNumber(result.fCalc, 4)}</div>
      <div><strong>F crítico</strong><br>${formatNumber(result.fCrit, 4)}</div>
      <div><strong>valor p</strong><br>${formatPValue(result.pValue)}</div>
      <div><strong>α</strong><br>${formatNumber(alpha, 4)}</div>
    </div>
    <p><strong>Decisión:</strong> ${decision}</p>
    <p>Regla: rechazar H₀ si F<sub>c</sub> &gt; F<sub>t</sub> o si p &lt; α.</p>
  `;
}

function setupAnovaCalculator() {
  const form = document.getElementById("anova-form");

  const run = () => {
    try {
      const result = solveAnovaFromSummary({
        k: Number.parseInt(document.getElementById("kInput").value, 10),
        nTotal: Number.parseInt(document.getElementById("nInput").value, 10),
        ssBetween: Number.parseFloat(document.getElementById("ssBetweenInput").value),
        ssWithin: Number.parseFloat(document.getElementById("ssWithinInput").value),
        alpha: Number.parseFloat(document.getElementById("alphaInput").value),
      });
      const alpha = Number.parseFloat(document.getElementById("alphaInput").value);
      renderAnovaResult(result, alpha);
    } catch (error) {
      document.getElementById("anova-output").innerHTML = `<p><strong class="reject">Error:</strong> ${error.message}</p>`;
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  run();
}

function readMeansFromInputs() {
  return {
    alfa: Number.parseFloat(document.getElementById("mean-alfa").value),
    beta: Number.parseFloat(document.getElementById("mean-beta").value),
    gamma: Number.parseFloat(document.getElementById("mean-gamma").value),
    sigma: Number.parseFloat(document.getElementById("mean-sigma").value),
  };
}

function renderMeansChart(means) {
  const chart = document.getElementById("mean-chart");
  chart.innerHTML = "";
  const values = Object.values(means);
  const maxValue = Math.max(...values) * 1.08;

  for (const [key, value] of Object.entries(means)) {
    const row = document.createElement("div");
    row.className = "bar-row";
    const width = (value / maxValue) * 100;

    row.innerHTML = `
      <span>${LABELS[key]}</span>
      <div class="bar-shell"><div class="bar-fill" style="width:${width.toFixed(2)}%"></div></div>
      <span>${formatNumber(value, 1)} min</span>
    `;
    chart.appendChild(row);
  }

  const sorted = Object.entries(means).sort((a, b) => a[1] - b[1]);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const globalMean = values.reduce((acc, current) => acc + current, 0) / values.length;

  document.getElementById("best-method").innerHTML = `
    <strong>Método más rápido:</strong> ${LABELS[best[0]]} (${formatNumber(best[1], 1)} min).
    Diferencia frente al más lento (${LABELS[worst[0]]}): <strong>${formatNumber(worst[1] - best[1], 1)} min</strong>.
    Media global actual: ${formatNumber(globalMean, 2)} min.
  `;
}

function setupMeansExplorer() {
  const sliders = document.querySelectorAll(".mean-slider");

  const run = () => {
    const means = readMeansFromInputs();
    for (const [key, value] of Object.entries(means)) {
      document.getElementById(`mean-${key}-value`).textContent = formatNumber(value, 1);
    }
    renderMeansChart(means);
  };

  sliders.forEach((slider) => {
    slider.addEventListener("input", run);
  });

  document.getElementById("reset-means").addEventListener("click", () => {
    for (const [key, value] of Object.entries(DEFAULT_MEANS)) {
      document.getElementById(`mean-${key}`).value = String(value);
    }
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
  setupAnovaCalculator();
  setupMeansExplorer();
  setupCopyPythonButton();
});
