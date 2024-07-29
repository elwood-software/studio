import { createClient } from "@supabase/supabase-js";
import { assert } from "@/_deps.ts";

export function getSupabaseEnv() {
  const supabaseUrl = Deno.env.get("SUPABSAE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  assert(supabaseUrl, "missing SUPABSAE_URL");
  assert(supabaseAnonKey, "missing SUPABASE_ANON_KEY");
  assert(supabaseServiceRoleKey, "missing SUPABASE_SERVICE_ROLE_KEY");

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
}

export function createSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function createServiceSupabaseClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        "Authorization": `Bearer ${supabaseServiceRoleKey}`,
      },
    },
  });
}
