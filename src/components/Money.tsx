import { formatBRL, formatSignedBRL } from "../domain/money.ts";

export function Money({ cents, signed = false }: { cents: number; signed?: boolean }) {
  const tone = cents < 0 ? "neg" : cents > 0 && signed ? "pos" : "flat";
  return <span className={tone}>{signed ? formatSignedBRL(cents) : formatBRL(cents)}</span>;
}
