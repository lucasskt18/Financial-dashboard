import { useState } from "react";
import { currentMonth, monthLabel, shiftMonth } from "../domain/dates.ts";
import { useLedger } from "../state/LedgerContext.tsx";
import { HojeView } from "../views/HojeView.tsx";
import { PlanilhaView } from "../views/PlanilhaView.tsx";
import { BucketView, FlowView } from "../views/FlowViews.tsx";

const NAV = [
  { id: "planilha", label: "Planilha" },
  { id: "hoje", label: "Hoje" },
  { id: "saidas", label: "Saídas" },
  { id: "entradas", label: "Entradas" },
  { id: "economia", label: "Economia" },
  { id: "investimentos", label: "Investimentos" },
] as const;

type ViewId = (typeof NAV)[number]["id"];

export function AppShell() {
  const ledger = useLedger();
  const [view, setView] = useState<ViewId>("planilha");
  const title = NAV.find((item) => item.id === view)?.label ?? "Diário";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          Diário
          <small>Finanças do dia</small>
        </div>
        <nav aria-label="Seções">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <p className="sidebar-note">Os lançamentos ficam neste computador.</p>
      </aside>
      <section className="main">
        <header className="topbar">
          <h1>{title}</h1>
          {view === "hoje" ? (
            <p className="topbar-note">O débito de hoje entra na linha do dia.</p>
          ) : (
            <div className="month-switch">
              <button type="button" onClick={() => ledger.setMonth(shiftMonth(ledger.month, -1))} aria-label="Mês anterior">
                ‹
              </button>
              <strong>{monthLabel(ledger.month)}</strong>
              <button type="button" onClick={() => ledger.setMonth(shiftMonth(ledger.month, 1))} aria-label="Próximo mês">
                ›
              </button>
              <button type="button" className="texty" onClick={() => ledger.setMonth(currentMonth())}>
                Mês atual
              </button>
            </div>
          )}
        </header>
        {ledger.error ? <p className="banner">{ledger.error}</p> : null}
        <div className="content">
          {view === "planilha" ? <PlanilhaView /> : null}
          {view === "hoje" ? <HojeView /> : null}
          {view === "saidas" ? <FlowView kind="saida" /> : null}
          {view === "entradas" ? <FlowView kind="entrada" /> : null}
          {view === "economia" ? <BucketView kind="economia" /> : null}
          {view === "investimentos" ? <BucketView kind="investimento" /> : null}
        </div>
      </section>
    </div>
  );
}
