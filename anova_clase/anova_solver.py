#!/usr/bin/env python3
"""Resuelve ANOVA de un factor desde una tabla resumen."""

from __future__ import annotations

from dataclasses import dataclass
from math import exp, lgamma, log


@dataclass(frozen=True)
class AnovaInput:
    k: int
    n_total: int
    ss_between: float
    ss_within: float
    alpha: float = 0.05


def _betacf(a: float, b: float, x: float) -> float:
    max_iterations = 220
    epsilon = 3e-14
    fpmin = 1e-30

    qab = a + b
    qap = a + 1.0
    qam = a - 1.0

    c = 1.0
    d = 1.0 - (qab * x) / qap
    if abs(d) < fpmin:
        d = fpmin
    d = 1.0 / d
    h = d

    for m in range(1, max_iterations + 1):
        m2 = 2 * m

        aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < fpmin:
            d = fpmin
        c = 1.0 + aa / c
        if abs(c) < fpmin:
            c = fpmin
        d = 1.0 / d
        h *= d * c

        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < fpmin:
            d = fpmin
        c = 1.0 + aa / c
        if abs(c) < fpmin:
            c = fpmin
        d = 1.0 / d
        delta = d * c
        h *= delta

        if abs(delta - 1.0) < epsilon:
            break

    return h


def regularized_incomplete_beta(x: float, a: float, b: float) -> float:
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0

    bt = exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * log(x) + b * log(1.0 - x))
    threshold = (a + 1.0) / (a + b + 2.0)

    if x < threshold:
        return (bt * _betacf(a, b, x)) / a
    return 1.0 - (bt * _betacf(b, a, 1.0 - x)) / b


def f_cdf(x: float, d1: float, d2: float) -> float:
    if x <= 0.0:
        return 0.0
    z = (d1 * x) / (d1 * x + d2)
    return regularized_incomplete_beta(z, d1 / 2.0, d2 / 2.0)


def f_survival(x: float, d1: float, d2: float) -> float:
    return max(0.0, 1.0 - f_cdf(x, d1, d2))


def f_critical(alpha: float, d1: float, d2: float) -> float:
    target = 1.0 - alpha
    low = 0.0
    high = 1.0

    while f_cdf(high, d1, d2) < target and high < 1e7:
        high *= 2.0

    for _ in range(120):
        mid = (low + high) / 2.0
        if f_cdf(mid, d1, d2) < target:
            low = mid
        else:
            high = mid

    return (low + high) / 2.0


def solve_anova(data: AnovaInput) -> dict[str, float | int | bool]:
    if data.k < 2:
        raise ValueError("k debe ser mayor o igual a 2.")
    if data.n_total <= data.k:
        raise ValueError("n_total debe ser mayor que k.")
    if data.ss_between <= 0 or data.ss_within <= 0:
        raise ValueError("Las sumas de cuadrados deben ser mayores que cero.")
    if not (0 < data.alpha < 1):
        raise ValueError("alpha debe estar entre 0 y 1.")

    df_between = data.k - 1
    df_within = data.n_total - data.k

    ms_between = data.ss_between / df_between
    ms_within = data.ss_within / df_within
    f_calc = ms_between / ms_within

    p_value = f_survival(f_calc, df_between, df_within)
    f_crit = f_critical(data.alpha, df_between, df_within)
    reject_h0 = p_value < data.alpha

    return {
        "df_between": df_between,
        "df_within": df_within,
        "ms_between": ms_between,
        "ms_within": ms_within,
        "f_calc": f_calc,
        "f_crit": f_crit,
        "p_value": p_value,
        "reject_h0": reject_h0,
    }


def main() -> None:
    means = {"Alfa": 60.4, "Beta": 55.6, "Gamma": 65.2, "Sigma": 64.6}
    summary = AnovaInput(k=4, n_total=20, ss_between=296.55, ss_within=116.40, alpha=0.05)
    result = solve_anova(summary)

    print("ANOVA de un factor (metodos de ensamblado)")
    print("-" * 52)
    print(f"GL entre: {result['df_between']} | GL dentro: {result['df_within']}")
    print(f"CM entre: {result['ms_between']:.4f}")
    print(f"CM dentro: {result['ms_within']:.4f}")
    print(f"F calculado: {result['f_calc']:.4f}")
    print(f"F critico (alpha=0.05): {result['f_crit']:.4f}")
    print(f"Valor p: {result['p_value']:.6f}")
    print("Decision:", "Rechazar H0" if result["reject_h0"] else "No rechazar H0")

    best_method = min(means, key=means.get)
    print(f"Metodo mas rapido segun medias muestrales: {best_method} ({means[best_method]:.1f} min)")


if __name__ == "__main__":
    main()
