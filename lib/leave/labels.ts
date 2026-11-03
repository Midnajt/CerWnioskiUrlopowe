import type { LeaveStatus, LeaveType } from "@/lib/leave/workflow";

export const STATUS_LABEL: Record<LeaveStatus, string> = {
  roboczy: "Roboczy",
  oczekuje_przelozonego: "Oczekuje na akceptację przełożonego",
  oczekuje_dyrektora: "Oczekuje na akceptację dyrektora",
  oczekuje_kadr: "Oczekuje na kadry",
  zaakceptowany: "Zaakceptowany",
  odrzucony: "Odrzucony",
  cofniety_pracownik: "Cofnięty do pracownika",
  wycofany: "Wycofany",
};

export const TYPE_LABEL: Record<LeaveType, string> = {
  current: "Urlop wypoczynkowy — bieżący",
  overdue: "Urlop wypoczynkowy — zaległy",
};

export const ACTION_LABEL = {
  utworzono: "Utworzono wniosek",
  zapisano: "Zapisano formularz",
  zlozono: "Przekazano do akceptacji",
  zaakceptowano: "Zaakceptowano",
  odrzucono: "Odrzucono",
  cofnieto_pracownik: "Cofnięto do pracownika",
  cofnieto_przelozony: "Cofnięto do przełożonego",
  wycofano: "Wycofano wniosek",
} as const;

export type EventAction = keyof typeof ACTION_LABEL;

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`;
}

export function initials(person: { firstName: string; lastName: string }): string {
  const first = person.firstName.trim().charAt(0);
  const last = person.lastName.trim().charAt(0);
  return `${first}${last}`.toLocaleUpperCase("pl-PL");
}
