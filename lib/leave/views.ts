import "server-only";
import {
  getEmployeeById,
  getRequest,
  listAllocations,
  listAllBalances,
  listBalances,
  listEmployees,
  listEvents,
  listHoldingsForEmployees,
  listHolidayDates,
  listNotifications,
  listQueue,
  listRequestsByEmployee,
  listRequestsInRange,
  listSubstitutions,
  listSubordinates,
  markRequestNotificationsRead,
} from "@/lib/db";
import { monthBounds, rangesOverlap, shiftIsoDate, todayInWarsaw } from "@/lib/leave/dates";
import { fullName } from "@/lib/leave/labels";
import { summarizeBalances, teamAbsenceWarning, type BalanceSummary, type HoldingRow } from "@/lib/leave/limits";
import type { Employee, LeaveEvent, LeaveRequest, NotificationItem } from "@/lib/types";
import { canViewRequest } from "@/lib/leave/service";

export type RequestListItem = LeaveRequest & { ownerName: string; isNew: boolean };

function withOwner(requests: LeaveRequest[], people: Map<string, Employee>, today: string): RequestListItem[] {
  return requests.map((request) => {
    const owner = people.get(request.employeeId);
    const submitted = request.submittedAt?.slice(0, 10) ?? request.createdAt.slice(0, 10);
    const freshUntil = shiftIsoDate(submitted, 3);
    return {
      ...request,
      ownerName: owner ? fullName(owner) : "Nieznany pracownik",
      isNew: freshUntil !== null && freshUntil >= today,
    };
  });
}

function peopleMap(employees: Employee[]): Map<string, Employee> {
  return new Map(employees.map((person) => [person.id, person]));
}

export function tasksFor(me: Employee, queue: LeaveRequest[]): LeaveRequest[] {
  return queue.filter((request) => {
    if (request.status === "oczekuje_przelozonego") return request.managerAssigneeId === me.id;
    if (request.status === "oczekuje_dyrektora") return request.directorAssigneeId === me.id;
    if (request.status === "oczekuje_kadr") return me.isHr;
    return false;
  });
}

export async function loadDashboard(me: Employee): Promise<{
  summary: BalanceSummary;
  tasks: RequestListItem[];
  notifications: NotificationItem[];
  absentToday: string[];
  upcoming: RequestListItem[];
  substitutions: { label: string }[];
  conflicts: string[];
  myLatest: RequestListItem[];
  showTeam: boolean;
}> {
  const today = todayInWarsaw();
  const year = Number(today.slice(0, 4));
  const until = shiftIsoDate(today, 30) ?? today;
  const [balances, holdings, employees, queue, notifications, substitutions, inRange] = await Promise.all([
    listBalances(me.id),
    listHoldingsForEmployees([me.id]),
    listEmployees(),
    listQueue(),
    listNotifications(me.id),
    listSubstitutions(),
    listRequestsInRange(today, until),
  ]);
  const people = peopleMap(employees);
  const summary = summarizeBalances(balances, holdings, today, year);
  const tasks = withOwner(tasksFor(me, queue), people, today);
  const team = me.isHr ? employees.filter((person) => person.active) : await listSubordinates(me.id);
  const teamIds = new Set(team.map((person) => person.id));
  const relevant = inRange.filter((request) => teamIds.has(request.employeeId) || request.employeeId === me.id);
  const absentToday = relevant
    .filter(
      (request) =>
        request.status === "zaakceptowany" && request.dateFrom <= today && request.dateTo >= today,
    )
    .map((request) => people.get(request.employeeId))
    .filter((person): person is Employee => Boolean(person))
    .map(fullName);

  const upcoming = withOwner(
    relevant.filter((request) => request.status === "zaakceptowany"),
    people,
    today,
  );

  const conflicts = conflictLines(relevant.filter((request) => request.status === "zaakceptowany"), people, today, until);
  const myLatest = withOwner(await listRequestsByEmployee(me.id), people, today).slice(0, 5);
  const visibleSubs = substitutions
    .filter(
      (item) =>
        item.dateTo >= today &&
        (item.approverEmployeeId === me.id ||
          item.substituteEmployeeId === me.id ||
          me.isHr ||
          teamIds.has(item.approverEmployeeId)),
    )
    .map((item) => {
      const approver = people.get(item.approverEmployeeId);
      const substitute = people.get(item.substituteEmployeeId);
      const left = approver ? fullName(approver) : "Osoba";
      const right = substitute ? fullName(substitute) : "zastępca";
      return { label: `${left} → ${right} (${item.dateFrom} – ${item.dateTo})` };
    });

  return {
    summary,
    tasks,
    notifications,
    absentToday,
    upcoming,
    substitutions: visibleSubs,
    conflicts,
    myLatest,
    showTeam: me.isHr || team.length > 0,
  };
}

function conflictLines(
  requests: LeaveRequest[],
  people: Map<string, Employee>,
  from: string,
  to: string,
): string[] {
  const lines: string[] = [];
  const cursorStart = from;
  let cursor = cursorStart;
  let runFrom: string | null = null;
  let runCount = 0;
  const flush = (runTo: string) => {
    if (runFrom && runCount >= 2) lines.push(`${runFrom} – ${runTo}: ${runCount} osoby`);
  };
  while (cursor <= to) {
    const ids = new Set(
      requests
        .filter((request) => request.dateFrom <= cursor && request.dateTo >= cursor)
        .map((request) => request.employeeId),
    );
    if (ids.size >= 2) {
      if (!runFrom) {
        runFrom = cursor;
        runCount = ids.size;
      } else {
        runCount = Math.max(runCount, ids.size);
      }
    } else if (runFrom) {
      const previous = shiftIsoDate(cursor, -1);
      if (previous) flush(previous);
      runFrom = null;
      runCount = 0;
    }
    const next = shiftIsoDate(cursor, 1);
    if (!next) break;
    cursor = next;
  }
  if (runFrom) flush(to);
  return lines.map((line) => {
    const [range] = line.split(":");
    return line.replace(range, range);
  }).map((line) => {
    const match = line.match(/^(\d{4}-\d{2}-\d{2}) – (\d{4}-\d{2}-\d{2}): (\d+)/);
    if (!match) return line;
    const names = requests
      .filter((request) => rangesOverlap(request.dateFrom, request.dateTo, match[1], match[2]))
      .map((request) => people.get(request.employeeId))
      .filter((person): person is Employee => Boolean(person))
      .map(fullName);
    const unique = [...new Set(names)];
    return `${match[1]} – ${match[2]}: ${unique.join(", ")}`;
  });
}

export async function loadFormContext(me: Employee, exceptRequestId?: string): Promise<{
  summary: BalanceSummary;
  holidays: string[];
  colleagues: Employee[];
  holdings: HoldingRow[];
}> {
  const today = todayInWarsaw();
  const year = Number(today.slice(0, 4));
  const [balances, holidays, colleagues, holdings] = await Promise.all([
    listBalances(me.id),
    listHolidayDates(),
    listEmployees(),
    listHoldingsForEmployees([me.id]),
  ]);
  return {
    summary: summarizeBalances(
      balances,
      holdings.filter((row) => row.id !== exceptRequestId),
      today,
      year,
    ),
    holidays,
    colleagues: colleagues.filter((person) => person.id !== me.id && person.active),
    holdings,
  };
}

export async function loadRequestPage(me: Employee, id: string): Promise<{
  request: LeaveRequest;
  owner: Employee;
  substituteName: string | null;
  events: LeaveEvent[];
  allocations: { year: number; days: number }[];
  summary: BalanceSummary;
  holidays: string[];
  colleagues: Employee[];
  collision: string | null;
  actorNames: Map<string, string>;
} | null> {
  const request = await getRequest(id);
  if (!request) return null;
  const owner = await getEmployeeById(request.employeeId);
  if (!owner || !canViewRequest(me, request, owner)) return null;
  await markRequestNotificationsRead(me.id, id);

  const [events, allocations, employees, holidays, balances, holdings] = await Promise.all([
    listEvents(id),
    listAllocations(id),
    listEmployees(),
    listHolidayDates(),
    listBalances(owner.id),
    listHoldingsForEmployees([owner.id]),
  ]);
  const people = peopleMap(employees);
  const substitute = request.substituteEmployeeId ? people.get(request.substituteEmployeeId) : undefined;
  const today = todayInWarsaw();
  const summary = summarizeBalances(
    balances,
    holdings.filter((row) => row.id !== request.id),
    today,
    Number(request.dateFrom.slice(0, 4)),
  );

  let collision: string | null = null;
  const showCollision = me.id === request.managerAssigneeId || me.id === owner.managerId;
  if (showCollision && owner.managerId && request.status === "oczekuje_przelozonego") {
    const team = employees.filter((person) => person.managerId === owner.managerId && person.active);
    const teamHoldings = await listHoldingsForEmployees(team.map((person) => person.id));
    const absent = new Set(
      teamHoldings
        .filter((row) => rangesOverlap(request.dateFrom, request.dateTo, row.dateFrom, row.dateTo))
        .map((row) => row.employeeId),
    );
    absent.add(owner.id);
    collision = teamAbsenceWarning({
      teamSize: team.length,
      absentCount: absent.size,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
    });
  }

  const actorNames = new Map<string, string>();
  for (const event of events) {
    if (!event.actorId) continue;
    const person = people.get(event.actorId);
    if (person) actorNames.set(event.actorId, fullName(person));
  }

  return {
    request,
    owner,
    substituteName: substitute ? fullName(substitute) : null,
    events,
    allocations,
    summary,
    holidays,
    colleagues: employees.filter((person) => person.id !== owner.id && person.active),
    collision,
    actorNames,
  };
}

export async function loadCalendar(me: Employee, month: string): Promise<{
  label: string;
  from: string;
  to: string;
  month: string;
  items: RequestListItem[];
} | null> {
  const bounds = monthBounds(month);
  if (!bounds) return null;
  const [requests, employees, subordinates] = await Promise.all([
    listRequestsInRange(bounds.from, bounds.to),
    listEmployees(),
    listSubordinates(me.id),
  ]);
  const allowed = new Set<string>([me.id]);
  if (me.isHr) {
    for (const person of employees) allowed.add(person.id);
  } else {
    for (const person of subordinates) allowed.add(person.id);
  }
  const people = peopleMap(employees);
  const items = withOwner(
    requests.filter((request) => allowed.has(request.employeeId)),
    people,
    todayInWarsaw(),
  );
  return { ...bounds, month, items };
}

export async function loadMyRequests(me: Employee): Promise<RequestListItem[]> {
  const [requests, employees] = await Promise.all([listRequestsByEmployee(me.id), listEmployees()]);
  return withOwner(requests, peopleMap(employees), todayInWarsaw());
}

export async function loadTasks(me: Employee): Promise<RequestListItem[]> {
  const [queue, employees] = await Promise.all([listQueue(), listEmployees()]);
  return withOwner(tasksFor(me, queue), peopleMap(employees), todayInWarsaw());
}

export async function loadStaff(): Promise<{ person: Employee; summary: BalanceSummary }[]> {
  const today = todayInWarsaw();
  const year = Number(today.slice(0, 4));
  const employees = await listEmployees();
  const [balances, holdings] = await Promise.all([
    listAllBalances(),
    listHoldingsForEmployees(employees.map((person) => person.id)),
  ]);
  return employees
    .filter((person) => person.active)
    .map((person) => ({
      person,
      summary: summarizeBalances(
        balances.filter((row) => row.employeeId === person.id),
        holdings.filter((row) => row.employeeId === person.id),
        today,
        year,
      ),
    }));
}
