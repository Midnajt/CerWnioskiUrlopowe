import "server-only";
import {
  addEvent,
  addNotifications,
  countHr,
  getEmployeeById,
  getRequest,
  insertRequest,
  listBalances,
  listDirectors,
  listEmployees,
  listHoldingsForEmployees,
  listHolidayDates,
  listSubstitutions,
  nextRequestNumber,
  replaceAllocations,
  updateRequest,
  updateRequestStatus,
} from "@/lib/db";
import {
  calculateHours,
  calendarDaysInclusive,
  countWorkingDays,
  isNonWorkingDay,
  normalizeTime,
  parseIsoDate,
  rangesOverlap,
  todayInWarsaw,
  yearOf,
} from "@/lib/leave/dates";
import { fullName } from "@/lib/leave/labels";
import {
  LIMIT_BLOCK_MESSAGE,
  ON_DEMAND_LIMIT_BLOCK_MESSAGE,
  SUBSTITUTE_BLOCK_MESSAGE,
  allocateOldest,
  summarizeBalances,
} from "@/lib/leave/limits";
import {
  canEdit,
  canWithdraw,
  decide,
  initialStatus,
  isLeaveType,
  resolveAssignee,
  type DecisionAction,
  type LeaveStatus,
} from "@/lib/leave/workflow";
import type { Employee, LeaveRequest } from "@/lib/types";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type LeaveBody = {
  leaveType: string;
  dateFrom: string;
  dateTo: string;
  substituteId: string | null;
  submit: boolean;
  workedDate: string | null;
  fullDay: boolean;
  timeFrom: string | null;
  timeTo: string | null;
};

function fail(error: string, status: number): { ok: false; error: string; status: number } {
  return { ok: false, error, status };
}

async function assigneeForDirector(requesterId: string, today: string): Promise<string | null> {
  const [directors, substitutions] = await Promise.all([listDirectors(), listSubstitutions()]);
  for (const director of directors) {
    const assignee = resolveAssignee(director.id, today, substitutions);
    if (assignee && assignee !== requesterId) return assignee;
  }
  return null;
}

async function assigneeForManager(employee: Employee, today: string): Promise<string | null> {
  const substitutions = await listSubstitutions();
  const assignee = resolveAssignee(employee.managerId, today, substitutions);
  if (!assignee || assignee === employee.id) return null;
  return assignee;
}

async function validateSubstitute(
  substituteId: string,
  ownerId: string,
  dateFrom: string,
  dateTo: string,
): Promise<ServiceResult<true>> {
  if (!UUID.test(substituteId)) return fail("Wybierz zastępcę z listy.", 400);
  if (substituteId === ownerId) return fail("Nie możesz zastępować samego siebie.", 400);
  const substitute = await getEmployeeById(substituteId);
  if (!substitute || !substitute.active) return fail("Zastępca musi być aktywnym pracownikiem.", 400);
  const holdings = await listHoldingsForEmployees([substituteId]);
  const absent = holdings.some((row) => rangesOverlap(dateFrom, dateTo, row.dateFrom, row.dateTo));
  if (absent) return fail(SUBSTITUTE_BLOCK_MESSAGE, 400);
  return { ok: true, data: true };
}

async function notifyTransition(input: {
  request: LeaveRequest;
  owner: Employee;
  status: LeaveStatus;
  managerAssigneeId: string | null;
  directorAssigneeId: string | null;
}): Promise<void> {
  const number = input.request.requestNumber;
  const who = fullName(input.owner);
  const items: { recipientId: string; requestId: string; body: string }[] = [];
  const ownerText: Partial<Record<LeaveStatus, string>> = {
    oczekuje_przelozonego: `Wniosek ${number} czeka na przełożonego.`,
    oczekuje_dyrektora: `Wniosek ${number} czeka na dyrektora.`,
    oczekuje_kadr: `Wniosek ${number} czeka na kadry.`,
    zaakceptowany: `Wniosek ${number} został zaakceptowany.`,
    odrzucony: `Wniosek ${number} został odrzucony.`,
    cofniety_pracownik: `Wniosek ${number} wrócił do poprawy.`,
    wycofany: `Wniosek ${number} został wycofany.`,
  };
  const ownerMessage = ownerText[input.status];
  if (ownerMessage) {
    items.push({ recipientId: input.owner.id, requestId: input.request.id, body: ownerMessage });
  }
  if (input.status === "oczekuje_przelozonego" && input.managerAssigneeId) {
    items.push({
      recipientId: input.managerAssigneeId,
      requestId: input.request.id,
      body: `Wniosek od ${who} czeka na Twoją akceptację.`,
    });
  }
  if (input.status === "oczekuje_dyrektora" && input.directorAssigneeId) {
    items.push({
      recipientId: input.directorAssigneeId,
      requestId: input.request.id,
      body: `Wniosek od ${who} wymaga akceptacji dyrektora.`,
    });
  }
  if (input.status === "oczekuje_kadr") {
    const staff = await listEmployees();
    for (const person of staff) {
      if (!person.isHr || !person.active || person.id === input.owner.id) continue;
      items.push({
        recipientId: person.id,
        requestId: input.request.id,
        body: `Wniosek ${number} od ${who} czeka na kontrolę kadr.`,
      });
    }
  }
  await addNotifications(items);
}

/**
 * Cały dzień zamienia dni robocze na godziny po 8.
 * Niepełny dzień jest jednym dniem roboczym i nie dotyczy urlopu zaległego.
 */
function resolveHours(
  body: LeaveBody,
  workingDays: number,
):
  | { ok: true; fullDay: boolean; timeFrom: string | null; timeTo: string | null; plannedHours: number }
  | { ok: false; error: string; status: number } {
  if (body.fullDay) {
    return { ok: true, fullDay: true, timeFrom: null, timeTo: null, plannedHours: workingDays * 8 };
  }
  if (body.leaveType === "overdue") return fail("Urlop zaległy obejmuje całe dni.", 400);
  if (body.dateFrom !== body.dateTo) return fail("Niepełny dzień dotyczy jednego dnia.", 400);
  if (workingDays !== 1) return fail("Niepełny dzień musi przypadać w dniu roboczym.", 400);
  const timeFrom = body.timeFrom ? normalizeTime(body.timeFrom) : null;
  const timeTo = body.timeTo ? normalizeTime(body.timeTo) : null;
  const plannedHours = timeFrom && timeTo ? calculateHours(timeFrom, timeTo) : null;
  if (!timeFrom || !timeTo || plannedHours === null) {
    return fail("Podaj godziny w formacie GG:MM, w krokach co 15 minut.", 400);
  }
  if (plannedHours > 8) return fail("Niepełny dzień może trwać najwyżej 8 godzin.", 400);
  return { ok: true, fullDay: false, timeFrom, timeTo, plannedHours };
}

/** Zapis roboczy albo złożenie. Edycja tylko własnego wniosku w statusie roboczym lub cofniętym. */
export async function saveLeave(
  actor: Employee,
  body: LeaveBody,
  existingId?: string,
): Promise<ServiceResult<{ id: string }>> {
  if (!isLeaveType(body.leaveType)) return fail("Wybierz rodzaj urlopu.", 400);
  const calendarDays = calendarDaysInclusive(body.dateFrom, body.dateTo);
  const holidays = await listHolidayDates();
  const workingDays =
    calendarDays === null ? null : countWorkingDays(body.dateFrom, body.dateTo, holidays);
  if (calendarDays === null || workingDays === null) return fail("Podaj prawidłowy termin urlopu.", 400);
  if (body.submit && workingDays === 0) return fail("W wybranym terminie nie ma dni roboczych.", 400);

  const span = resolveHours(body, workingDays);
  if (!span.ok) return span;

  if (body.leaveType === "saturday_comp") {
    if (body.dateFrom !== body.dateTo) return fail("Odbiór dnia wolnego dotyczy jednego dnia.", 400);
    if (!body.workedDate || !parseIsoDate(body.workedDate)) {
      return fail("Wskaż dzień, w którym wykonywano pracę.", 400);
    }
    if (!isNonWorkingDay(body.workedDate, holidays)) {
      return fail("Dzień pracy musi przypadać w sobotę, niedzielę albo święto.", 400);
    }
    if (body.workedDate >= body.dateFrom && body.workedDate <= body.dateTo) {
      return fail("Dzień pracy nie może pokrywać się z dniem odbioru.", 400);
    }
  }

  const poolYear = yearOf(body.dateFrom);
  if (!poolYear) return fail("Podaj prawidłowy termin urlopu.", 400);

  let existing: LeaveRequest | null = null;
  if (existingId) {
    existing = await getRequest(existingId);
    if (!existing || existing.employeeId !== actor.id) return fail("Nie ma takiego wniosku.", 404);
    if (!canEdit(existing.status)) return fail("Tego wniosku nie można już edytować.", 403);
  }

  if (body.substituteId) {
    const substitute = await validateSubstitute(body.substituteId, actor.id, body.dateFrom, body.dateTo);
    if (!substitute.ok) return substitute;
  } else if (body.submit) {
    return fail("Wskaż zastępcę.", 400);
  }

  const today = todayInWarsaw();
  const balances = await listBalances(actor.id);
  const holdings = (await listHoldingsForEmployees([actor.id])).filter((row) => row.id !== existing?.id);
  const summary = summarizeBalances(balances, holdings, today, poolYear);

  const daysCharged = span.fullDay ? workingDays : span.plannedHours / 8;
  let allocations: { year: number; days: number }[] = [];
  if (body.leaveType === "overdue") {
    const allocated = allocateOldest(
      workingDays,
      summary.overdueYears.map((year) => ({ year: year.year, remaining: year.remaining })),
    );
    if (body.submit && !allocated) return fail(LIMIT_BLOCK_MESSAGE, 400);
    allocations = allocated ?? [];
  } else if (body.leaveType === "current" && body.submit && daysCharged > (summary.current?.remaining ?? 0)) {
    return fail(LIMIT_BLOCK_MESSAGE, 400);
  } else if (body.leaveType === "on_demand" && body.submit && daysCharged > summary.onDemand.remaining) {
    return fail(ON_DEMAND_LIMIT_BLOCK_MESSAGE, 400);
  }

  const directorRequired = calendarDays > 21;
  let managerAssigneeId: string | null = null;
  let directorAssigneeId: string | null = null;
  let status: LeaveStatus = "roboczy";
  let submittedAt: string | null = existing?.submittedAt ?? null;

  if (body.submit) {
    managerAssigneeId = await assigneeForManager(actor, today);
    if (directorRequired) directorAssigneeId = await assigneeForDirector(actor.id, today);
    if (directorRequired && (await listDirectors()).length === 0) {
      return fail("W firmie nie ma dyrektora, a wniosek przekracza 3 tygodnie.", 400);
    }
    const start = initialStatus({
      managerAssigneeId,
      directorAssigneeId,
      requiresDirector: directorRequired,
    });
    status = start.status;
    if (!start.keepDirector) directorAssigneeId = null;
    if (status === "oczekuje_kadr" && (await countHr()) === 0) {
      return fail("W firmie nie ma kadr, więc wniosku nie ma komu przekazać.", 400);
    }
    submittedAt = new Date().toISOString();
  }

  const fields = {
    leaveType: body.leaveType,
    status,
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    workingDays,
    calendarDays,
    requiresDirector: directorRequired,
    workedDate: body.leaveType === "saturday_comp" ? body.workedDate : null,
    fullDay: span.fullDay,
    timeFrom: span.timeFrom,
    timeTo: span.timeTo,
    plannedHours: span.plannedHours,
    substituteEmployeeId: body.substituteId,
    managerAssigneeId,
    directorAssigneeId,
    submittedAt,
  };

  const saved = existing
    ? await updateRequest(existing.id, fields)
    : await insertRequest({ ...fields, requestNumber: await nextRequestNumber(), employeeId: actor.id });

  await replaceAllocations(saved.id, body.leaveType === "overdue" ? allocations : []);
  await addEvent({
    requestId: saved.id,
    actorId: actor.id,
    action: body.submit ? "zlozono" : existing ? "zapisano" : "utworzono",
    comment: null,
    fromStatus: existing?.status ?? null,
    toStatus: status,
  });

  if (body.submit) {
    await notifyTransition({
      request: saved,
      owner: actor,
      status,
      managerAssigneeId,
      directorAssigneeId,
    });
  }

  return { ok: true, data: { id: saved.id } };
}

function eventAction(action: DecisionAction): "zaakceptowano" | "odrzucono" | "cofnieto_pracownik" | "cofnieto_przelozony" {
  if (action === "accept") return "zaakceptowano";
  if (action === "reject") return "odrzucono";
  if (action === "return_employee") return "cofnieto_pracownik";
  return "cofnieto_przelozony";
}

/** Decyzja przełożonego, dyrektora albo kadr. Adresat etapu bierze się z wniosku, nie z body. */
export async function decideLeave(
  actor: Employee,
  requestId: string,
  input: { action: DecisionAction; comment: string; substituteId: string | null },
): Promise<ServiceResult<{ id: string }>> {
  const request = await getRequest(requestId);
  if (!request) return fail("Nie ma takiego wniosku.", 404);

  let role: "manager" | "director" | "hr" | null = null;
  if (request.status === "oczekuje_przelozonego" && request.managerAssigneeId === actor.id) role = "manager";
  else if (request.status === "oczekuje_dyrektora" && request.directorAssigneeId === actor.id) role = "director";
  else if (request.status === "oczekuje_kadr" && actor.isHr) role = "hr";
  if (!role) return fail("Nie możesz podjąć tej decyzji.", 403);

  const owner = await getEmployeeById(request.employeeId);
  if (!owner) return fail("Brak wnioskującego.", 400);

  let substituteId = request.substituteEmployeeId;
  if (role === "manager" && input.action === "accept") {
    const chosen = input.substituteId ?? request.substituteEmployeeId;
    if (!chosen) return fail("Wskaż zastępcę.", 400);
    const substitute = await validateSubstitute(chosen, owner.id, request.dateFrom, request.dateTo);
    if (!substitute.ok) return substitute;
    substituteId = chosen;
  }

  const today = todayInWarsaw();
  const directorAssignee = await assigneeForDirector(owner.id, today);
  const step = decide({
    status: request.status,
    action: input.action,
    actor: role,
    comment: input.comment,
    requiresDirector: request.requiresDirector,
    directorIsAvailable: Boolean(directorAssignee),
  });
  if (!step.ok) return fail(step.error, 400);

  const patch: {
    status: LeaveStatus;
    substituteEmployeeId: string | null;
    managerAssigneeId?: string | null;
    directorAssigneeId?: string | null;
  } = { status: step.status, substituteEmployeeId: substituteId };

  if (step.setDirectorAssignee) patch.directorAssigneeId = directorAssignee;
  if (step.status === "oczekuje_przelozonego") {
    patch.managerAssigneeId = (await assigneeForManager(owner, today)) ?? request.managerAssigneeId;
  }

  let comment = input.comment.trim();
  if (
    role === "manager" &&
    input.action === "accept" &&
    request.requiresDirector &&
    !directorAssignee &&
    comment.length === 0
  ) {
    comment = "Etap dyrektora pominięty, bo nie ma dyrektora innego niż wnioskujący.";
  }

  await updateRequestStatus(request.id, patch);
  await addEvent({
    requestId: request.id,
    actorId: actor.id,
    action: eventAction(input.action),
    comment: comment.length > 0 ? comment : null,
    fromStatus: request.status,
    toStatus: step.status,
  });

  const updated = await getRequest(request.id);
  if (!updated) return fail("Nie udało się odczytać wniosku.", 500);
  await notifyTransition({
    request: updated,
    owner,
    status: step.status,
    managerAssigneeId: updated.managerAssigneeId,
    directorAssigneeId: updated.directorAssigneeId,
  });

  return { ok: true, data: { id: request.id } };
}

export async function withdrawLeave(actor: Employee, requestId: string): Promise<ServiceResult<{ id: string }>> {
  const request = await getRequest(requestId);
  if (!request || request.employeeId !== actor.id) return fail("Nie ma takiego wniosku.", 404);
  if (!canWithdraw(request.status)) return fail("Wniosek można wycofać tylko przed ostatecznym zatwierdzeniem.", 400);

  await updateRequestStatus(request.id, { status: "wycofany" });
  await addEvent({
    requestId: request.id,
    actorId: actor.id,
    action: "wycofano",
    comment: null,
    fromStatus: request.status,
    toStatus: "wycofany",
  });
  await notifyTransition({
    request,
    owner: actor,
    status: "wycofany",
    managerAssigneeId: request.managerAssigneeId,
    directorAssigneeId: request.directorAssigneeId,
  });
  if (request.managerAssigneeId && request.status === "oczekuje_przelozonego") {
    await addNotifications([
      {
        recipientId: request.managerAssigneeId,
        requestId: request.id,
        body: `${fullName(actor)} wycofał wniosek ${request.requestNumber}.`,
      },
    ]);
  }
  if (request.directorAssigneeId && request.status === "oczekuje_dyrektora") {
    await addNotifications([
      {
        recipientId: request.directorAssigneeId,
        requestId: request.id,
        body: `${fullName(actor)} wycofał wniosek ${request.requestNumber}.`,
      },
    ]);
  }
  return { ok: true, data: { id: request.id } };
}

export function canViewRequest(actor: Employee, request: LeaveRequest, owner: Employee): boolean {
  if (actor.id === owner.id) return true;
  if (actor.isHr) return true;
  if (actor.id === request.managerAssigneeId || actor.id === owner.managerId) return true;
  if (actor.id === request.directorAssigneeId) return true;
  if (actor.isDirector && request.requiresDirector) return true;
  return false;
}
