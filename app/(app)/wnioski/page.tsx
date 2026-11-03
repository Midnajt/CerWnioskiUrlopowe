import { CardHeading, Glyph } from "@/components/glyphs";
import { Button, Card, FilterDetails, Select } from "@/components/ui";
import { RequestTable } from "@/components/RequestTable";
import { requireEmployee } from "@/lib/auth/session";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/leave/labels";
import { loadMyRequests } from "@/lib/leave/views";
import type { LeaveStatus, LeaveType } from "@/lib/leave/workflow";

type Props = { searchParams: Promise<{ status?: string; type?: string }> };

export default async function MyRequestsPage({ searchParams }: Props) {
  const me = await requireEmployee();
  const params = await searchParams;
  const items = await loadMyRequests(me);
  const filtered = items.filter((item) => {
    if (params.status && item.status !== params.status) return false;
    if (params.type && item.leaveType !== params.type) return false;
    return true;
  });
  const statuses = Object.keys(STATUS_LABEL) as LeaveStatus[];
  const types = Object.keys(TYPE_LABEL) as LeaveType[];
  return (
    <Card>
      <CardHeading name="list">Moje wnioski urlopowe ({filtered.length})</CardHeading>
      <FilterDetails>
        <summary>
          <Glyph name="filter" /> Pokaż filtry
        </summary>
        <form method="get">
          <p>
            <label>
              Status{" "}
              <Select name="status" defaultValue={params.status ?? ""}>
                <option value="">Wszystkie</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </label>
          </p>
          <p>
            <label>
              Rodzaj{" "}
              <Select name="type" defaultValue={params.type ?? ""}>
                <option value="">Wszystkie</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABEL[type]}
                  </option>
                ))}
              </Select>
            </label>
          </p>
          <Button type="submit" $fill>
            Filtruj
          </Button>
        </form>
      </FilterDetails>
      <RequestTable items={filtered} />
    </Card>
  );
}
