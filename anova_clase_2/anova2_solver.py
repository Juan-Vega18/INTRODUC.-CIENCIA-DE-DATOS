#!/usr/bin/env python3
"""ANOVA de dos factores (sin replicacion) para productividad por operador y jornada."""

from __future__ import annotations

from dataclasses import dataclass
from math import exp, lgamma, log
from typing import Sequence


DEFAULT_DATA: list[list[float]] = [
    [15, 9, 20, 11, 18],
    [12, 14, 25, 19, 22],
    [18, 17, 19, 14, 12],
    [10, 10, 18, 10, 15],
]

OPERATORS = ["Jose", "Carlos", "Ximena", "Karla", "Manuel"]
DAYS = ["Jornada 1", "Jornada 2", "Jornada 3", "Jornada 4"]


@dataclass(frozen=True)
class SummaryInput:
    n_operators: int
    n_days: int
    ss_operators: float
    ss_days: float
    ss_error: float
    alpha: float = 0.05


REPORTED_SUMMARY = SummaryInput(
    n_operators=5,
    n_days=4,
    ss_operators=205.80,
    ss_days=116.20,
    ss_error=95.80,
    alpha=0.05,
)


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


def solve_from_summary(data: SummaryInput) -> dict[str, float | int | bool]:
    if data.n_operators < 2:
        raise ValueError("n_operators debe ser >= 2.")
    if data.n_days < 2:
        raise ValueError("n_days debe ser >= 2.")
    if data.ss_operators <= 0 or data.ss_days <= 0 or data.ss_error <= 0:
        raise ValueError("Las sumas de cuadrados deben ser > 0.")
    if not (0 < data.alpha < 1):
        raise ValueError("alpha debe estar entre 0 y 1.")

    df_operators = data.n_operators - 1
    df_days = data.n_days - 1
    df_error = (data.n_operators - 1) * (data.n_days - 1)
    df_total = data.n_operators * data.n_days - 1

    ms_operators = data.ss_operators / df_operators
    ms_days = data.ss_days / df_days
    ms_error = data.ss_error / df_error

    f_operators = ms_operators / ms_error
    f_days = ms_days / ms_error

    p_operators = f_survival(f_operators, df_operators, df_error)
    p_days = f_survival(f_days, df_days, df_error)

    f_crit_operators = f_critical(data.alpha, df_operators, df_error)
    f_crit_days = f_critical(data.alpha, df_days, df_error)

    return {
        "df_operators": df_operators,
        "df_days": df_days,
        "df_error": df_error,
        "df_total": df_total,
        "ms_operators": ms_operators,
        "ms_days": ms_days,
        "ms_error": ms_error,
        "f_operators": f_operators,
        "f_days": f_days,
        "f_crit_operators": f_crit_operators,
        "f_crit_days": f_crit_days,
        "p_operators": p_operators,
        "p_days": p_days,
        "reject_operators": p_operators < data.alpha,
        "reject_days": p_days < data.alpha,
    }


def _validate_matrix(data: Sequence[Sequence[float]]) -> list[list[float]]:
    if len(data) < 2:
        raise ValueError("Se requieren al menos 2 jornadas.")

    matrix = [list(map(float, row)) for row in data]
    n_operators = len(matrix[0])
    if n_operators < 2:
        raise ValueError("Se requieren al menos 2 operadores.")

    for row in matrix:
        if len(row) != n_operators:
            raise ValueError("La matriz debe ser rectangular.")

    return matrix


def solve_from_matrix(data: Sequence[Sequence[float]], alpha: float = 0.05) -> dict[str, object]:
    matrix = _validate_matrix(data)
    n_days = len(matrix)
    n_operators = len(matrix[0])

    values = [value for row in matrix for value in row]
    grand_mean = sum(values) / len(values)

    operator_means = []
    for c in range(n_operators):
        operator_means.append(sum(matrix[r][c] for r in range(n_days)) / n_days)

    day_means = [sum(row) / n_operators for row in matrix]

    ss_total = sum((y - grand_mean) ** 2 for y in values)
    ss_operators = n_days * sum((m - grand_mean) ** 2 for m in operator_means)
    ss_days = n_operators * sum((m - grand_mean) ** 2 for m in day_means)
    ss_error = ss_total - ss_operators - ss_days

    if abs(ss_error) < 1e-12:
        ss_error = 0.0
    if ss_error <= 0:
        raise ValueError("SC error no positiva; revisa la matriz.")

    summary = solve_from_summary(
        SummaryInput(
            n_operators=n_operators,
            n_days=n_days,
            ss_operators=ss_operators,
            ss_days=ss_days,
            ss_error=ss_error,
            alpha=alpha,
        )
    )

    return {
        "n_operators": n_operators,
        "n_days": n_days,
        "grand_mean": grand_mean,
        "operator_means": operator_means,
        "day_means": day_means,
        "ss_operators": ss_operators,
        "ss_days": ss_days,
        "ss_error": ss_error,
        "ss_total": ss_total,
        **summary,
    }


def main() -> None:
    summary_result = solve_from_summary(REPORTED_SUMMARY)

    print("ANOVA de dos factores (tabla resumen reportada)")
    print("-" * 54)
    print(f"SCO: {REPORTED_SUMMARY.ss_operators:.2f}")
    print(f"SCJ: {REPORTED_SUMMARY.ss_days:.2f}")
    print(f"SCE: {REPORTED_SUMMARY.ss_error:.2f}")
    print(f"SCT: {REPORTED_SUMMARY.ss_operators + REPORTED_SUMMARY.ss_days + REPORTED_SUMMARY.ss_error:.2f}")
    print(f"F operadores: {summary_result['f_operators']:.4f}")
    print(f"F jornadas:   {summary_result['f_days']:.4f}")
    print(f"F crit operadores (4,12): {summary_result['f_crit_operators']:.4f}")
    print(f"F crit jornadas (3,12):   {summary_result['f_crit_days']:.4f}")
    print(f"p operadores: {summary_result['p_operators']:.6f}")
    print(f"p jornadas:   {summary_result['p_days']:.6f}")
    print(
        "Decision operadores:",
        "Rechazar H0" if summary_result["reject_operators"] else "No rechazar H0",
    )
    print(
        "Decision jornadas:",
        "Rechazar H0" if summary_result["reject_days"] else "No rechazar H0",
    )

    matrix_result = solve_from_matrix(DEFAULT_DATA, alpha=REPORTED_SUMMARY.alpha)
    best_operator_idx = max(
        range(len(matrix_result["operator_means"])),
        key=matrix_result["operator_means"].__getitem__,
    )
    best_day_idx = max(
        range(len(matrix_result["day_means"])),
        key=matrix_result["day_means"].__getitem__,
    )
    print(
        f"Operador con mayor media observada: {OPERATORS[best_operator_idx]} "
        f"({matrix_result['operator_means'][best_operator_idx]:.2f})"
    )
    print(
        f"Jornada con mayor media observada: {DAYS[best_day_idx]} "
        f"({matrix_result['day_means'][best_day_idx]:.2f})"
    )


if __name__ == "__main__":
    main()
