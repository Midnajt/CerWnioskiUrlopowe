import { CardHeading } from "@/components/glyphs";
import { Card, Muted, Table, TableWrap } from "@/components/ui";
import { requireEmployee } from "@/lib/auth/session";
import { formatAmount, fullName } from "@/lib/leave/labels";
import { loadStaff } from "@/lib/leave/views";

export default async function StaffPage() {
  const me = await requireEmployee();
  if (!me.isHr) {
    return (
      <Card>
        <CardHeading name="people">Urlopy pracowników</CardHeading>
        <Muted>Ta lista jest dostępna dla kadr.</Muted>
      </Card>
    );
  }
  const rows = await loadStaff();
  return (
    <Card>
      <CardHeading name="people">Urlopy pracowników</CardHeading>
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>Pracownik</th>
              <th>Dział</th>
              <th>Bieżący pozostało</th>
              <th>Na żądanie pozostało</th>
              <th>Zaległy pozostało</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ person, summary }) => (
              <tr key={person.id}>
                <td>{fullName(person)}</td>
                <td>{person.departmentName}</td>
                <td>{summary.current ? formatAmount(summary.current.remaining) : "—"}</td>
                <td>{formatAmount(summary.onDemand.remaining)}</td>
                <td>{formatAmount(summary.overdueRemaining)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </Card>
  );
}
