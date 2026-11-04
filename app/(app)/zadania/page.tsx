import { CardHeading, Glyph } from "@/components/glyphs";
import { Card, Muted, TextLink } from "@/components/ui";
import { RequestTable } from "@/components/RequestTable";
import { requireEmployee } from "@/lib/auth/session";
import { loadTasks } from "@/lib/leave/views";

type Props = { searchParams: Promise<{ page?: string }> };

const PAGE_SIZE = 8;

export default async function TasksPage({ searchParams }: Props) {
  const me = await requireEmployee();
  const params = await searchParams;
  const tasks = await loadTasks(me);
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const start = (page - 1) * PAGE_SIZE;
  const slice = tasks.slice(start, start + PAGE_SIZE);
  const from = tasks.length === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, tasks.length);
  return (
    <Card>
      <CardHeading name="tasks">Moje zadania do wykonania we wnioskach urlopowych ({tasks.length})</CardHeading>
      {tasks.length === 0 ? (
        <Muted>Nie masz wniosków do decyzji.</Muted>
      ) : (
        <>
          <RequestTable items={slice} />
          <p>
            Wyświetlono {from}–{to} z {tasks.length}
            {page > 1 ? (
              <>
                {" "}
                · <TextLink href={`/zadania?page=${page - 1}`}><Glyph name="prev" /> Poprzednia</TextLink>
              </>
            ) : null}
            {to < tasks.length ? (
              <>
                {" "}
                · <TextLink href={`/zadania?page=${page + 1}`}>Następna <Glyph name="next" /></TextLink>
              </>
            ) : null}
          </p>
        </>
      )}
    </Card>
  );
}
