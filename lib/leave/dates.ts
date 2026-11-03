const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Sprawdza kalendarzową datę YYYY-MM-DD i zwraca północ UTC. Zły dzień, np. 2026-02-31, odpada. */
export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Liczba dni kalendarzowych łącznie z oboma końcami. Null, gdy daty są puste albo odwrócone. */
export function calendarDaysInclusive(from: string, to: string): number | null {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end || end < start) return null;
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return diff + 1;
}

/** Powyżej 3 tygodni = więcej niż 21 dni kalendarzowych. Dokładnie 21 nie idzie do dyrektora. */
export function requiresDirector(calendarDays: number): boolean {
  return calendarDays > 21;
}

const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

/** Zostawia GG:MM. Sekundy z pola type=time są obcinane. */
export function normalizeTime(value: string): string | null {
  const match = TIME_OF_DAY.exec(value);
  if (!match) return null;
  return `${match[1]}:${match[2]}`;
}

/**
 * Godziny między dwiema porami. Null, gdy format nie jest GG:MM,
 * koniec nie jest późniejszy albo minuty nie są wielokrotnością 15.
 */
export function calculateHours(timeFrom: string, timeTo: string): number | null {
  const from = TIME_OF_DAY.exec(timeFrom);
  const to = TIME_OF_DAY.exec(timeTo);
  if (!from || !to) return null;
  const fromMinutes = Number(from[1]) * 60 + Number(from[2]);
  const toMinutes = Number(to[1]) * 60 + Number(to[2]);
  if (toMinutes <= fromMinutes) return null;
  if (fromMinutes % 15 !== 0 || toMinutes % 15 !== 0) return null;
  return (toMinutes - fromMinutes) / 60;
}

/** Sobota, niedziela albo święto. Fałsz także dla nieprawidłowej daty. */
export function isNonWorkingDay(iso: string, holidays: Iterable<string>): boolean {
  const date = parseIsoDate(iso);
  if (!date) return false;
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) return true;
  return new Set(holidays).has(iso);
}

/** Dni robocze: bez sobót, niedziel i dat ze zbioru świąt (YYYY-MM-DD). */
export function countWorkingDays(
  from: string,
  to: string,
  holidays: Iterable<string>,
): number | null {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end || end < start) return null;
  const holidaySet = new Set(holidays);
  let count = 0;
  for (let cursor = start; cursor <= end; cursor = addUtcDays(cursor, 1)) {
    const weekday = cursor.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    if (holidaySet.has(formatIsoDate(cursor))) continue;
    count += 1;
  }
  return count;
}

export function rangesOverlap(
  aFrom: string,
  aTo: string,
  bFrom: string,
  bTo: string,
): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

/** Bieżący dzień w Polsce, niezależnie od strefy procesu na Vercel. */
export function todayInWarsaw(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatPlDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}.${month}.${year}`;
}

export function yearOf(iso: string): number | null {
  const date = parseIsoDate(iso);
  return date ? date.getUTCFullYear() : null;
}

export function shiftIsoDate(iso: string, days: number): string | null {
  const date = parseIsoDate(iso);
  if (!date) return null;
  return formatIsoDate(addUtcDays(date, days));
}

const MONTHS = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

export function monthBounds(month: string): { from: string; to: string; label: string } | null {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  if (start.getUTCFullYear() !== year || start.getUTCMonth() !== monthNumber - 1) return null;
  const end = new Date(Date.UTC(year, monthNumber, 0));
  const label = `${MONTHS[monthNumber - 1]} ${year}`;
  return { from: formatIsoDate(start), to: formatIsoDate(end), label };
}

export function previousMonth(month: string): string | null {
  const bounds = monthBounds(month);
  if (!bounds) return null;
  const start = parseIsoDate(bounds.from);
  if (!start) return null;
  start.setUTCMonth(start.getUTCMonth() - 1);
  return formatIsoDate(start).slice(0, 7);
}

export function nextMonth(month: string): string | null {
  const bounds = monthBounds(month);
  if (!bounds) return null;
  const start = parseIsoDate(bounds.from);
  if (!start) return null;
  start.setUTCMonth(start.getUTCMonth() + 1);
  return formatIsoDate(start).slice(0, 7);
}
