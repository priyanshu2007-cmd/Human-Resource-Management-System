import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";

const DEFAULT_URL = "https://sjbyazwtokihprndebxh.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYnlhend0b2tpaHBybmRlYnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjU2ODYsImV4cCI6MjEwMjk0MTY4Nn0.aghkqP3_r8M8jX7vQP2e0KmL_a30kUsajjeD2yXj6Zs";

// Refreshes the Supabase session cookie on every request.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  const supabase = createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touches the session so expired tokens get refreshed before rendering.
  try {
    await supabase.auth.getUser();
  } catch {
    // If invalid token, proceed so layout / route redirects can handle it
  }

  return supabaseResponse;
}
