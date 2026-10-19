import { AppShell } from "./components/AppShell.tsx";
import { LedgerProvider, useLedger } from "./state/LedgerContext.tsx";

function Gate() {
  const ledger = useLedger();
  if (!ledger.ready) return <div className="boot">Abrindo o livro…</div>;
  return <AppShell />;
}

export default function App() {
  return (
    <LedgerProvider>
      <Gate />
    </LedgerProvider>
  );
}
