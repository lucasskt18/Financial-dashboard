import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBRL } from "./money.ts";

describe("parseBRL", () => {
  it("aceita valor com vírgula e milhar", () => {
    assert.equal(parseBRL("42,50"), 4250);
    assert.equal(parseBRL("R$ 1.234,56"), 123456);
    assert.equal(parseBRL("10.50"), 1050);
    assert.equal(parseBRL("1.234"), 123400);
  });

  it("recusa vazio, zero e texto", () => {
    assert.equal(parseBRL(""), null);
    assert.equal(parseBRL("0,00"), null);
    assert.equal(parseBRL("abc"), null);
    assert.equal(parseBRL("-10,00"), null);
  });
});
