import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the SECRET key, which bypasses RLS.
// The app reads/writes server-side only, so this is the right key. The
// publishable (anon) key is for any future client-side / browser use.
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

export const isSupabaseConfigured = Boolean(url && secret);

export const supabaseAdmin = isSupabaseConfigured
  ? createClient(url!, secret!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "aftercareos-server" } },
    })
  : undefined;
