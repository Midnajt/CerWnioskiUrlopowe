import { formatPlDate } from "@/lib/leave/dates";
import { isHoldingStatus, type LeaveStatus, type LeaveType } from "@/lib/leave/workflow";

export type BalanceRow = {
  year: number;
  pool: LeaveType;
  entitled: number;
  used: number;
};

export type HoldingRow = {
  id: string;
  leaveType: LeaveType;
  poolYear: number;
  status: LeaveStatus;
  dateFrom: string;
  dateTo: string;
  workingDays: number;
  allocations: { year: number; days: number }[];
};

export type YearPool = {
  year: number;
  entitled: number;
  used: number;
  planned: number;
  remaining: number;
};

export type BalanceSummary = {
  current: YearPool | null;
  overdueYears: YearPool[];
  overdueRemaining: number;
};

function consume(status: LeaveStatus, dateTo: string, today: string, days: number, pool: YearPool): void {
  if (!isHoldingStatus(status)) return;
  if (status === "zaakceptowany" && dateTo < today) pool.used += days;
  else pool.planned += days;
}

function finish(pool: YearPool): YearPool {
  return { ...pool, remaining: pool.entitled - pool.used - pool.planned };
}

/** Wykorzystane to historia spoza wniosków plus zakończone akceptacje. Reszta wniosków w toku jest planem. */
export function summarizeBalances(
  balances: BalanceRow[],
  holdings: HoldingRow[],
  today: string,
  currentYear: number,
): BalanceSummary {
  const currentSource = balances.find((row) => row.pool === "current" && row.year === currentYear);
  const current = currentSource
    ? { year: currentYear, entitled: currentSource.entitled, used: currentSource.used, planned: 0, remaining: 0 }
    : null;

  if (current) {
    for (const holding of holdings) {
      if (holding.leaveType !== "current" || holding.poolYear !== currentYear) continue;
      consume(holding.status, holding.dateTo, today, holding.workingDays, current);
    }
  }

  const overdueYears = balances
    .filter((row) => row.pool === "overdue")
    .sort((a, b) => a.year - b.year)
    .map((row) => {
      const pool: YearPool = {
        year: row.year,
        entitled: row.entitled,
        used: row.used,
        planned: 0,
        remaining: 0,
      };
      for (const holding of holdings) {
        if (holding.leaveType !== "overdue") continue;
        const allocation = holding.allocations.find((item) => item.year === row.year);
        if (!allocation) continue;
        consume(holding.status, holding.dateTo, today, allocation.days, pool);
      }
      return finish(pool);
    });

  return {
    current: current ? finish(current) : null,
    overdueYears,
    overdueRemaining: overdueYears.reduce((sum, year) => sum + year.remaining, 0),
  };
}

/** Najstarszy rok pierwszy. Null, gdy puli nie starcza. */
export function allocateOldest(
  days: number,
  years: { year: number; remaining: number }[],
): { year: number; days: number }[] | null {
  if (days <= 0) return [];
  const sorted = [...years].sort((a, b) => a.year - b.year);
  const result: { year: number; days: number }[] = [];
  let left = days;
  for (const year of sorted) {
    if (left <= 0) break;
    if (year.remaining <= 0) continue;
    const take = Math.min(year.remaining, left);
    result.push({ year: year.year, days: take });
    left -= take;
  }
  if (left > 0) return null;
  return result;
}

export function teamAbsenceWarning(input: {
  teamSize: number;
  absentCount: number;
  dateFrom: string;
  dateTo: string;
}): string {
  const from = formatPlDate(input.dateFrom);
  const to = formatPlDate(input.dateTo);
  return `UWAGA. W dniach ${from}–${to} nieobecnych będzie ${input.absentCount} z ${input.teamSize} pracowników zespołu.`;
}

export const LIMIT_BLOCK_MESSAGE = "UWAGA: wybrany termin przekracza dostępny limit urlopu.";

export const SUBSTITUTE_BLOCK_MESSAGE =
  "UWAGA – wskazana osoba jest nieobecna w części lub całości wskazanego okresu. Wybierz inną osobę.";
