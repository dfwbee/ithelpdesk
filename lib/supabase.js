import { createClient } from "@supabase/supabase-js";

// These two values come from your .env.local file
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// true only when both values are filled in
export const isSupabaseConfigured = Boolean(url && key);

// The one shared connection to Supabase. It stays null until .env.local is set,
// so the app can show a friendly setup message instead of crashing.
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;