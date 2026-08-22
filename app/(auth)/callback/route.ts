import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /callback — Supabase email confirmation callback.
 * Exchanges the auth code for a session, then redirects to:
 * - /change-password if must_change_password is set
 * - /admin/dashboard or /employee/dashboard based on role
 * - /create-company if no profile exists (fresh sign-up)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, must_change_password")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // No profile yet — fresh sign-up, needs onboarding
          return NextResponse.redirect(`${origin}/create-company`);
        }

        if (profile.must_change_password) {
          return NextResponse.redirect(`${origin}/change-password`);
        }

        const dashboard =
          profile.role === "admin"
            ? "/admin/dashboard"
            : "/employee/dashboard";
        return NextResponse.redirect(`${origin}${dashboard}`);
      }
    }
  }

  // Fallback: redirect to sign-in with an error
  return NextResponse.redirect(`${origin}/sign-in?error=auth-callback-failed`);
}
