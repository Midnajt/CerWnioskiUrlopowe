import { NextResponse } from "next/server";
import { pingDb } from "@/lib/db";

export async function GET() {
  try {
    const ok = await pingDb();
    if (!ok) return NextResponse.json({ ok: false, error: "Baza niedostępna" }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Brak konfiguracji Supabase" }, { status: 503 });
  }
}
