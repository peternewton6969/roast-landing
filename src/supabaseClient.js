import { createClient } from '@supabase/supabase-js';

// Reads the Supabase project URL + anon key from the build env (.env). Both are
// safe in a public frontend when RLS is set (see supabase/schema.sql). Until the
// env is filled in, `supabase` is null and the UI shows a "not configured" state
// instead of crashing.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured ? createClient(url, anonKey) : null;
