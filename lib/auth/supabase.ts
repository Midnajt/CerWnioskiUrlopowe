import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublishableKey, getSupabaseUrl } from "@/lib/env";

/** Klient Auth czytający ciasteczko sesji. Klucz publishable nie wychodzi do przeglądarki. */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getPublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // W Server Component odświeżenie sesji robi proxy.ts.
        }
      },
    },
  });
}
