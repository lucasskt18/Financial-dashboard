export function todayISO(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentMonth(now = new Date()): string {
  return todayISO(now).slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

export function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const name = new Date(year, monthNumber - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

export function weekdayShort(iso: string): string {
  const [year, monthNumber, day] = iso.split("-").map(Number);
  return new Date(year, monthNumber - 1, day)
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
}

export function formatLongDate(iso: string): string {
  const [year, monthNumber, day] = iso.split("-").map(Number);
  return new Date(year, monthNumber - 1, day).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
}

export function formatShortDate(iso: string): string {
  return isoToBR(iso);
}

export function isoToBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

export function brToISO(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type DayPhase = "past" | "today" | "future";

export function dayPhase(date: string, today: string): DayPhase {
  if (date === today) return "today";
  return date < today ? "past" : "future";
}
