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
    fullDay: true,
    plannedHours: 40,
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
    fullDay: true,
    plannedHours: 24,
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

test("urlop na żądanie schodzi z podlimitu 4 dni i z puli bieżącej", () => {
  const demand: HoldingRow = {
    id: "d",
    leaveType: "on_demand",
    poolYear: 2026,
    status: "zaakceptowany",
    dateFrom: "2026-11-16",
    dateTo: "2026-11-16",
    workingDays: 1,
    fullDay: true,
    plannedHours: 8,
    allocations: [],
  };
  const summary = summarizeBalances(
    [{ year: 2026, pool: "current", entitled: 26, used: 12 }],
    [demand],
    "2026-11-03",
    2026,
  );
  assert.equal(summary.current?.planned, 1);
  assert.equal(summary.current?.remaining, 13);
  assert.equal(summary.onDemand.planned, 1);
  assert.equal(summary.onDemand.remaining, 3);
});

test("niepełny urlop na żądanie schodzi ułamkiem doby", () => {
  const demand: HoldingRow = {
    id: "h",
    leaveType: "on_demand",
    poolYear: 2026,
    status: "oczekuje_przelozonego",
    dateFrom: "2026-11-16",
    dateTo: "2026-11-16",
    workingDays: 1,
    fullDay: false,
    plannedHours: 4,
    allocations: [],
  };
  const summary = summarizeBalances(
    [{ year: 2026, pool: "current", entitled: 26, used: 12 }],
    [demand],
    "2026-11-03",
    2026,
  );
  assert.equal(summary.current?.planned, 0.5);
  assert.equal(summary.onDemand.planned, 0.5);
  assert.equal(summary.onDemand.remaining, 3.5);
});

test("odbiór za sobotę nie pomniejsza puli wypoczynkowej", () => {
  const compensation: HoldingRow = {
    id: "s",
    leaveType: "saturday_comp",
    poolYear: 2026,
    status: "zaakceptowany",
    dateFrom: "2026-11-16",
    dateTo: "2026-11-16",
    workingDays: 1,
    fullDay: true,
    plannedHours: 8,
    allocations: [],
  };
  const summary = summarizeBalances(
    [{ year: 2026, pool: "current", entitled: 26, used: 12 }],
    [compensation],
    "2026-11-03",
    2026,
  );
  assert.equal(summary.current?.planned, 0);
  assert.equal(summary.current?.remaining, 14);
  assert.equal(summary.onDemand.remaining, 4);
});

test("podlimit na żądanie nie przekracza puli bieżącej", () => {
  const summary = summarizeBalances(
    [{ year: 2026, pool: "current", entitled: 2, used: 0 }],
    [],
    "2026-11-03",
    2026,
  );
  assert.equal(summary.onDemand.remaining, 2);
});

test("bez puli bieżącej urlop na żądanie ma pozostało zero", () => {
  const summary = summarizeBalances([], [], "2026-11-03", 2026);
  assert.equal(summary.current, null);
  assert.equal(summary.onDemand.entitled, 4);
  assert.equal(summary.onDemand.remaining, 0);
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
