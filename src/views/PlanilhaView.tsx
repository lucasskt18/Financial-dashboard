import { useEffect, useState } from "react";
import { Composer, blankSeed, seedFromMovement } from "../components/Composer.tsx";
import { Money } from "../components/Money.tsx";
import { MovementTable } from "../components/MovementTable.tsx";
import { buildMonth, bucketBalance, movementsOn, presentMonth } from "../domain/calc.ts";
import { currentMonth, formatLongDate, todayISO } from "../domain/dates.ts";
import type { Kind, Movement } from "../domain/types.ts";
import { useLedger } from "../state/LedgerContext.tsx";

const KINDS: Kind[] = ["saida", "entrada", "economia", "investimento"];

export function PlanilhaView() {
  const ledger = useLedger();
  const today = todayISO();
  const sheet = buildMonth(ledger.movements, ledger.month);
  const rows = presentMonth(sheet, today);
  const [selected, setSelected] = useState(ledger.month === currentMonth() ? today : `${ledger.month}-01`);
  const [editing, setEditing] = useState<Movement | null>(null);

  useEffect(() => {
    const next = ledger.month === currentMonth() ? today : `${ledger.month}-01`;
    setSelected(next);
    setEditing(null);
  }, [ledger.month, today]);

  const selectedRow = rows.find((row) => row.date === selected) ?? rows[0];
  const dayItems = selectedRow ? movementsOn(ledger.movements, selectedRow.date) : [];
  const todayRow = rows.find((row) => row.phase === "today");
  const resta = Math.max(0, sheet.base) - sheet.saidas;
  const viewingToday = ledger.month === currentMonth();

  function accept(movement: Movement): string | null {
    if ((movement.kind === "economia" || movement.kind === "investimento") && movement.flow === "resgate") {
      const balance = bucketBalance(
        ledger.movements.filter((item) => item.id !== movement.id),
        movement.kind,
      );
      if (movement.amountCents > balance) {
        return movement.kind === "economia"
          ? "Esse resgate passa do saldo que está na economia."
          : "Esse resgate passa do saldo aportado.";
      }
    }
    ledger.upsert(movement);
    setSelected(movement.date);
    setEditing(null);
    return null;
  }

  function remove(movement: Movement) {
    if (!window.confirm("Excluir este lançamento? O custo do dia será recalculado.")) return;
    ledger.remove(movement.id);
    if (editing?.id === movement.id) setEditing(null);
  }

  return (
    <div className="stack">
      <section className="figures">
        {viewingToday && todayRow ? (
          <>
            <article className="figure emphasis">
              <span>Custo de hoje</span>
              <strong>
                <Money cents={todayRow.custo} />
              </strong>
              <small>Débitos lançados hoje</small>
            </article>
            <article className="figure">
              <span>Teto de hoje</span>
              <strong>
                <Money cents={todayRow.teto} />
              </strong>
              <small>Parte do mês que cabe neste dia</small>
            </article>
            <article className="figure">
              <span>Folga de hoje</span>
              <strong>
                <Money cents={todayRow.folga} signed />
              </strong>
              <small>Teto menos o custo</small>
            </article>
          </>
        ) : (
          <>
            <article className="figure emphasis">
              <span>Custo do mês</span>
              <strong>
                <Money cents={sheet.saidas} />
              </strong>
              <small>Soma dos débitos</small>
            </article>
            <article className="figure">
              <span>Entradas</span>
              <strong>
                <Money cents={sheet.entradas} />
              </strong>
              <small>Dinheiro que entrou</small>
            </article>
            <article className="figure">
              <span>Folga do mês</span>
              <strong>
                <Money cents={Math.max(0, sheet.base) - sheet.saidas} signed />
              </strong>
              <small>Teto mensal menos o custo</small>
            </article>
          </>
        )}
        <article className="figure">
          <span>Resta no mês</span>
          <strong>
            <Money cents={resta} signed />
          </strong>
          <small>O que ainda cabe em custo</small>
        </article>
      </section>

      <p className="lede">
        O teto divide o que sobra do mês — entradas, menos economia e investimentos — pelos dias. O custo da linha é a
        soma dos débitos daquele dia e muda assim que você lança, edita ou exclui.
      </p>

      {selectedRow ? (
        <Composer
          key={editing?.id ?? selectedRow.date}
          initial={editing ? seedFromMovement(editing) : blankSeed(selectedRow.date, "saida")}
          kinds={KINDS}
          dateLocked={!editing}
          autoFocus
          onSubmit={accept}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      ) : null}

      {selectedRow ? (
        <section className="day-strip">
          <h2>{formatLongDate(selectedRow.date)}</h2>
          <MovementTable
            movements={dayItems}
            onEdit={setEditing}
            onDelete={remove}
            empty="Nenhum lançamento neste dia. O custo fica em zero até existir um débito."
          />
        </section>
      ) : null}

      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th>Dia</th>
              <th>Entradas</th>
              <th>Custo</th>
              <th>Economia</th>
              <th>Investimentos</th>
              <th>Teto</th>
              <th>No dia</th>
              <th>Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.date}
                className={[row.phase, row.date === selectedRow?.date ? "selected" : ""].filter(Boolean).join(" ")}
                onClick={() => {
                  setSelected(row.date);
                  setEditing(null);
                }}
              >
                <td>
                  <span className="day-num">{String(row.day).padStart(2, "0")}</span>
                  <span className="weekday">{row.weekday}</span>
                </td>
                <td>{row.entradas ? <Money cents={row.entradas} /> : <span className="dash">—</span>}</td>
                <td className={row.custo > 0 ? "cost" : undefined}>
                  {row.phase === "future" && row.custo === 0 ? (
                    <span className="dash">—</span>
                  ) : (
                    <Money cents={row.custo} />
                  )}
                </td>
                <td>{row.economia ? <Money cents={row.economia} signed /> : <span className="dash">—</span>}</td>
                <td>{row.investimento ? <Money cents={row.investimento} signed /> : <span className="dash">—</span>}</td>
                <td>
                  <Money cents={row.teto} />
                </td>
                <td>{row.phase === "future" ? <span className="dash">—</span> : <Money cents={row.folga} signed />}</td>
                <td>
                  {row.acumulado === null ? <span className="dash">—</span> : <Money cents={row.acumulado} signed />}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Mês</th>
              <th>
                <Money cents={sheet.entradas} />
              </th>
              <th>
                <Money cents={sheet.saidas} />
              </th>
              <th>
                <Money cents={sheet.economiaAportes - sheet.economiaResgates} signed />
              </th>
              <th>
                <Money cents={sheet.investimentoAportes - sheet.investimentoResgates} signed />
              </th>
              <th>
                <Money cents={Math.max(0, sheet.base)} />
              </th>
              <th>
                <Money cents={Math.max(0, sheet.base) - sheet.saidas} signed />
              </th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
