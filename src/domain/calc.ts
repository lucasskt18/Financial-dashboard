import { dayPhase, daysInMonth, weekdayShort, type DayPhase } from "./dates.ts";
import type { Kind, Movement } from "./types.ts";

export type DayRow = {
  date: string;
  day: number;
  weekday: string;
  entradas: number;
  custo: number;
  economia: number;
  investimento: number;
  teto: number;
  folga: number;
};

export type MonthSheet = {
  month: string;
  days: number;
  entradas: number;
  saidas: number;
  economiaAportes: number;
  economiaResgates: number;
  investimentoAportes: number;
  investimentoResgates: number;
  base: number;
  rows: DayRow[];
};

export type PresentedRow = DayRow & {
  phase: DayPhase;
  acumulado: number | null;
};

function inMonth(movement: Movement, month: string): boolean {
  return movement.date.slice(0, 7) === month;
}

function bucketNet(movement: Movement): number {
  return movement.flow === "resgate" ? -movement.amountCents : movement.amountCents;
}

export function buildMonth(movements: Movement[], month: string): MonthSheet {
  const count = daysInMonth(month);
  const scoped = movements.filter((movement) => inMonth(movement, month));

  let entradas = 0;
  let saidas = 0;
  let economiaAportes = 0;
  let economiaResgates = 0;
  let investimentoAportes = 0;
  let investimentoResgates = 0;

  for (const movement of scoped) {
    if (movement.kind === "entrada") entradas += movement.amountCents;
    else if (movement.kind === "saida") saidas += movement.amountCents;
    else if (movement.kind === "economia") {
      if (movement.flow === "resgate") economiaResgates += movement.amountCents;
      else economiaAportes += movement.amountCents;
    } else if (movement.flow === "resgate") investimentoResgates += movement.amountCents;
    else investimentoAportes += movement.amountCents;
  }

  const base =
    entradas + economiaResgates + investimentoResgates - economiaAportes - investimentoAportes;
  const ceiling = Math.max(0, base);
  const daily = Math.floor(ceiling / count);
  let remainder = ceiling - daily * count;

  const rows: DayRow[] = [];
  for (let day = 1; day <= count; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    let dayEntradas = 0;
    let custo = 0;
    let economia = 0;
    let investimento = 0;

    for (const movement of scoped) {
      if (movement.date !== date) continue;
      if (movement.kind === "entrada") dayEntradas += movement.amountCents;
      else if (movement.kind === "saida") custo += movement.amountCents;
      else if (movement.kind === "economia") economia += bucketNet(movement);
      else investimento += bucketNet(movement);
    }

    const teto = daily + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;

    rows.push({
      date,
      day,
      weekday: weekdayShort(date),
      entradas: dayEntradas,
      custo,
      economia,
      investimento,
      teto,
      folga: teto - custo,
    });
  }

  return {
    month,
    days: count,
    entradas,
    saidas,
    economiaAportes,
    economiaResgates,
    investimentoAportes,
    investimentoResgates,
    base,
    rows,
  };
}

export function presentMonth(sheet: MonthSheet, today: string): PresentedRow[] {
  let running = 0;
  return sheet.rows.map((row) => {
    const phase = dayPhase(row.date, today);
    if (phase === "future") {
      return { ...row, phase, acumulado: null };
    }
    running += row.folga;
    return { ...row, phase, acumulado: running };
  });
}

export function bucketBalance(movements: Movement[], kind: Extract<Kind, "economia" | "investimento">): number {
  return movements.reduce((total, movement) => {
    if (movement.kind !== kind) return total;
    return total + bucketNet(movement);
  }, 0);
}

export function monthMovements(movements: Movement[], month: string, kind?: Kind): Movement[] {
  return movements
    .filter((movement) => inMonth(movement, month) && (kind === undefined || movement.kind === kind))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function movementsOn(movements: Movement[], date: string, kind?: Kind): Movement[] {
  return movements
    .filter((movement) => movement.date === date && (kind === undefined || movement.kind === kind))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
