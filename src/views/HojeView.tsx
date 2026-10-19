import { useState } from "react";
import { Composer, blankSeed, seedFromMovement } from "../components/Composer.tsx";
import { Money } from "../components/Money.tsx";
import { MovementTable } from "../components/MovementTable.tsx";
import { buildMonth, movementsOn, presentMonth } from "../domain/calc.ts";
import { currentMonth, formatLongDate, todayISO } from "../domain/dates.ts";
import type { Movement } from "../domain/types.ts";
import { useLedger } from "../state/LedgerContext.tsx";

export function HojeView() {
  const ledger = useLedger();
  const today = todayISO();
  const sheet = buildMonth(ledger.movements, currentMonth());
  const row = presentMonth(sheet, today).find((item) => item.date === today);
  const debits = movementsOn(ledger.movements, today, "saida");
  const [editing, setEditing] = useState<Movement | null>(null);

  function accept(movement: Movement): string | null {
    ledger.upsert({ ...movement, kind: "saida", flow: "normal", date: today });
    setEditing(null);
    return null;
  }

  function remove(movement: Movement) {
    if (!window.confirm("Excluir este débito? O custo de hoje será recalculado.")) return;
    ledger.remove(movement.id);
    if (editing?.id === movement.id) setEditing(null);
  }

  return (
    <div className="stack">
      <section className="hoje-hero">
        <div>
          <p className="eyebrow">{formatLongDate(today)}</p>
          <h2>Custo de hoje</h2>
          <p className="hero-number">{row ? <Money cents={row.custo} /> : <Money cents={0} />}</p>
          <p className="lede">Soma dos débitos lançados hoje. Sem lançamento, o dia permanece em zero.</p>
        </div>
        <div className="hero-side">
          <article>
            <span>Teto do dia</span>
            <strong>{row ? <Money cents={row.teto} /> : <Money cents={0} />}</strong>
          </article>
          <article>
            <span>Folga</span>
            <strong>{row ? <Money cents={row.folga} signed /> : <Money cents={0} signed />}</strong>
          </article>
          <article>
            <span>Acumulado no mês</span>
            <strong>{row?.acumulado !== null && row?.acumulado !== undefined ? <Money cents={row.acumulado} signed /> : "—"}</strong>
          </article>
        </div>
      </section>

      <Composer
        key={editing?.id ?? "hoje"}
        initial={editing ? { ...seedFromMovement(editing), date: today, kind: "saida", flow: "normal" } : blankSeed(today, "saida")}
        kinds={["saida"]}
        dateLocked
        autoFocus
        onSubmit={accept}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <section className="day-strip">
        <h2>Débitos de hoje</h2>
        <MovementTable
          movements={debits}
          onEdit={setEditing}
          onDelete={remove}
          empty="Nenhum débito hoje. Lance um valor gasto para o custo entrar na planilha."
        />
      </section>
    </div>
  );
}
