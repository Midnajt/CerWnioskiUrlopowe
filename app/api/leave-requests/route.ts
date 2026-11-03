import { requireEmployee } from "@/lib/auth/session";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { saveLeave, type LeaveBody } from "@/lib/leave/service";

export function parseLeaveBody(value: unknown): LeaveBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const leaveType = typeof body.leaveType === "string" ? body.leaveType : "";
  const dateFrom = typeof body.dateFrom === "string" ? body.dateFrom : "";
  const dateTo = typeof body.dateTo === "string" ? body.dateTo : "";
  const substituteId =
    typeof body.substituteId === "string" && body.substituteId.length > 0 ? body.substituteId : null;
  return { leaveType, dateFrom, dateTo, substituteId, submit: body.submit === true };
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Niedozwolone źródło.", 403);
  const actor = await requireEmployee();
  const parsed = parseLeaveBody(await readJson(request));
  if (!parsed) return jsonError("Nieprawidłowe dane wniosku.", 400);
  try {
    const result = await saveLeave(actor, parsed);
    if (!result.ok) return jsonError(result.error, result.status);
    return Response.json(result.data);
  } catch (error) {
    console.error(error);
    return jsonError("Nie udało się zapisać wniosku.", 500);
  }
}
