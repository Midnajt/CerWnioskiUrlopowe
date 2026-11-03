import "server-only";
import { dbError, getDb } from "@/lib/db/client";
import type { BalanceRow, HoldingRow } from "@/lib/leave/limits";
import type { LeavePool, LeaveStatus, LeaveType } from "@/lib/leave/workflow";
import type { LeaveEvent, LeaveRequest } from "@/lib/types";

type RequestRow = {
  id: string;
  request_number: string;
  employee_id: string;
  leave_type: LeaveType;
  status: LeaveStatus;
  date_from: string;
  date_to: string;
  working_days: number;
  calendar_days: number;
  requires_director: boolean;
  worked_date: string | null;
  full_day: boolean;
  time_from: string | null;
  time_to: string | null;
  planned_hours: number | string;
  substitute_employee_id: string | null;
  manager_assignee_id: string | null;
  director_assignee_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

const REQUEST_COLUMNS =
  "id, request_number, employee_id, leave_type, status, date_from, date_to, working_days, calendar_days, requires_director, worked_date, full_day, time_from, time_to, planned_hours, substitute_employee_id, manager_assignee_id, director_assignee_id, submitted_at, created_at, updated_at";

function mapRequest(row: RequestRow): LeaveRequest {
  return {
    id: row.id,
    requestNumber: row.request_number,
    employeeId: row.employee_id,
    leaveType: row.leave_type,
    status: row.status,
    dateFrom: row.date_from,
    dateTo: row.date_to,
    workingDays: row.working_days,
    calendarDays: row.calendar_days,
    requiresDirector: row.requires_director,
    workedDate: row.worked_date,
    fullDay: row.full_day,
    timeFrom: row.time_from,
    timeTo: row.time_to,
    plannedHours: Number(row.planned_hours),
    substituteEmployeeId: row.substitute_employee_id,
    managerAssigneeId: row.manager_assignee_id,
    directorAssigneeId: row.director_assignee_id,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function nextRequestNumber(): Promise<string> {
  const { data, error } = await getDb().rpc("next_leave_number");
  if (error) throw dbError(error);
  if (typeof data !== "string" || data.length === 0) throw new Error("Brak numeru wniosku");
  return data;
}

export async function listBalances(employeeId: string): Promise<BalanceRow[]> {
  const { data, error } = await getDb()
    .from("leave_balances")
    .select("year, pool, entitled_days, used_days")
    .eq("employee_id", employeeId);
  if (error) throw dbError(error);
  return (data ?? []).map((row) => ({
    year: row.year as number,
    pool: row.pool as LeavePool,
    entitled: row.entitled_days as number,
    used: row.used_days as number,
  }));
}

export async function listAllBalances(): Promise<(BalanceRow & { employeeId: string })[]> {
  const { data, error } = await getDb()
    .from("leave_balances")
    .select("employee_id, year, pool, entitled_days, used_days");
  if (error) throw dbError(error);
  return (data ?? []).map((row) => ({
    employeeId: row.employee_id as string,
    year: row.year as number,
    pool: row.pool as LeavePool,
    entitled: row.entitled_days as number,
    used: row.used_days as number,
  }));
}

type AllocationRow = { request_id: string; year: number; days: number };

async function allocationsByRequest(requestIds: string[]): Promise<Map<string, { year: number; days: number }[]>> {
  const grouped = new Map<string, { year: number; days: number }[]>();
  if (requestIds.length === 0) return grouped;
  const { data, error } = await getDb()
    .from("leave_allocations")
    .select("request_id, year, days")
    .in("request_id", requestIds);
  if (error) throw dbError(error);
  for (const row of (data ?? []) as AllocationRow[]) {
    const list = grouped.get(row.request_id) ?? [];
    list.push({ year: row.year, days: row.days });
    grouped.set(row.request_id, list);
  }
  return grouped;
}

function toHolding(row: RequestRow, allocations: { year: number; days: number }[]): HoldingRow {
  return {
    id: row.id,
    leaveType: row.leave_type,
    poolYear: Number(row.date_from.slice(0, 4)),
    status: row.status,
    dateFrom: row.date_from,
    dateTo: row.date_to,
    workingDays: row.working_days,
    fullDay: row.full_day,
    plannedHours: Number(row.planned_hours),
    allocations,
  };
}

/** Wnioski, które mogą zajmować limit albo kolidować z zastępstwem. */
export async function listHoldingsForEmployees(employeeIds: string[]): Promise<(HoldingRow & { employeeId: string })[]> {
  if (employeeIds.length === 0) return [];
  const { data, error } = await getDb()
    .from("leave_requests")
    .select(REQUEST_COLUMNS)
    .in("employee_id", employeeIds)
    .in("status", ["oczekuje_przelozonego", "oczekuje_dyrektora", "oczekuje_kadr", "zaakceptowany"]);
  if (error) throw dbError(error);
  const rows = (data ?? []) as RequestRow[];
  const allocations = await allocationsByRequest(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...toHolding(row, allocations.get(row.id) ?? []),
    employeeId: row.employee_id,
  }));
}

export async function getRequest(id: string): Promise<LeaveRequest | null> {
  const { data, error } = await getDb().from("leave_requests").select(REQUEST_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw dbError(error);
  if (!data) return null;
  return mapRequest(data as RequestRow);
}

export async function listAllocations(requestId: string): Promise<{ year: number; days: number }[]> {
  const grouped = await allocationsByRequest([requestId]);
  return grouped.get(requestId) ?? [];
}

export type NewRequest = {
  requestNumber: string;
  employeeId: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  dateFrom: string;
  dateTo: string;
  workingDays: number;
  calendarDays: number;
  requiresDirector: boolean;
  workedDate: string | null;
  fullDay: boolean;
  timeFrom: string | null;
  timeTo: string | null;
  plannedHours: number;
  substituteEmployeeId: string | null;
  managerAssigneeId: string | null;
  directorAssigneeId: string | null;
  submittedAt: string | null;
};

export async function insertRequest(input: NewRequest): Promise<LeaveRequest> {
  const { data, error } = await getDb()
    .from("leave_requests")
    .insert({
      request_number: input.requestNumber,
      employee_id: input.employeeId,
      leave_type: input.leaveType,
      status: input.status,
      date_from: input.dateFrom,
      date_to: input.dateTo,
      working_days: input.workingDays,
      calendar_days: input.calendarDays,
      requires_director: input.requiresDirector,
      worked_date: input.workedDate,
      full_day: input.fullDay,
      time_from: input.timeFrom,
      time_to: input.timeTo,
      planned_hours: input.plannedHours,
      substitute_employee_id: input.substituteEmployeeId,
      manager_assignee_id: input.managerAssigneeId,
      director_assignee_id: input.directorAssigneeId,
      submitted_at: input.submittedAt,
    })
    .select(REQUEST_COLUMNS)
    .single();
  if (error) throw dbError(error);
  return mapRequest(data as RequestRow);
}

export type RequestPatch = {
  leaveType: LeaveType;
  status: LeaveStatus;
  dateFrom: string;
  dateTo: string;
  workingDays: number;
  calendarDays: number;
  requiresDirector: boolean;
  workedDate: string | null;
  fullDay: boolean;
  timeFrom: string | null;
  timeTo: string | null;
  plannedHours: number;
  substituteEmployeeId: string | null;
  managerAssigneeId: string | null;
  directorAssigneeId: string | null;
  submittedAt: string | null;
};

export async function updateRequest(id: string, patch: RequestPatch): Promise<LeaveRequest> {
  const { data, error } = await getDb()
    .from("leave_requests")
    .update({
      leave_type: patch.leaveType,
      status: patch.status,
      date_from: patch.dateFrom,
      date_to: patch.dateTo,
      working_days: patch.workingDays,
      calendar_days: patch.calendarDays,
      requires_director: patch.requiresDirector,
      worked_date: patch.workedDate,
      full_day: patch.fullDay,
      time_from: patch.timeFrom,
      time_to: patch.timeTo,
      planned_hours: patch.plannedHours,
      substitute_employee_id: patch.substituteEmployeeId,
      manager_assignee_id: patch.managerAssigneeId,
      director_assignee_id: patch.directorAssigneeId,
      submitted_at: patch.submittedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(REQUEST_COLUMNS)
    .single();
  if (error) throw dbError(error);
  return mapRequest(data as RequestRow);
}

export async function updateRequestStatus(
  id: string,
  patch: {
    status: LeaveStatus;
    managerAssigneeId?: string | null;
    directorAssigneeId?: string | null;
    substituteEmployeeId?: string | null;
  },
): Promise<void> {
  const row: Record<string, string | null> = {
    status: patch.status,
    updated_at: new Date().toISOString(),
  };
  if (patch.managerAssigneeId !== undefined) row.manager_assignee_id = patch.managerAssigneeId;
  if (patch.directorAssigneeId !== undefined) row.director_assignee_id = patch.directorAssigneeId;
  if (patch.substituteEmployeeId !== undefined) row.substitute_employee_id = patch.substituteEmployeeId;
  const { error } = await getDb().from("leave_requests").update(row).eq("id", id);
  if (error) throw dbError(error);
}

export async function replaceAllocations(
  requestId: string,
  allocations: { year: number; days: number }[],
): Promise<void> {
  const removed = await getDb().from("leave_allocations").delete().eq("request_id", requestId);
  if (removed.error) throw dbError(removed.error);
  if (allocations.length === 0) return;
  const inserted = await getDb()
    .from("leave_allocations")
    .insert(allocations.map((item) => ({ request_id: requestId, year: item.year, days: item.days })));
  if (inserted.error) throw dbError(inserted.error);
}

export async function addEvent(input: {
  requestId: string;
  actorId: string | null;
  action: string;
  comment: string | null;
  fromStatus: string | null;
  toStatus: string;
}): Promise<void> {
  const { error } = await getDb().from("leave_events").insert({
    request_id: input.requestId,
    actor_id: input.actorId,
    action: input.action,
    comment: input.comment,
    from_status: input.fromStatus,
    to_status: input.toStatus,
  });
  if (error) throw dbError(error);
}

export async function listEvents(requestId: string): Promise<LeaveEvent[]> {
  const { data, error } = await getDb()
    .from("leave_events")
    .select("id, request_id, actor_id, action, comment, from_status, to_status, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error) throw dbError(error);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    requestId: row.request_id as string,
    actorId: (row.actor_id as string | null) ?? null,
    action: row.action as string,
    comment: (row.comment as string | null) ?? null,
    fromStatus: (row.from_status as string | null) ?? null,
    toStatus: row.to_status as string,
    createdAt: row.created_at as string,
  }));
}

export async function listRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
  const { data, error } = await getDb()
    .from("leave_requests")
    .select(REQUEST_COLUMNS)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });
  if (error) throw dbError(error);
  return ((data ?? []) as RequestRow[]).map(mapRequest);
}

export async function listQueue(): Promise<LeaveRequest[]> {
  const { data, error } = await getDb()
    .from("leave_requests")
    .select(REQUEST_COLUMNS)
    .in("status", ["oczekuje_przelozonego", "oczekuje_dyrektora", "oczekuje_kadr"])
    .order("submitted_at", { ascending: true });
  if (error) throw dbError(error);
  return ((data ?? []) as RequestRow[]).map(mapRequest);
}

export async function listRequestsInRange(dateFrom: string, dateTo: string): Promise<LeaveRequest[]> {
  const { data, error } = await getDb()
    .from("leave_requests")
    .select(REQUEST_COLUMNS)
    .in("status", ["oczekuje_przelozonego", "oczekuje_dyrektora", "oczekuje_kadr", "zaakceptowany"])
    .lte("date_from", dateTo)
    .gte("date_to", dateFrom);
  if (error) throw dbError(error);
  return ((data ?? []) as RequestRow[]).map(mapRequest);
}
