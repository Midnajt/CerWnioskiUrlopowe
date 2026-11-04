"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateField } from "@/components/DateField";
import { Glyph } from "@/components/glyphs";
import { Button, FormRow, LabelText, Notice, Readonly, RowActions, Select } from "@/components/ui";
import { calendarDaysInclusive, countWorkingDays, formatPlDate, isNonWorkingDay, requiresDirector } from "@/lib/leave/dates";
import { formatAmount, fullName, TYPE_LABEL } from "@/lib/leave/labels";
import {
  LIMIT_BLOCK_MESSAGE,
  ON_DEMAND_LIMIT_BLOCK_MESSAGE,
  SHORT_NOTICE_WARNING,
  type BalanceSummary,
} from "@/lib/leave/limits";
import type { LeaveType } from "@/lib/leave/workflow";
import type { Employee } from "@/lib/types";

type Props = {
  requestId?: string;
  holidays: string[];
  summary: BalanceSummary;
  colleagues: Employee[];
  today: string;
  initial: {
    leaveType: LeaveType;
    dateFrom: string;
    dateTo: string;
    substituteId: string;
    workedDate: string;
  };
};

export function LeaveForm({ requestId, holidays, summary, colleagues, today, initial }: Props) {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType>(initial.leaveType);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [substituteId, setSubstituteId] = useState(initial.substituteId);
  const [workedDate, setWorkedDate] = useState(initial.workedDate);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const singleDay = leaveType === "saturday_comp";
  const calendarDays = calendarDaysInclusive(dateFrom, dateTo);
  const workingDays = calendarDays === null ? null : countWorkingDays(dateFrom, dateTo, holidays);
  const director = calendarDays !== null && requiresDirector(calendarDays);
  const overLimit =
    leaveType === "saturday_comp"
      ? false
      : leaveType === "on_demand"
        ? workingDays !== null && workingDays > summary.onDemand.remaining
        : leaveType === "overdue"
          ? workingDays !== null && workingDays > summary.overdueRemaining
          : workingDays !== null && workingDays > (summary.current?.remaining ?? 0);
  const shortNotice = leaveType !== "on_demand" && dateFrom.length > 0 && dateFrom <= today;
  const workedOnWorkingDay =
    leaveType === "saturday_comp" && workedDate.length > 0 && !isNonWorkingDay(workedDate, holidays);
  const blockMessage = leaveType === "on_demand" ? ON_DEMAND_LIMIT_BLOCK_MESSAGE : LIMIT_BLOCK_MESSAGE;

  function handleType(value: LeaveType) {
    setLeaveType(value);
    if (value !== "saturday_comp") setWorkedDate("");
    if (value === "saturday_comp") setDateTo(dateFrom);
  }

  function handleStart(value: string) {
    setDateFrom(value);
    if (singleDay) {
      setDateTo(value);
      return;
    }
    // Koniec wcześniejszy niż nowy początek przestaje być terminem.
    if (dateTo && value && dateTo < value) setDateTo("");
  }

  function handleEnd(value: string) {
    if (dateFrom && value && value < dateFrom) return;
    setDateTo(value);
  }

  async function handleSave(submit: boolean) {
    setPending(true);
    setError(null);
    const response = await fetch(requestId ? `/api/leave-requests/${requestId}` : "/api/leave-requests", {
      method: requestId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leaveType,
        dateFrom,
        dateTo: singleDay ? dateFrom : dateTo,
        substituteId: substituteId || null,
        submit,
        // Urlop jest zawsze co najmniej jednodniowy, więc formularz nie zbiera godzin.
        fullDay: true,
        timeFrom: null,
        timeTo: null,
        workedDate: leaveType === "saturday_comp" ? workedDate || null : null,
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
      {overLimit ? <Notice $tone="danger">{blockMessage}</Notice> : null}
      {shortNotice ? <Notice>{SHORT_NOTICE_WARNING}</Notice> : null}
      {workedOnWorkingDay ? (
        <Notice $tone="danger">Dzień pracy musi przypadać w sobotę, niedzielę albo święto.</Notice>
      ) : null}
      {director ? (
        <Notice>Ten wniosek przekracza 3 tygodnie. Po akceptacji przełożonego trafi do dyrektora.</Notice>
      ) : null}
      <FormRow>
        <LabelText required>Rodzaj urlopu</LabelText>
        <Select value={leaveType} onChange={(event) => handleType(event.target.value as LeaveType)}>
          <option value="current">{TYPE_LABEL.current}</option>
          <option value="overdue">{TYPE_LABEL.overdue}</option>
          <option value="on_demand">{TYPE_LABEL.on_demand}</option>
          <option value="saturday_comp">{TYPE_LABEL.saturday_comp}</option>
        </Select>
      </FormRow>
      <FormRow>
        Dostępny limit
        <Readonly>{limitText(leaveType, summary)}</Readonly>
      </FormRow>
      {leaveType === "saturday_comp" ? (
        <FormRow>
          <LabelText required>Dzień, w którym wykonywano pracę</LabelText>
          <DateField value={workedDate} onChange={setWorkedDate} required />
        </FormRow>
      ) : null}
      <FormRow>
        <LabelText required>
          {singleDay ? (leaveType === "saturday_comp" ? "Proponowany dzień wolny" : "Data") : "Planowany urlop od"}
        </LabelText>
        <DateField value={dateFrom} onChange={handleStart} required />
      </FormRow>
      {singleDay ? null : (
        <FormRow>
          <LabelText required>Planowany urlop do</LabelText>
          <DateField value={dateTo} min={dateFrom || undefined} onChange={handleEnd} required />
        </FormRow>
      )}
      <FormRow>
        Liczba dni urlopu
        <Readonly>
          {workingDays === null || calendarDays === null
            ? "Wybierz termin"
            : `${formatPlDate(dateFrom)} – ${formatPlDate(singleDay ? dateFrom : dateTo)}: ${workingDays} dni roboczych (${calendarDays} kalendarzowych)`}
        </Readonly>
      </FormRow>
      <FormRow>
        <LabelText required>Zastępca</LabelText>
        <Select value={substituteId} onChange={(event) => setSubstituteId(event.target.value)} required>
          <option value="">Wybierz osobę</option>
          {colleagues.map((person) => (
            <option key={person.id} value={person.id}>
              {fullName(person)}
            </option>
          ))}
        </Select>
      </FormRow>
      <RowActions>
        <Button
          type="button"
          $tone="ok"
          disabled={
            pending ||
            overLimit ||
            !workingDays ||
            (leaveType === "saturday_comp" && workedDate.length === 0) ||
            workedOnWorkingDay
          }
          onClick={() => handleSave(true)}
        >
          <Glyph name="send" />
          Przekaż do akceptacji
        </Button>
        <Button type="button" $tone="neutral" disabled={pending} onClick={() => handleSave(false)}>
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

function limitText(leaveType: LeaveType, summary: BalanceSummary): string {
  if (leaveType === "on_demand") {
    const currentLeft = summary.current ? formatAmount(summary.current.remaining) : "0";
    return `Pozostało ${formatAmount(summary.onDemand.remaining)} z ${summary.onDemand.entitled} dni na żądanie. Schodzi z urlopu bieżącego, którego zostało ${currentLeft} dni. Można go złożyć w dniu rozpoczęcia.`;
  }
  if (leaveType === "saturday_comp") {
    return "Odbiór dnia wolnego nie pomniejsza puli urlopu wypoczynkowego.";
  }
  if (leaveType === "current") {
    return summary.current
      ? `${formatAmount(summary.current.remaining)} dni z ${formatAmount(summary.current.entitled)} (wykorzystano ${formatAmount(summary.current.used)}, zaplanowano ${formatAmount(summary.current.planned)})`
      : "Brak puli bieżącej na ten rok.";
  }
  if (summary.overdueYears.length === 0) return "Brak urlopu zaległego.";
  const years = summary.overdueYears.map((year) => `${year.year}: ${formatAmount(year.remaining)} dni`).join(", ");
  return `${years} — razem ${formatAmount(summary.overdueRemaining)} dni. System zużyje najstarszy rok.`;
}
