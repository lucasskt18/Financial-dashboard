import { invoke } from "@tauri-apps/api/core";
import type { Flow, Kind, Movement } from "../domain/types.ts";

const STORAGE_KEY = "diario.ledger.v1";

const KINDS = new Set<Kind>(["entrada", "saida", "economia", "investimento"]);

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && KINDS.has(value as Kind);
}

function sanitize(value: unknown): Movement[] {
  if (!Array.isArray(value)) return [];
  const movements: Movement[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.date !== "string") continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date) || !isKind(record.kind)) continue;
    if (typeof record.amountCents !== "number" || !Number.isInteger(record.amountCents) || record.amountCents <= 0) {
      continue;
    }

    const flow: Flow = record.flow === "resgate" ? "resgate" : "normal";
    if ((record.kind === "entrada" || record.kind === "saida") && flow === "resgate") continue;

    movements.push({
      id: record.id,
      date: record.date,
      kind: record.kind,
      flow,
      amountCents: record.amountCents,
      category: typeof record.category === "string" && record.category.trim() ? record.category.trim() : "Outros",
      description: typeof record.description === "string" ? record.description.trim() : "",
      createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date(0).toISOString(),
    });
  }

  return movements;
}

export async function loadMovements(): Promise<Movement[]> {
  if (isTauri()) {
    const movements = await invoke<unknown>("load_ledger");
    return sanitize(movements);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as { movements?: unknown };
  return sanitize(parsed.movements ?? parsed);
}

export async function saveMovements(movements: Movement[]): Promise<void> {
  if (isTauri()) {
    await invoke("save_ledger", { movements });
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, movements }));
}
