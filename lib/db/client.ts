import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSecretKey, getSupabaseUrl } from "@/lib/env";

let client: SupabaseClient | null = null;

/** Jedna instancja service role. Nie trzyma sesji użytkownika. */
export function getDb(): SupabaseClient {
  if (!client) {
    client = createClient(getSupabaseUrl(), getSecretKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

export function dbError(error: { message: string }): Error {
  return new Error(error.message);
}
