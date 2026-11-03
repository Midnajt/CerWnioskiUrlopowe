import "server-only";
import { getDb } from "@/lib/db/client";

/** Ping pod healthcheck. Błąd konfiguracji albo bazy zwraca false. */
export async function pingDb(): Promise<boolean> {
  const { error } = await getDb().from("departments").select("id").limit(1);
  return !error;
}
