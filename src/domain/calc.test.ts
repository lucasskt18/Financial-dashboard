import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMonth, bucketBalance, presentMonth } from "./calc.ts";
import type { Movement } from "./types.ts";

function movement(partial: Pick<Movement, "date" | "kind" | "amountCents"> & Partial<Movement>): Movement {
  return {
    id: partial.id ?? `${partial.kind}-${partial.date}-${partial.amountCents}`,
    date: partial.date,
    kind: partial.kind,
    flow: partial.flow ?? "normal",
    amountCents: partial.amountCents,
    category: partial.category ?? "Outros",
    description: partial.description ?? "",
    createdAt: partial.createdAt ?? "2026-10-01T12:00:00.000Z",
  };
}

describe("buildMonth", () => {
  it("soma só os débitos do dia no custo e ignora economia e investimento", () => {
    const sheet = buildMonth(
      [
        movement({ date: "2026-10-19", kind: "saida", amountCents: 2500 }),
        movement({ date: "2026-10-19", kind: "saida", amountCents: 1750 }),
        movement({ date: "2026-10-18", kind: "saida", amountCents: 900 }),
        movement({ date: "2026-10-19", kind: "economia", amountCents: 10000 }),
        movement({ date: "2026-10-19", kind: "investimento", amountCents: 5000 }),
        movement({ date: "2026-10-19", kind: "entrada", amountCents: 300000 }),
      ],
      "2026-10",
    );

    const day = sheet.rows.find((row) => row.date === "2026-10-19");
    assert.equal(day?.custo, 4250);
    assert.equal(day?.economia, 10000);
    assert.equal(day?.investimento, 5000);
    assert.equal(sheet.saidas, 5150);
  });

  it("calcula o teto com entradas menos economia e investimentos", () => {
    const sheet = buildMonth(
      [
        movement({ date: "2026-10-01", kind: "entrada", amountCents: 310000 }),
        movement({ date: "2026-10-02", kind: "economia", amountCents: 31000 }),
        movement({ date: "2026-10-03", kind: "investimento", amountCents: 15500 }),
        movement({ date: "2026-10-04", kind: "economia", flow: "resgate", amountCents: 3100 }),
      ],
      "2026-10",
    );

    const ceiling = sheet.rows.reduce((total, row) => total + row.teto, 0);
    assert.equal(sheet.base, 310000 - 31000 - 15500 + 3100);
    assert.equal(ceiling, sheet.base);
    assert.equal(sheet.rows[0]?.teto, Math.floor(sheet.base / 31));
  });

  it("distribui os centavos que sobram nos primeiros dias", () => {
    const sheet = buildMonth(
      [movement({ date: "2026-04-01", kind: "entrada", amountCents: 100 })],
      "2026-04",
    );
    assert.equal(sheet.days, 30);
    assert.equal(sheet.rows.slice(0, 10).every((row) => row.teto === 4), true);
    assert.equal(sheet.rows.slice(10).every((row) => row.teto === 3), true);
    assert.equal(
      sheet.rows.reduce((total, row) => total + row.teto, 0),
      100,
    );
  });

  it("deixa o teto em zero quando não há dinheiro disponível", () => {
    const sheet = buildMonth([], "2026-02");
    assert.equal(sheet.days, 28);
    assert.equal(sheet.rows.every((row) => row.teto === 0 && row.custo === 0), true);
  });
});

describe("presentMonth", () => {
  it("atualiza o acumulado até hoje e deixa os dias futuros em aberto", () => {
    const sheet = buildMonth(
      [
        movement({ date: "2026-10-01", kind: "entrada", amountCents: 3100 }),
        movement({ date: "2026-10-19", kind: "saida", amountCents: 200 }),
      ],
      "2026-10",
    );
    const rows = presentMonth(sheet, "2026-10-19");
    const today = rows.find((row) => row.date === "2026-10-19");
    const tomorrow = rows.find((row) => row.date === "2026-10-20");
    const ceilingSoFar = rows.slice(0, 19).reduce((total, row) => total + row.teto, 0);

    assert.equal(today?.custo, 200);
    assert.equal(today?.acumulado, ceilingSoFar - 200);
    assert.equal(tomorrow?.acumulado, null);
    assert.equal(tomorrow?.phase, "future");
  });
});

describe("bucketBalance", () => {
  it("desconta o resgate do saldo guardado", () => {
    const movements = [
      movement({ date: "2026-09-01", kind: "economia", amountCents: 8000 }),
      movement({ date: "2026-10-02", kind: "economia", flow: "resgate", amountCents: 1500 }),
      movement({ date: "2026-10-03", kind: "investimento", amountCents: 4000 }),
    ];
    assert.equal(bucketBalance(movements, "economia"), 6500);
    assert.equal(bucketBalance(movements, "investimento"), 4000);
  });
});
