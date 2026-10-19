import { useState } from "react";
import { brToISO, isoToBR } from "../domain/dates.ts";
import { parseBRL } from "../domain/money.ts";
import { CATEGORIES, KIND_LABEL, type Flow, type Kind, type Movement } from "../domain/types.ts";

export type ComposerSeed = {
  id?: string;
  createdAt?: string;
  date: string;
  kind: Kind;
  flow: Flow;
  amount: string;
  category: string;
  description: string;
};

export function blankSeed(date: string, kind: Kind): ComposerSeed {
  return {
    date,
    kind,
    flow: "normal",
    amount: "",
    category: CATEGORIES[kind][0],
    description: "",
  };
}

export function seedFromMovement(movement: Movement): ComposerSeed {
  return {
    id: movement.id,
    createdAt: movement.createdAt,
    date: movement.date,
    kind: movement.kind,
    flow: movement.flow,
    amount: (movement.amountCents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    category: movement.category,
    description: movement.description,
  };
}

function submitLabel(seed: ComposerSeed, editing: boolean): string {
  if (editing) return "Salvar alteração";
  if (seed.kind === "saida") return "Lançar débito";
  if (seed.kind === "entrada") return "Lançar entrada";
  if (seed.kind === "economia") return seed.flow === "resgate" ? "Resgatar" : "Guardar";
  return seed.flow === "resgate" ? "Resgatar" : "Aportar";
}

export function Composer({
  initial,
  kinds,
  dateLocked = false,
  autoFocus = false,
  onSubmit,
  onCancel,
}: {
  initial: ComposerSeed;
  kinds: Kind[];
  dateLocked?: boolean;
  autoFocus?: boolean;
  onSubmit: (movement: Movement) => string | null;
  onCancel?: () => void;
}) {
  const [seed, setSeed] = useState(initial);
  const [dateText, setDateText] = useState(isoToBR(initial.date));
  const [error, setError] = useState<string | null>(null);
  const categories = CATEGORIES[seed.kind];
  const bucket = seed.kind === "economia" || seed.kind === "investimento";
  const editing = Boolean(seed.id);

  function update(partial: Partial<ComposerSeed>) {
    setSeed((current) => {
      const next = { ...current, ...partial };
      if (partial.kind && !CATEGORIES[partial.kind].includes(next.category)) {
        next.category = CATEGORIES[partial.kind][0];
      }
      if (partial.kind === "entrada" || partial.kind === "saida") next.flow = "normal";
      return next;
    });
    setError(null);
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        const amountCents = parseBRL(seed.amount);
        if (amountCents === null) {
          setError("Informe um valor maior que zero. Use vírgula nos centavos, como 42,50.");
          return;
        }
        const date = brToISO(dateLocked ? isoToBR(seed.date) : dateText);
        if (!date) {
          setError("Use a data no formato dd/mm/aaaa.");
          return;
        }

        const failure = onSubmit({
          id: seed.id ?? crypto.randomUUID(),
          createdAt: seed.createdAt ?? new Date().toISOString(),
          date,
          kind: seed.kind,
          flow: bucket ? seed.flow : "normal",
          amountCents,
          category: seed.category,
          description: seed.description.trim(),
        });
        if (failure) {
          setError(failure);
          return;
        }
        if (!editing) {
          const next = { ...blankSeed(date, seed.kind), flow: seed.flow };
          setSeed(next);
          setDateText(isoToBR(date));
        }
        setError(null);
      }}
    >
      {kinds.length > 1 ? (
        <label className="field">
          Tipo
          <select value={seed.kind} onChange={(event) => update({ kind: event.target.value as Kind })}>
            {kinds.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABEL[kind]}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {bucket ? (
        <label className="field">
          Movimento
          <select value={seed.flow} onChange={(event) => update({ flow: event.target.value as Flow })}>
            <option value="normal">{seed.kind === "economia" ? "Guardar" : "Aporte"}</option>
            <option value="resgate">Resgate</option>
          </select>
        </label>
      ) : null}

      <label className="field">
        Valor
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          placeholder="0,00"
          value={seed.amount}
          onChange={(event) => update({ amount: event.target.value })}
          aria-label="Valor em reais"
        />
      </label>

      <label className="field">
        Data
        <input
          value={dateLocked ? isoToBR(seed.date) : dateText}
          readOnly={dateLocked}
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          aria-label="Data do lançamento"
          onChange={(event) => {
            const next = event.target.value;
            setDateText(next);
            const iso = brToISO(next);
            if (iso) update({ date: iso });
            setError(null);
          }}
        />
      </label>

      <label className="field">
        Categoria
        <select value={seed.category} onChange={(event) => update({ category: event.target.value })}>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          {categories.includes(seed.category) ? null : <option value={seed.category}>{seed.category}</option>}
        </select>
      </label>

      <label className="field grow">
        Descrição
        <input
          value={seed.description}
          placeholder="Opcional"
          onChange={(event) => update({ description: event.target.value })}
        />
      </label>

      <div className="composer-actions">
        <button className="primary" type="submit">
          {submitLabel(seed, editing)}
        </button>
        {onCancel ? (
          <button className="ghost" type="button" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
