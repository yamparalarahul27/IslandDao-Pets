import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client using the anon key.
 * Honours RLS — safe to use with user-supplied input.
 */
export function getSupabaseServer(): SupabaseClient {
  if (anonClient) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  anonClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return anonClient;
}

/**
 * Service-role client. Bypasses RLS. Only call from trusted server code
 * (server actions, route handlers) — NEVER expose its return value to the
 * client and never use it with unsanitised user input.
 */
export function getSupabaseService(): SupabaseClient {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  serviceClient = createClient(url, key, {
    auth: { persistSession: false },
  });
  return serviceClient;
}

export const SUPABASE_SPRITES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_SPRITES_BUCKET ?? "pet-sprites";
