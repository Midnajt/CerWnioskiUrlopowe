import { AppShell } from "@/components/AppShell";
import { requireEmployee } from "@/lib/auth/session";
import { listSubordinates } from "@/lib/db";
import { loadTasks } from "@/lib/leave/views";

export const dynamic = "force-dynamic";

type Props = { children: React.ReactNode };

export default async function AppLayout({ children }: Props) {
  const me = await requireEmployee();
  const [tasks, subordinates] = await Promise.all([loadTasks(me), listSubordinates(me.id)]);
  return (
    <AppShell me={me} taskCount={tasks.length} showTeam={me.isHr || subordinates.length > 0}>
      {children}
    </AppShell>
  );
}
