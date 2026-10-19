import { describe, expect, it } from "vitest";
import { planAction, type PlanInput } from "./plan";

const ICP = 100_000_000n;
const base = (over: Partial<PlanInput>): PlanInput => ({
  kind: "send",
  amountE8s: 1n * ICP,
  notes: [],
  publicE8s: 1n * ICP,
  sendFeeE8s: 10_000_000n,
  ledgerFeeE8s: 10_000n,
  moveOutFee: (a) => 10_000n + (a * 30n + 9_999n) / 10_000n,
  ...over,
});
const kinds = (p: ReturnType<typeof planAction>) => p.steps.map((s) => s.kind);

describe("planAction", () => {
  it("sends straight from two notes that cover amount + fee", () => {
    const p = planAction(base({ notes: [2n * ICP, 1n * ICP] }));
    expect(p.possible).toBe(true);
    expect(kinds(p)).toEqual(["main"]);
    expect(p.privateFeesE8s).toBe(10_000_000n);
    expect(p.publicFeesE8s).toBe(0n);
  });

  it("tops up a single note before sending, paying only network fees from the ICP balance", () => {
    const p = planAction(base({ notes: [5n * ICP] }));
    expect(kinds(p)).toEqual(["topUp", "main"]);
    expect(p.publicFeesE8s).toBe(20_000n);
  });

  it("refuses a top-up when the ICP balance cannot pay for it, and says what to do", () => {
    const p = planAction(base({ notes: [5n * ICP], publicE8s: 0n }));
    expect(p.possible).toBe(false);
    expect(p.reason).toMatch(/0\.0003 ICP/);
  });

  it("merges the largest notes when the top two do not cover the payment", () => {
    const p = planAction(base({ amountE8s: 25n * ICP / 10n, notes: [1n * ICP, 1n * ICP, 1n * ICP] }));
    expect(kinds(p)).toEqual(["merge", "main"]);
    expect(p.privateFeesE8s).toBe(20_000_000n);
  });

  it("refuses when the balance cannot cover amount + fees", () => {
    expect(planAction(base({ amountE8s: 3n * ICP, notes: [1n * ICP, 1n * ICP, 1n * ICP] })).possible).toBe(false);
    expect(planAction(base({ notes: [] })).reason).toMatch(/empty/);
  });

  it("charges the move-out fee (network fee + 0.3% rounded up) and needs two notes", () => {
    const p = planAction(base({ kind: "moveOut", amountE8s: 1n * ICP, notes: [2n * ICP] }));
    expect(kinds(p)).toEqual(["topUp", "main"]);
    expect(p.privateFeesE8s).toBe(10_000n + 300_000n);
  });

  it("plans a claimable payment as two parts with three notes and three send fees", () => {
    const p = planAction(base({ kind: "claimable", amountE8s: 1n * ICP, notes: [2n * ICP, 1n * ICP] }));
    expect(kinds(p)).toEqual(["topUp", "main", "part2"]);
    expect(p.privateFeesE8s).toBe(30_000_000n);
    expect(p.deliveredE8s).toBe(1n * ICP);
  });

  it("makes part 1 leave change that covers part 2's fee", () => {
    // top two = 1.25 ICP: covers 1 + 0.1 + 0.1 but not the third fee for part 2's change
    const p = planAction(base({ kind: "claimable", amountE8s: 1n * ICP, notes: [ICP, 25_000_000n, 20_000_000n] }));
    expect(kinds(p)[0]).toBe("merge");
  });
});
