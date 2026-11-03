import assert from "node:assert/strict";
import test from "node:test";
import {
  addUtcDays,
  calendarDaysInclusive,
  countWorkingDays,
  formatIsoDate,
  parseIsoDate,
  requiresDirector,
} from "./dates";

function firstMonday(): string {
  let cursor = new Date(Date.UTC(2026, 0, 1));
  while (cursor.getUTCDay() !== 1) cursor = addUtcDays(cursor, 1);
  return formatIsoDate(cursor);
}

test("siedem kolejnych dni od poniedziałku to pięć dni roboczych", () => {
  const monday = firstMonday();
  const start = parseIsoDate(monday);
  assert.ok(start);
  const sunday = formatIsoDate(addUtcDays(start, 6));
  assert.equal(countWorkingDays(monday, sunday, []), 5);
});

test("sobota i święto nie wchodzą do puli", () => {
  const monday = firstMonday();
  const start = parseIsoDate(monday);
  assert.ok(start);
  const friday = formatIsoDate(addUtcDays(start, 4));
  const wednesday = formatIsoDate(addUtcDays(start, 2));
  assert.equal(countWorkingDays(monday, friday, [wednesday]), 4);
  const saturday = formatIsoDate(addUtcDays(start, 5));
  assert.equal(countWorkingDays(saturday, saturday, []), 0);
});

test("próg dyrektora jest powyżej 21 dni kalendarzowych", () => {
  const monday = firstMonday();
  const start = parseIsoDate(monday);
  assert.ok(start);
  const day21 = formatIsoDate(addUtcDays(start, 20));
  const day22 = formatIsoDate(addUtcDays(start, 21));
  assert.equal(calendarDaysInclusive(monday, day21), 21);
  assert.equal(requiresDirector(21), false);
  assert.equal(calendarDaysInclusive(monday, day22), 22);
  assert.equal(requiresDirector(22), true);
  assert.equal(calendarDaysInclusive(monday, monday), 1);
});

test("odwrócone i nieistniejące daty odpadają", () => {
  const monday = firstMonday();
  const start = parseIsoDate(monday);
  assert.ok(start);
  const next = formatIsoDate(addUtcDays(start, 1));
  assert.equal(calendarDaysInclusive(next, monday), null);
  assert.equal(countWorkingDays("2026-02-31", "2026-03-02", []), null);
});
