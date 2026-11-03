import { requireEmployee } from "@/lib/auth/session";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { withdrawLeave } from "@/lib/leave/service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  if (!assertSameOrigin(request)) return jsonError("Niedozwolone źródło.", 403);
  const { id } = await context.params;
  const actor = await requireEmployee();
  try {
    const result = await withdrawLeave(actor, id);
    if (!result.ok) return jsonError(result.error, result.status);
    return Response.json(result.data);
  } catch (error) {
    console.error(error);
    return jsonError("Nie udało się wycofać wniosku.", 500);
  }
}
