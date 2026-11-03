import { createAuthClient } from "@/lib/auth/supabase";
import { assertSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Niedozwolone źródło.", 403);
  try {
    const supabase = await createAuthClient();
    await supabase.auth.signOut();
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError("Nie udało się wylogować.", 500);
  }
}
