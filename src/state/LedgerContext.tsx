import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { currentMonth } from "../domain/dates.ts";
import type { Movement } from "../domain/types.ts";
import { loadMovements, saveMovements } from "../data/storage.ts";

type LedgerValue = {
  ready: boolean;
  error: string | null;
  movements: Movement[];
  month: string;
  setMonth: (month: string) => void;
  upsert: (movement: Movement) => void;
  remove: (id: string) => void;
};

const LedgerContext = createContext<LedgerValue | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [month, setMonth] = useState(currentMonth);
  const latest = useRef<Movement[]>([]);
  const chain = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    loadMovements()
      .then((loaded) => {
        if (cancelled) return;
        latest.current = loaded;
        setMovements(loaded);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Não foi possível abrir os lançamentos salvos neste computador.");
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: Movement[]) {
    latest.current = next;
    setMovements(next);
    setError(null);
    chain.current = chain.current.then(async () => {
      const snapshot = latest.current;
      try {
        await saveMovements(snapshot);
      } catch {
        if (latest.current === snapshot) {
          setError("O lançamento apareceu na planilha, mas não foi possível gravar o arquivo.");
        }
      }
    });
  }

  const value = useMemo<LedgerValue>(
    () => ({
      ready,
      error,
      movements,
      month,
      setMonth,
      upsert(movement) {
        const exists = latest.current.some((item) => item.id === movement.id);
        const next = exists
          ? latest.current.map((item) => (item.id === movement.id ? movement : item))
          : [...latest.current, movement];
        persist(next);
      },
      remove(id) {
        persist(latest.current.filter((item) => item.id !== id));
      },
    }),
    [ready, error, movements, month],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerValue {
  const value = useContext(LedgerContext);
  if (!value) throw new Error("useLedger fora do provedor");
  return value;
}
