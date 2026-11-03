import { requireEmployee } from "@/lib/auth/session";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { decideLeave } from "@/lib/leave/service";
import type { DecisionAction } from "@/lib/leave/workflow";

type Context = { params: Promise<{ id: string }> };

const ACTIONS: DecisionAction[] = ["accept", "reject", "return_employee", "return_manager"];

export async function POST(request: Request, context: Context) {
  if (!assertSameOrigin(request)) return jsonError("Niedozwolone źródło.", 403);
  const { id } = await context.params;
  const actor = await requireEmployee();
  const body = await readJson(request);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const action = typeof record.action === "string" ? record.action : "";
  if (!ACTIONS.includes(action as DecisionAction)) return jsonError("Nieznana decyzja.", 400);
  const comment = typeof record.comment === "string" ? record.comment : "";
  const substituteId =
    typeof record.substituteId === "string" && record.substituteId.length > 0 ? record.substituteId : null;
  try {
    const result = await decideLeave(actor, id, { action: action as DecisionAction, comment, substituteId });
    if (!result.ok) return jsonError(result.error, result.status);
    return Response.json(result.data);
  } catch (error) {
    console.error(error);
    return jsonError("Nie udało się zapisać decyzji.", 500);
  }
}
