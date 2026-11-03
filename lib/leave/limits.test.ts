import assert from "node:assert/strict";
import test from "node:test";
import { allocateOldest, summarizeBalances, type HoldingRow } from "./limits";

test("przykład ze specyfikacji: 26, wykorzystano 12, zaplanowano 5, zostało 9", () => {
  const planned: HoldingRow = {
    id: "a",
    leaveType: "current",
    poolYear: 2026,
    status: "zaakceptowany",
    dateFrom: "2026-11-16",
    dateTo: "2026-12-01",
    workingDays: 5,
    allocations: [],
  };
  const summary = summarizeBalances(
    [{ year: 2026, pool: "current", entitled: 26, used: 12 }],
    [planned],
    "2026-11-03",
    2026,
  );
  assert.equal(summary.current?.used, 12);
  assert.equal(summary.current?.planned, 5);
  assert.equal(summary.current?.remaining, 9);
});

test("zakończona akceptacja schodzi do wykorzystanych, nie do planu", () => {
  const past: HoldingRow = {
    id: "b",
    leaveType: "current",
    poolYear: 2026,
    status: "zaakceptowany",
    dateFrom: "2026-09-28",
    dateTo: "2026-10-01",
    workingDays: 3,
    allocations: [],
  };
  const summary = summarizeBalances(
    [{ year: 2026, pool: "current", entitled: 20, used: 1 }],
    [past],
    "2026-11-03",
    2026,
  );
  assert.equal(summary.current?.used, 4);
  assert.equal(summary.current?.planned, 0);
  assert.equal(summary.current?.remaining, 16);
});

test("zaległy schodzi od najstarszego roku", () => {
  const allocation = allocateOldest(5, [
    { year: 2025, remaining: 6 },
    { year: 2024, remaining: 1 },
  ]);
  assert.deepEqual(allocation, [
    { year: 2024, days: 1 },
    { year: 2025, days: 4 },
  ]);
  assert.equal(allocateOldest(9, [{ year: 2024, remaining: 1 }, { year: 2025, remaining: 6 }]), null);
});
