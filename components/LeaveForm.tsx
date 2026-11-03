"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Glyph } from "@/components/glyphs";
import { Button, FormRow, Input, Notice, Readonly, RowActions, Select } from "@/components/ui";
import { calendarDaysInclusive, countWorkingDays, formatPlDate } from "@/lib/leave/dates";
import { fullName, TYPE_LABEL } from "@/lib/leave/labels";
import { LIMIT_BLOCK_MESSAGE, type BalanceSummary } from "@/lib/leave/limits";
import { requiresDirector } from "@/lib/leave/dates";
import type { LeaveType } from "@/lib/leave/workflow";
import type { Employee } from "@/lib/types";

type Props = {
  requestId?: string;
  holidays: string[];
  summary: BalanceSummary;
  colleagues: Employee[];
  initial: {
    leaveType: LeaveType;
    dateFrom: string;
    dateTo: string;
    substituteId: string;
  };
};

export function LeaveForm({ requestId, holidays, summary, colleagues, initial }: Props) {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType>(initial.leaveType);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [substituteId, setSubstituteId] = useState(initial.substituteId);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const calendarDays = calendarDaysInclusive(dateFrom, dateTo);
  const workingDays = calendarDays === null ? null : countWorkingDays(dateFrom, dateTo, holidays);
  const director = calendarDays !== null && requiresDirector(calendarDays);
  const remaining = leaveType === "current" ? (summary.current?.remaining ?? 0) : summary.overdueRemaining;
  const overLimit = workingDays !== null && workingDays > remaining;

  async function handleSave(submit: boolean) {
    setPending(true);
    setError(null);
    const response = await fetch(requestId ? `/api/leave-requests/${requestId}` : "/api/leave-requests", {
      method: requestId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leaveType,
        dateFrom,
        dateTo,
        substituteId: substituteId || null,
        submit,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string; id?: string } | null;
    if (!response.ok || !payload?.id) {
      setError(payload?.error ?? "Nie udało się zapisać wniosku.");
      setPending(false);
      return;
    }
    router.push(`/wnioski/${payload.id}`);
    router.refresh();
  }

  return (
    <div>
      {error ? <Notice $tone="danger">{error}</Notice> : null}
      {overLimit ? <Notice $tone="danger">{LIMIT_BLOCK_MESSAGE}</Notice> : null}
      {director ? (
        <Notice>Ten wniosek przekracza 3 tygodnie. Po akceptacji przełożonego trafi do dyrektora.</Notice>
      ) : null}
      <FormRow>
        Rodzaj urlopu *
        <Select value={leaveType} onChange={(event) => setLeaveType(event.target.value as LeaveType)}>
          <option value="current">{TYPE_LABEL.current}</option>
          <option value="overdue">{TYPE_LABEL.overdue}</option>
        </Select>
      </FormRow>
      <FormRow>
        Dostępny limit
        <Readonly>
          {leaveType === "current"
            ? summary.current
              ? `${summary.current.remaining} dni z ${summary.current.entitled} (wykorzystano ${summary.current.used}, zaplanowano ${summary.current.planned})`
              : "Brak puli bieżącej na ten rok."
            : summary.overdueYears.length === 0
              ? "Brak urlopu zaległego."
              : summary.overdueYears
                  .map((year) => `${year.year}: ${year.remaining} dni`)
                  .join(", ") + ` — razem ${summary.overdueRemaining} dni. System zużyje najstarszy rok.`}
        </Readonly>
      </FormRow>
      <FormRow>
        Planowany urlop od *
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} required />
      </FormRow>
      <FormRow>
        Planowany urlop do *
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} required />
      </FormRow>
      <FormRow>
        Liczba dni urlopu
        <Readonly>
          {workingDays === null || calendarDays === null
            ? "Wybierz termin"
            : `${formatPlDate(dateFrom)} – ${formatPlDate(dateTo)}: ${workingDays} dni roboczych (${calendarDays} kalendarzowych)`}
        </Readonly>
      </FormRow>
      <FormRow>
        Zastępca *
        <Select value={substituteId} onChange={(event) => setSubstituteId(event.target.value)} required>
          <option value="">Wybierz osobę</option>
          {colleagues.map((person) => (
            <option key={person.id} value={person.id}>
              {fullName(person)} — {person.jobTitle}
            </option>
          ))}
        </Select>
      </FormRow>
      <RowActions>
        <Button type="button" $tone="ok" disabled={pending || overLimit || !workingDays} onClick={() => handleSave(true)}>
          <Glyph name="send" />
          Przekaż do akceptacji
        </Button>
        <Button type="button" disabled={pending} onClick={() => handleSave(false)}>
          <Glyph name="save" />
          Zapisz formularz
        </Button>
        <Button type="button" $tone="danger" onClick={() => router.push("/wnioski")}>
          <Glyph name="close" />
          Anuluj
        </Button>
      </RowActions>
    </div>
  );
}
