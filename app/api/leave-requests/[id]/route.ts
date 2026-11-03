import { requireEmployee } from "@/lib/auth/session";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { saveLeave } from "@/lib/leave/service";
import { parseLeaveBody } from "@/app/api/leave-requests/route";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!assertSameOrigin(request)) return jsonError("Niedozwolone źródło.", 403);
  const { id } = await context.params;
  const actor = await requireEmployee();
  const parsed = parseLeaveBody(await readJson(request));
  if (!parsed) return jsonError("Nieprawidłowe dane wniosku.", 400);
  try {
    const result = await saveLeave(actor, parsed, id);
    if (!result.ok) return jsonError(result.error, result.status);
    return Response.json(result.data);
  } catch (error) {
    console.error(error);
    return jsonError("Nie udało się zapisać wniosku.", 500);
  }
}
