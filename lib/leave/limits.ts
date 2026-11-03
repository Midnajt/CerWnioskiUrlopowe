import { formatPlDate } from "@/lib/leave/dates";
import { isHoldingStatus, type LeavePool, type LeaveStatus, type LeaveType } from "@/lib/leave/workflow";

export type BalanceRow = {
  year: number;
  pool: LeavePool;
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
  fullDay: boolean;
  plannedHours: number;
  allocations: { year: number; days: number }[];
};

/** Urlop na żądanie jest częścią wypoczynkowego i ma własny roczny podlimit. */
export const ON_DEMAND_YEAR_LIMIT = 4;

export type OnDemandPool = {
  entitled: number;
  used: number;
  planned: number;
  remaining: number;
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
  onDemand: OnDemandPool;
};

/** Cały dzień liczy się jako dni robocze. Niepełny dzień to ułamek doby z godzin. */
export function chargedDays(holding: Pick<HoldingRow, "fullDay" | "workingDays" | "plannedHours">): number {
  if (holding.fullDay) return holding.workingDays;
  return holding.plannedHours / 8;
}

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

  const onDemand: OnDemandPool = {
    entitled: ON_DEMAND_YEAR_LIMIT,
    used: 0,
    planned: 0,
    remaining: 0,
  };

  if (current) {
    for (const holding of holdings) {
      if (holding.poolYear !== currentYear) continue;
      if (holding.leaveType !== "current" && holding.leaveType !== "on_demand") continue;
      consume(holding.status, holding.dateTo, today, chargedDays(holding), current);
    }
  }

  for (const holding of holdings) {
    if (holding.leaveType !== "on_demand" || holding.poolYear !== currentYear) continue;
    if (!isHoldingStatus(holding.status)) continue;
    const days = chargedDays(holding);
    if (holding.status === "zaakceptowany" && holding.dateTo < today) onDemand.used += days;
    else onDemand.planned += days;
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

  const currentFinished = current ? finish(current) : null;
  const onDemandLeft = ON_DEMAND_YEAR_LIMIT - onDemand.used - onDemand.planned;
  onDemand.remaining = Math.max(0, Math.min(onDemandLeft, currentFinished?.remaining ?? 0));

  return {
    current: currentFinished,
    overdueYears,
    overdueRemaining: overdueYears.reduce((sum, year) => sum + year.remaining, 0),
    onDemand,
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

export const ON_DEMAND_LIMIT_BLOCK_MESSAGE =
  "UWAGA: wybrany termin przekracza limit urlopu na żądanie (4 dni w roku) albo dostępny urlop wypoczynkowy.";

export const SHORT_NOTICE_WARNING =
  "UWAGA: wniosek jest składany w dniu rozpoczęcia nieobecności albo później.";

export const SUBSTITUTE_BLOCK_MESSAGE =
  "UWAGA – wskazana osoba jest nieobecna w części lub całości wskazanego okresu. Wybierz inną osobę.";
