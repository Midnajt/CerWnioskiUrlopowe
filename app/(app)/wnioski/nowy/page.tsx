import { LeaveForm } from "@/components/LeaveForm";
import { CardHeading } from "@/components/glyphs";
import { Card } from "@/components/ui";
import { requireEmployee } from "@/lib/auth/session";
import { todayInWarsaw } from "@/lib/leave/dates";
import { loadFormContext } from "@/lib/leave/views";

export default async function NewLeavePage() {
  const me = await requireEmployee();
  const context = await loadFormContext(me);
  return (
    <Card>
      <CardHeading name="form">Zadanie: Wnioskowanie o urlop</CardHeading>
      <LeaveForm
        holidays={context.holidays}
        summary={context.summary}
        colleagues={context.colleagues}
        today={todayInWarsaw()}
        initial={{
          leaveType: "current",
          dateFrom: "",
          dateTo: "",
          substituteId: "",
          workedDate: "",
        }}
      />
    </Card>
  );
}
