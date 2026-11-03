import { formatIsoDate } from "../lib/leave/dates";

type Holiday = { date: string; name: string };

/** Niedziela Wielkanocna według algorytmu Meeusa. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function plusDays(date: Date, days: number): string {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return formatIsoDate(next);
}

/** Polskie święta ustawowe. Weekendy i tak odpada licznik dni roboczych. */
export function polishHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  const fixed: Holiday[] = [
    { date: `${year}-01-01`, name: "Nowy Rok" },
    { date: `${year}-01-06`, name: "Trzech Króli" },
    { date: `${year}-05-01`, name: "Święto Pracy" },
    { date: `${year}-05-03`, name: "Święto Konstytucji 3 Maja" },
    { date: `${year}-08-15`, name: "Wniebowzięcie Najświętszej Maryi Panny" },
    { date: `${year}-11-01`, name: "Wszystkich Świętych" },
    { date: `${year}-11-11`, name: "Narodowe Święto Niepodległości" },
    { date: `${year}-12-25`, name: "Boże Narodzenie" },
    { date: `${year}-12-26`, name: "Drugi dzień Bożego Narodzenia" },
  ];
  const movable: Holiday[] = [
    { date: formatIsoDate(easter), name: "Wielkanoc" },
    { date: plusDays(easter, 1), name: "Poniedziałek Wielkanocny" },
    { date: plusDays(easter, 49), name: "Zesłanie Ducha Świętego" },
    { date: plusDays(easter, 60), name: "Boże Ciało" },
  ];
  return [...fixed, ...movable];
}
