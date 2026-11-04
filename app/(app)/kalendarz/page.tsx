import { CardHeading, Glyph } from "@/components/glyphs";
import { Card, DayCell, MonthGrid, MonthNav, TextLink } from "@/components/ui";
import { RequestTable } from "@/components/RequestTable";
import { requireEmployee } from "@/lib/auth/session";
import { addUtcDays, formatIsoDate, nextMonth, parseIsoDate, previousMonth, todayInWarsaw } from "@/lib/leave/dates";
import { loadCalendar } from "@/lib/leave/views";

type Props = { searchParams: Promise<{ month?: string }> };

function monthCells(from: string, to: string): (string | null)[] {
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (!start || !end) return [];
  const lead = (start.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let cursor = start; cursor <= end; cursor = addUtcDays(cursor, 1)) {
    cells.push(formatIsoDate(cursor));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default async function CalendarPage({ searchParams }: Props) {
  const me = await requireEmployee();
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : todayInWarsaw().slice(0, 7);
  const data = await loadCalendar(me, month);
  if (!data) {
    return (
      <Card>
        <CardHeading name="calendar">Kalendarz</CardHeading>
        <p>Nieprawidłowy miesiąc.</p>
      </Card>
    );
  }
  const cells = monthCells(data.from, data.to);
  const prev = previousMonth(month);
  const next = nextMonth(month);
  return (
    <Card>
      <CardHeading name="calendar">Kalendarz — {data.label}</CardHeading>
      <MonthNav>
        {prev ? (
          <TextLink href={`/kalendarz?month=${prev}`}>
            <Glyph name="prev" /> Poprzedni
          </TextLink>
        ) : null}
        {next ? (
          <TextLink href={`/kalendarz?month=${next}`}>
            Następny <Glyph name="next" />
          </TextLink>
        ) : null}
      </MonthNav>
      <MonthGrid>
        {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => (
          <strong key={day}>{day}</strong>
        ))}
        {cells.map((day, index) => {
          const count = day ? data.items.filter((item) => item.dateFrom <= day && item.dateTo >= day).length : 0;
          return (
            <DayCell key={`${day ?? "empty"}-${index}`}>
              {day ? day.slice(8) : ""}
              {count > 0 ? ` · ${count}` : ""}
            </DayCell>
          );
        })}
      </MonthGrid>
      <RequestTable items={data.items} />
    </Card>
  );
}
