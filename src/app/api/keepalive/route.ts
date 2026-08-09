import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Cheap round-trip to keep the server→Supabase HTTPS connection warm so the
// first click after idle doesn't pay a TLS re-handshake (dev nicety).
export async function GET() {
  if (isSupabaseConfigured) {
    await supabaseAdmin!.from("Organization").select("id").limit(1).maybeSingle();
  }
  return NextResponse.json({ ok: true, t: Date.now() });
}
