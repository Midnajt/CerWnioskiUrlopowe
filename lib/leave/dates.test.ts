import assert from "node:assert/strict";
import test from "node:test";
import {
  addUtcDays,
  calculateHours,
  calendarDaysInclusive,
  countWorkingDays,
  formatIsoDate,
  isNonWorkingDay,
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

test("godziny liczą się co kwadrans i tylko do przodu", () => {
  assert.equal(calculateHours("08:00", "12:00"), 4);
  assert.equal(calculateHours("08:00", "08:15"), 0.25);
  assert.equal(calculateHours("08:00:00", "16:00:00"), 8);
  assert.equal(calculateHours("08:10", "09:00"), null);
  assert.equal(calculateHours("12:00", "08:00"), null);
  assert.equal(calculateHours("25:00", "26:00"), null);
});

test("dzień wolny to sobota, niedziela albo święto", () => {
  const monday = firstMonday();
  const start = parseIsoDate(monday);
  assert.ok(start);
  const saturday = formatIsoDate(addUtcDays(start, 5));
  const sunday = formatIsoDate(addUtcDays(start, 6));
  assert.equal(isNonWorkingDay(saturday, []), true);
  assert.equal(isNonWorkingDay(sunday, []), true);
  assert.equal(isNonWorkingDay(monday, []), false);
  assert.equal(isNonWorkingDay(monday, [monday]), true);
  assert.equal(isNonWorkingDay("2026-02-31", []), false);
});

test("odwrócone i nieistniejące daty odpadają", () => {
  const monday = firstMonday();
  const start = parseIsoDate(monday);
  assert.ok(start);
  const next = formatIsoDate(addUtcDays(start, 1));
  assert.equal(calendarDaysInclusive(next, monday), null);
  assert.equal(countWorkingDays("2026-02-31", "2026-03-02", []), null);
});
