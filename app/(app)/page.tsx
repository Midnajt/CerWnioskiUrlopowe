import { CardHeading } from "@/components/glyphs";
import { Card, Muted, Notice } from "@/components/ui";
import { RequestTable } from "@/components/RequestTable";
import { requireEmployee } from "@/lib/auth/session";
import { loadDashboard } from "@/lib/leave/views";

export default async function DashboardPage() {
  const me = await requireEmployee();
  const data = await loadDashboard(me);
  const current = data.summary.current;
  return (
    <>
      <Card>
        <CardHeading name="limits">Moje limity</CardHeading>
        {current ? (
          <p>
            Urlop bieżący {current.year}: wymiar {current.entitled}, wykorzystano {current.used}, zaplanowano{" "}
            {current.planned}, pozostało {current.remaining}.
          </p>
        ) : (
          <Muted>Brak puli bieżącej na ten rok.</Muted>
        )}
        {data.summary.overdueYears.length === 0 ? (
          <Muted>Brak urlopu zaległego.</Muted>
        ) : (
          <ul>
            {data.summary.overdueYears.map((year) => (
              <li key={year.year}>
                Zaległy {year.year}: pozostało {year.remaining} dni (wymiar {year.entitled}, wykorzystano {year.used},
                zaplanowano {year.planned}).
              </li>
            ))}
          </ul>
        )}
      </Card>
      {data.showTeam ? (
        <Card>
          <CardHeading name="today">Dzisiaj</CardHeading>
          {data.absentToday.length === 0 ? (
            <Muted>Nikt z widocznego zakresu nie ma dziś zaakceptowanej nieobecności.</Muted>
          ) : (
            <ul>
              {data.absentToday.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
          <CardHeading name="upcoming">Najbliższe 30 dni</CardHeading>
          {data.upcoming.length === 0 ? <Muted>Brak zaakceptowanych nieobecności.</Muted> : <RequestTable items={data.upcoming} />}
          <CardHeading name="conflict">Konflikty</CardHeading>
          {data.conflicts.length === 0 ? (
            <Muted>Brak nakładających się nieobecności.</Muted>
          ) : (
            data.conflicts.map((line) => <Notice key={line}>{line}</Notice>)
          )}
          <CardHeading name="swap">Zastępstwa</CardHeading>
          {data.substitutions.length === 0 ? (
            <Muted>Brak aktywnych zastępstw akceptujących.</Muted>
          ) : (
            <ul>
              {data.substitutions.map((item) => (
                <li key={item.label}>{item.label}</li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
      <Card>
        <CardHeading name="tasks">Moje zadania do wykonania ({data.tasks.length})</CardHeading>
        <RequestTable items={data.tasks} />
      </Card>
      <Card>
        <CardHeading name="bell">Ostatnie komunikaty</CardHeading>
        {data.notifications.length === 0 ? (
          <Muted>Brak komunikatów.</Muted>
        ) : (
          <ul>
            {data.notifications.map((item) => (
              <li key={item.id}>{item.body}</li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
