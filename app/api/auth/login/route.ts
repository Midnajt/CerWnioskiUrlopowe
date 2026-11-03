import { createAuthClient } from "@/lib/auth/supabase";
import { getEmployeeByAuthId } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("Niedozwolone źródło.", 403);
  const body = await readJson(request);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const password = typeof record.password === "string" ? record.password : "";
  if (!email || !password) return jsonError("Podaj e-mail i hasło.", 400);

  try {
    const supabase = await createAuthClient();
    const signed = await supabase.auth.signInWithPassword({ email, password });
    if (signed.error) return jsonError("Nieprawidłowy e-mail lub hasło.", 401);
    const userId = signed.data.user?.id;
    if (!userId) return jsonError("Nieprawidłowy e-mail lub hasło.", 401);
    const employee = await getEmployeeByAuthId(userId);
    if (!employee) {
      await supabase.auth.signOut();
      return jsonError("Konto nie jest powiązane z pracownikiem.", 403);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonError("Logowanie jest niedostępne. Sprawdź konfigurację Supabase.", 503);
  }
}
