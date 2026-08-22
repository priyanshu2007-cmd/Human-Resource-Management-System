"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * /change-password — Forced password change on first sign-in.
 * Employees created by admins have must_change_password = true.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setError("Password must contain at least one special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Clear the must_change_password flag
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({ must_change_password: false })
          .eq("id", user.id);

        // Redirect based on role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/employee/dashboard");
        }
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
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl pointer-events-none"
        style={{ background: "rgba(99, 14, 212, 0.05)" }}
      />

      <div className="flex flex-col items-center mb-8 relative z-10">
        <span
          className="material-symbols-outlined text-4xl mb-3"
          style={{ color: "var(--primary)" }}
        >
          lock_reset
        </span>
        <h1 className="text-headline-lg font-semibold text-center mb-1">
          Change your password
        </h1>
        <p
          className="text-body-sm text-center"
          style={{ color: "var(--on-surface-variant)" }}
        >
          Your temporary password must be changed before continuing.
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-5 relative z-10">
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

        <div className="relative">
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>

        <div className="relative">
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Confirm New Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
        </div>

        <div
          className="text-body-sm p-3 rounded"
          style={{
            background: "var(--surface-container-low)",
            color: "var(--on-surface-variant)",
          }}
        >
          <p className="font-semibold mb-1">Password requirements:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One number</li>
            <li>One special character</li>
          </ul>
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
          >
            {loading ? "Updating…" : "Set new password"}
            {!loading && (
              <span className="material-symbols-outlined text-lg">
                check
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
