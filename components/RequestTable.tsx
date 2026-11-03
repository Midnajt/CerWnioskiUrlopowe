import { Badge, Table, TableWrap, TextLink } from "@/components/ui";
import { formatPlDate } from "@/lib/leave/dates";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/leave/labels";
import type { RequestListItem } from "@/lib/leave/views";

type Props = { items: RequestListItem[] };

export function RequestTable({ items }: Props) {
  if (items.length === 0) return <p>Brak wniosków.</p>;
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <th>Lp.</th>
            <th>Wnioskujący</th>
            <th>Rodzaj urlopu</th>
            <th>Data rozpoczęcia</th>
            <th>Data zakończenia</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>
                {item.ownerName}
                {item.isNew ? <Badge>NOWE</Badge> : null}
              </td>
              <td>{TYPE_LABEL[item.leaveType]}</td>
              <td>{formatPlDate(item.dateFrom)}</td>
              <td>{formatPlDate(item.dateTo)}</td>
              <td>
                <TextLink href={`/wnioski/${item.id}`}>Otwórz</TextLink>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
