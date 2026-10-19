import { useState } from "react";
import { Composer, blankSeed, seedFromMovement } from "../components/Composer.tsx";
import { Money } from "../components/Money.tsx";
import { MovementTable } from "../components/MovementTable.tsx";
import { bucketBalance, monthMovements } from "../domain/calc.ts";
import { todayISO } from "../domain/dates.ts";
import type { Kind, Movement } from "../domain/types.ts";
import { useLedger } from "../state/LedgerContext.tsx";

function defaultDate(month: string): string {
  const today = todayISO();
  return today.slice(0, 7) === month ? today : `${month}-01`;
}

export function FlowView({ kind }: { kind: Extract<Kind, "entrada" | "saida"> }) {
  const ledger = useLedger();
  const items = monthMovements(ledger.movements, ledger.month, kind);
  const [editing, setEditing] = useState<Movement | null>(null);
  const total = items.reduce((sum, movement) => sum + movement.amountCents, 0);

  function accept(movement: Movement): string | null {
    ledger.upsert({ ...movement, kind, flow: "normal" });
    setEditing(null);
    return null;
  }

  function remove(movement: Movement) {
    const label = kind === "saida" ? "este débito" : "esta entrada";
    if (!window.confirm(`Excluir ${label}? A planilha do dia será recalculada.`)) return;
    ledger.remove(movement.id);
    if (editing?.id === movement.id) setEditing(null);
  }

  return (
    <div className="stack">
      <article className="figure emphasis solo">
        <span>{kind === "saida" ? "Débitos do mês" : "Entradas do mês"}</span>
        <strong>
          <Money cents={total} />
        </strong>
      </article>
      <Composer
        key={editing?.id ?? `${kind}-${ledger.month}`}
        initial={editing ? seedFromMovement(editing) : blankSeed(defaultDate(ledger.month), kind)}
        kinds={[kind]}
        autoFocus
        onSubmit={accept}
        onCancel={editing ? () => setEditing(null) : undefined}
      />
      <MovementTable
        movements={items}
        onEdit={setEditing}
        onDelete={remove}
        empty={
          kind === "saida"
            ? "Nenhum débito neste mês. O custo diário continua em zero."
            : "Nenhuma entrada neste mês. O teto diário fica em zero até entrar dinheiro."
        }
      />
    </div>
  );
}

export function BucketView({ kind }: { kind: Extract<Kind, "economia" | "investimento"> }) {
  const ledger = useLedger();
  const items = monthMovements(ledger.movements, ledger.month, kind);
  const balance = bucketBalance(ledger.movements, kind);
  const [editing, setEditing] = useState<Movement | null>(null);
  const stored = items.filter((item) => item.flow === "normal").reduce((sum, item) => sum + item.amountCents, 0);
  const withdrawn = items.filter((item) => item.flow === "resgate").reduce((sum, item) => sum + item.amountCents, 0);
  const title = kind === "economia" ? "Economia" : "Investimentos";
  const balanceLabel = kind === "economia" ? "Saldo guardado" : "Total aportado";

  function accept(movement: Movement): string | null {
    const next = { ...movement, kind };
    if (next.flow === "resgate") {
      const available = bucketBalance(
        ledger.movements.filter((item) => item.id !== next.id),
        kind,
      );
      if (next.amountCents > available) {
        return kind === "economia"
          ? "Esse resgate passa do saldo que está na economia."
          : "Esse resgate passa do saldo aportado.";
      }
    }
    ledger.upsert(next);
    setEditing(null);
    return null;
  }

  function remove(movement: Movement) {
    if (!window.confirm("Excluir este lançamento? O saldo e a planilha serão recalculados.")) return;
    ledger.remove(movement.id);
    if (editing?.id === movement.id) setEditing(null);
  }

  return (
    <div className="stack">
      <section className="figures three">
        <article className="figure emphasis">
          <span>{balanceLabel}</span>
          <strong>
            <Money cents={balance} />
          </strong>
          <small>Soma de todos os meses</small>
        </article>
        <article className="figure">
          <span>{kind === "economia" ? "Guardado no mês" : "Aportes do mês"}</span>
          <strong>
            <Money cents={stored} />
          </strong>
        </article>
        <article className="figure">
          <span>Resgates do mês</span>
          <strong>
            <Money cents={withdrawn} />
          </strong>
        </article>
      </section>
      <p className="lede">
        {title} fica fora do custo diário. O valor entra no teto só quando volta como resgate, e sai do teto quando é
        guardado ou aportado.
      </p>
      <Composer
        key={editing?.id ?? `${kind}-${ledger.month}`}
        initial={editing ? seedFromMovement(editing) : { ...blankSeed(defaultDate(ledger.month), kind), flow: "normal" }}
        kinds={[kind]}
        autoFocus
        onSubmit={accept}
        onCancel={editing ? () => setEditing(null) : undefined}
      />
      <MovementTable
        movements={items}
        onEdit={setEditing}
        onDelete={remove}
        empty={
          kind === "economia"
            ? "Nada guardado neste mês."
            : "Nenhum aporte neste mês. O saldo aqui é o dinheiro separado, sem cotação."
        }
      />
    </div>
  );
}
