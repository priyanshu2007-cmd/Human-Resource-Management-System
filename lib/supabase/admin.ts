import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * Service-role client. Bypasses RLS entirely — only ever import this from
 * Route Handlers or Server Actions (e.g. admin creates an employee's
 * auth.users row), never from a Client Component or anything sent to the
 * browser. SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix on purpose.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
