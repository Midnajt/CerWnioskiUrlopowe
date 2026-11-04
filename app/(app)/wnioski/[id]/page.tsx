import { notFound } from "next/navigation";
import { DecisionPanel } from "@/components/DecisionPanel";
import { LeaveForm } from "@/components/LeaveForm";
import { WithdrawButton } from "@/components/WithdrawButton";
import { CardHeading } from "@/components/glyphs";
import { Card, Muted, Notice, Readonly, FormRow } from "@/components/ui";
import { requireEmployee } from "@/lib/auth/session";
import { formatPlDate, todayInWarsaw } from "@/lib/leave/dates";
import { ACTION_LABEL, STATUS_LABEL, TYPE_LABEL, formatAmount, fullName, type EventAction } from "@/lib/leave/labels";
import { loadRequestPage } from "@/lib/leave/views";
import { canEdit, canWithdraw } from "@/lib/leave/workflow";

type Props = { params: Promise<{ id: string }> };

function eventLabel(action: string): string {
  if (action in ACTION_LABEL) return ACTION_LABEL[action as EventAction];
  return action;
}

export default async function LeaveRequestPage({ params }: Props) {
  const { id } = await params;
  const me = await requireEmployee();
  const page = await loadRequestPage(me, id);
  if (!page) notFound();
  const { request, owner } = page;
  const editable = me.id === owner.id && canEdit(request.status);
  const actor =
    request.status === "oczekuje_przelozonego" && request.managerAssigneeId === me.id
      ? "manager"
      : request.status === "oczekuje_dyrektora" && request.directorAssigneeId === me.id
        ? "director"
        : request.status === "oczekuje_kadr" && me.isHr
          ? "hr"
          : null;

  return (
    <Card>
      <CardHeading name="form">
        Zadanie: {actor ? "Akceptacja wniosku" : "Wniosek urlopowy"} {request.requestNumber}
      </CardHeading>
      <FormRow>
        Wnioskujący
        <Readonly>
          {fullName(owner)}, {owner.jobTitle}, {owner.departmentName}, {owner.locationName}
        </Readonly>
      </FormRow>
      <FormRow>
        Status
        <Readonly>{STATUS_LABEL[request.status]}</Readonly>
      </FormRow>
      {editable ? (
        <LeaveForm
          requestId={request.id}
          holidays={page.holidays}
          summary={page.summary}
          colleagues={page.colleagues}
          today={todayInWarsaw()}
          initial={{
            leaveType: request.leaveType,
            dateFrom: request.dateFrom,
            dateTo: request.dateTo,
            substituteId: request.substituteEmployeeId ?? "",
            workedDate: request.workedDate ?? "",
          }}
        />
      ) : (
        <>
          <FormRow>
            Rodzaj urlopu
            <Readonly>{TYPE_LABEL[request.leaveType]}</Readonly>
          </FormRow>
          {request.leaveType === "saturday_comp" && request.workedDate ? (
            <FormRow>
              Dzień, w którym wykonywano pracę
              <Readonly>{formatPlDate(request.workedDate)}</Readonly>
            </FormRow>
          ) : null}
          <FormRow>
            Termin
            <Readonly>
              {formatPlDate(request.dateFrom)} – {formatPlDate(request.dateTo)}: {request.workingDays} dni roboczych (
              {request.calendarDays} kalendarzowych)
            </Readonly>
          </FormRow>
          <FormRow>
            Czas
            <Readonly>
              {request.fullDay
                ? `Cały dzień, ${formatAmount(request.plannedHours)} h`
                : `${request.timeFrom ?? ""}–${request.timeTo ?? ""}, ${formatAmount(request.plannedHours)} h`}
            </Readonly>
          </FormRow>
          <FormRow>
            Zastępca
            <Readonly>{page.substituteName ?? "Nie wskazano"}</Readonly>
          </FormRow>
          {request.requiresDirector ? (
            <Notice>Wniosek przekracza 3 tygodnie i wymaga akceptacji dyrektora.</Notice>
          ) : null}
        </>
      )}
      {page.allocations.length > 0 ? (
        <p>
          Zaległy z lat: {page.allocations.map((item) => `${item.year}: ${item.days} dni`).join(", ")}.
        </p>
      ) : null}
      {page.collision ? <Notice>{page.collision}</Notice> : null}
      {actor ? (
        <DecisionPanel
          requestId={request.id}
          actor={actor}
          colleagues={page.colleagues}
          currentSubstituteId={request.substituteEmployeeId}
        />
      ) : null}
      {me.id === owner.id && canWithdraw(request.status) ? <WithdrawButton requestId={request.id} /> : null}
      <CardHeading name="history">Historia</CardHeading>
      {page.events.length === 0 ? (
        <Muted>Brak zdarzeń.</Muted>
      ) : (
        <ol>
          {page.events.map((event) => (
            <li key={event.id}>
              {eventLabel(event.action)}
              {event.actorId ? ` — ${page.actorNames.get(event.actorId) ?? "pracownik"}` : ""}
              {event.comment ? `. ${event.comment}` : ""}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
