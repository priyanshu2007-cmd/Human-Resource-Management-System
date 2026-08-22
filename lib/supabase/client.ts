import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

const DEFAULT_URL = "https://sjbyazwtokihprndebxh.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYnlhend0b2tpaHBybmRlYnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjU2ODYsImV4cCI6MjEwMjk0MTY4Nn0.aghkqP3_r8M8jX7vQP2e0KmL_a30kUsajjeD2yXj6Zs";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  return createBrowserClient<Database>(url, anonKey);
}
