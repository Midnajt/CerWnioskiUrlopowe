export type LeavePool = "current" | "overdue";

export type LeaveType = LeavePool | "on_demand" | "saturday_comp";

export type LeaveStatus =
  | "roboczy"
  | "oczekuje_przelozonego"
  | "oczekuje_dyrektora"
  | "oczekuje_kadr"
  | "zaakceptowany"
  | "odrzucony"
  | "cofniety_pracownik"
  | "wycofany";

export type DecisionAction = "accept" | "reject" | "return_employee" | "return_manager";

export type ActorRole = "manager" | "director" | "hr";

/** Statusy, które trzymają limit i blokują zastępcę. */
export const HOLDING_STATUSES: LeaveStatus[] = [
  "oczekuje_przelozonego",
  "oczekuje_dyrektora",
  "oczekuje_kadr",
  "zaakceptowany",
];

export function isLeaveType(value: string): value is LeaveType {
  return value === "current" || value === "overdue" || value === "on_demand" || value === "saturday_comp";
}

export function isHoldingStatus(status: string): boolean {
  return HOLDING_STATUSES.includes(status as LeaveStatus);
}

type StepResult =
  | {
      ok: true;
      status: LeaveStatus;
      setDirectorAssignee: boolean;
    }
  | { ok: false; error: string };

function needsComment(action: DecisionAction, comment: string): string | null {
  if (action === "accept") return null;
  if (comment.trim().length === 0) return "Komentarz jest wymagany.";
  return null;
}

/**
 * Przejście statusu bez bazy. Dyrektor wchodzi tylko przy requiresDirector
 * i tylko gdy jest osoba inna niż wnioskujący.
 */
export function decide(input: {
  status: LeaveStatus;
  action: DecisionAction;
  actor: ActorRole;
  comment: string;
  requiresDirector: boolean;
  directorIsAvailable: boolean;
}): StepResult {
  const commentError = needsComment(input.action, input.comment);
  if (commentError) return { ok: false, error: commentError };

  if (input.actor === "manager" && input.status === "oczekuje_przelozonego") {
    if (input.action === "accept") {
      if (input.requiresDirector && input.directorIsAvailable) {
        return { ok: true, status: "oczekuje_dyrektora", setDirectorAssignee: true };
      }
      return { ok: true, status: "oczekuje_kadr", setDirectorAssignee: false };
    }
    if (input.action === "reject") {
      return { ok: true, status: "odrzucony", setDirectorAssignee: false };
    }
    if (input.action === "return_employee") {
      return { ok: true, status: "cofniety_pracownik", setDirectorAssignee: false };
    }
    return { ok: false, error: "Przełożony nie cofa wniosku do siebie." };
  }

  if (input.actor === "director" && input.status === "oczekuje_dyrektora") {
    if (input.action === "accept") {
      return { ok: true, status: "oczekuje_kadr", setDirectorAssignee: false };
    }
    if (input.action === "reject") {
      return { ok: true, status: "odrzucony", setDirectorAssignee: false };
    }
    if (input.action === "return_manager") {
      return { ok: true, status: "oczekuje_przelozonego", setDirectorAssignee: false };
    }
    return { ok: false, error: "Dyrektor cofa wniosek do przełożonego." };
  }

  if (input.actor === "hr" && input.status === "oczekuje_kadr") {
    if (input.action === "accept") {
      return { ok: true, status: "zaakceptowany", setDirectorAssignee: false };
    }
    if (input.action === "reject") {
      return { ok: true, status: "odrzucony", setDirectorAssignee: false };
    }
    if (input.action === "return_employee") {
      return { ok: true, status: "cofniety_pracownik", setDirectorAssignee: false };
    }
    if (input.action === "return_manager") {
      return { ok: true, status: "oczekuje_przelozonego", setDirectorAssignee: false };
    }
  }

  return { ok: false, error: "Ta decyzja nie jest dostępna na obecnym etapie." };
}

/** Etap startowy. Puste id oznacza, że etap pomijamy, bo nie ma osoby albo jest nią wnioskujący. */
export function initialStatus(input: {
  managerAssigneeId: string | null;
  directorAssigneeId: string | null;
  requiresDirector: boolean;
}): { status: LeaveStatus; keepDirector: boolean } {
  if (input.managerAssigneeId) {
    return { status: "oczekuje_przelozonego", keepDirector: false };
  }
  if (input.requiresDirector && input.directorAssigneeId) {
    return { status: "oczekuje_dyrektora", keepDirector: true };
  }
  return { status: "oczekuje_kadr", keepDirector: false };
}

export function canWithdraw(status: LeaveStatus): boolean {
  return (
    status === "oczekuje_przelozonego" ||
    status === "oczekuje_dyrektora" ||
    status === "oczekuje_kadr"
  );
}

export function canEdit(status: LeaveStatus): boolean {
  return status === "roboczy" || status === "cofniety_pracownik";
}

export type Substitution = {
  approverEmployeeId: string;
  substituteEmployeeId: string;
  dateFrom: string;
  dateTo: string;
};

/** Jedno przejście: aktywne zastępstwo akceptującego na dziś. Bez pętli. */
export function resolveAssignee(
  approverId: string | null,
  today: string,
  substitutions: Substitution[],
): string | null {
  if (!approverId) return null;
  const active = substitutions.find(
    (item) =>
      item.approverEmployeeId === approverId &&
      item.dateFrom <= today &&
      item.dateTo >= today,
  );
  return active ? active.substituteEmployeeId : approverId;
}
