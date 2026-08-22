"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // If the user typed something that looks like an email, use it directly.
      // Otherwise treat it as a Login ID and look up the email via a profiles query.
      let email = loginId;

      if (!loginId.includes("@")) {
        // Login ID entered — look up the profile's email
        const { data: profile, error: lookupError } = await supabase
          .from("profiles")
          .select("email")
          .eq("employee_id", loginId.toUpperCase())
          .maybeSingle();

        if (lookupError || !profile) {
          setError("Login ID not found. Check with your HR officer.");
          setLoading(false);
          return;
        }
        email = profile.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          setError("Please confirm your email before signing in.");
        } else {
          setError("Invalid credentials. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Check if the user needs to change their password (first sign-in)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, must_change_password")
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
        .single();

      if (profile?.must_change_password) {
        router.push("/change-password");
        return;
      }

      // Redirect based on role
      if (profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/employee/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="border rounded-lg p-8 relative overflow-hidden"
      style={{
        background: "var(--surface-container-lowest)",
        borderColor: "var(--outline-variant)",
      }}
    >
      {/* Decorative blob */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl pointer-events-none"
        style={{ background: "rgba(99, 14, 212, 0.05)" }}
      />

      <div className="flex flex-col items-center mb-8 relative z-10">
        <p
          className="font-mono text-label-caps uppercase tracking-widest mb-3"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Every workday, perfectly aligned.
        </p>
        <h1 className="text-headline-lg font-semibold text-center mb-1">
          Sign in
        </h1>
        <p
          className="text-body-sm text-center"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Use the Login ID issued by your HR officer.
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-5 relative z-10">
        {error && (
          <div
            className="p-3 rounded text-body-sm"
            style={{
              background: "var(--error-container)",
              color: "var(--on-error-container)",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Login ID or Email
          </label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="OIJODO20220001 or jane@acme.com"
            required
            className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 0 0 1px var(--primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--outline-variant)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div className="relative">
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full border rounded px-3 py-2.5 pr-10 text-body-md focus:outline-none focus:ring-1 transition-colors"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 0 0 1px var(--primary)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--outline-variant)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[30px] transition-colors cursor-pointer"
            style={{ color: "var(--on-surface-variant)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--on-surface-variant)")
            }
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full text-title-md font-semibold rounded py-3 flex justify-center items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                e.currentTarget.style.background = "var(--surface-tint)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--primary)";
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
            {!loading && (
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center relative z-10">
        <Link
          href="/sign-up"
          className="text-body-sm inline-flex items-center gap-1 transition-colors"
          style={{ color: "var(--primary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--primary)")
          }
        >
          Don&apos;t have an account? Sign Up
        </Link>
      </div>
    </div>
  );
}
