import { LeaveForm } from "@/components/LeaveForm";
import { CardHeading } from "@/components/glyphs";
import { Card, Muted } from "@/components/ui";
import { requireEmployee } from "@/lib/auth/session";
import { loadFormContext } from "@/lib/leave/views";

export default async function NewLeavePage() {
  const me = await requireEmployee();
  const context = await loadFormContext(me);
  return (
    <Card>
      <Muted>Nazwa procesu: Wniosek urlopowy</Muted>
      <CardHeading name="form">Zadanie: Wnioskowanie o urlop</CardHeading>
      <LeaveForm
        holidays={context.holidays}
        summary={context.summary}
        colleagues={context.colleagues}
        initial={{ leaveType: "current", dateFrom: "", dateTo: "", substituteId: "" }}
      />
    </Card>
  );
}
