import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

export function requireSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('Supabase server credentials are not configured');
  }
  return supabaseAdmin;
}
