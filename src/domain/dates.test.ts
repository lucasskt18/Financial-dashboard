import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { brToISO, isoToBR } from "./dates.ts";

describe("datas brasileiras", () => {
  it("converte entre ISO e dd/mm/aaaa", () => {
    assert.equal(isoToBR("2026-10-19"), "19/10/2026");
    assert.equal(brToISO("19/10/2026"), "2026-10-19");
    assert.equal(brToISO("31/02/2026"), null);
    assert.equal(brToISO("10/19/2026"), null);
  });
});
