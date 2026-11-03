import "server-only";
import { dbError, getDb } from "@/lib/db/client";
import type { NotificationItem } from "@/lib/types";

export async function addNotifications(
  items: { recipientId: string; requestId: string; body: string }[],
): Promise<void> {
  const unique = new Map<string, { recipientId: string; requestId: string; body: string }>();
  for (const item of items) {
    unique.set(`${item.recipientId}:${item.body}`, item);
  }
  const rows = [...unique.values()];
  if (rows.length === 0) return;
  const { error } = await getDb().from("notifications").insert(
    rows.map((item) => ({
      recipient_employee_id: item.recipientId,
      request_id: item.requestId,
      body: item.body,
    })),
  );
  if (error) throw dbError(error);
}

export async function listNotifications(recipientId: string, limit = 8): Promise<NotificationItem[]> {
  const { data, error } = await getDb()
    .from("notifications")
    .select("id, request_id, body, read_at, created_at")
    .eq("recipient_employee_id", recipientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw dbError(error);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    requestId: (row.request_id as string | null) ?? null,
    body: row.body as string,
    readAt: (row.read_at as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function countUnread(recipientId: string): Promise<number> {
  const { count, error } = await getDb()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_employee_id", recipientId)
    .is("read_at", null);
  if (error) throw dbError(error);
  return count ?? 0;
}

/** Otwarcie wniosku czyści nieprzeczytane komunikaty o tej sprawie. */
export async function markRequestNotificationsRead(recipientId: string, requestId: string): Promise<void> {
  const { error } = await getDb()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_employee_id", recipientId)
    .eq("request_id", requestId)
    .is("read_at", null);
  if (error) throw dbError(error);
}
