"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_RULES = {
  minLength: 8,
  uppercase: /[A-Z]/,
  number: /\d/,
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
};

function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_RULES.minLength) return `At least ${PASSWORD_RULES.minLength} characters`;
  if (!PASSWORD_RULES.uppercase.test(pw)) return "At least one uppercase letter";
  if (!PASSWORD_RULES.number.test(pw)) return "At least one number";
  if (!PASSWORD_RULES.special.test(pw)) return "At least one special character";
  return null;
}

export default function SignUpPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (!companyName.trim()) { setError("Company name is required."); return; }
    if (!fullName.trim()) { setError("Full name is required."); return; }

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // 2. Generate employee ID for the admin
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "XX";
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "XX";
      const prefix =
        (firstName.slice(0, 2) + lastName.slice(0, 2)).toUpperCase().padEnd(4, "X");
      const year = new Date().getFullYear();
      const employeeId = `${prefix}${year}0001`;

      // 3. Create org + admin profile via RPC
      const { error: rpcError } = await supabase.rpc(
        "create_organization_and_admin",
        {
          org_name: companyName,
          emp_id: employeeId,
          name: fullName,
        }
      );

      if (rpcError) {
        // If the RPC fails because email isn't confirmed yet, guide user
        if (rpcError.message.includes("JWT")) {
          // User needs to confirm email first
          router.push("/sign-in?message=check-email");
          return;
        }
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      // 4. Upload company logo if provided
      if (logoFile) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.storage
            .from("profile-pictures")
            .upload(`${userData.user.id}/company-logo`, logoFile, {
              upsert: true,
            });
        }
      }

      // 5. Phone number stored in profile
      if (phone) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase
            .from("profiles")
            .update({ phone })
            .eq("id", userData.user.id);
        }
      }

      router.push("/admin/dashboard");
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
        <h1 className="text-headline-lg font-semibold text-center mb-1">
          Create a company workspace
        </h1>
        <p
          className="text-body-sm text-center"
          style={{ color: "var(--on-surface-variant)" }}
        >
          For HR officers and admins only.
        </p>
      </div>

      {/* Company logo upload */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-20 h-20 rounded-full border border-dashed flex items-center justify-center cursor-pointer transition-colors group relative overflow-hidden mb-2"
          style={{
            borderColor: "var(--primary)",
            background: logoPreview ? "transparent" : "var(--surface)",
          }}
        >
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span
              className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform"
              style={{ color: "var(--primary)" }}
            >
              cloud_upload
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml"
          onChange={handleLogoChange}
          className="hidden"
          aria-label="Upload Company Logo"
        />
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Company logo
        </p>
        <p className="text-label-caps font-mono" style={{ color: "var(--outline)" }}>
          PNG or SVG, min 256×256
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5 relative z-10">
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
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corp"
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

        <div>
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
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

        <div>
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
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

        <div>
          <label
            className="block font-mono text-label-caps uppercase tracking-widest mb-1"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
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
            Confirm Password
          </label>
          <input
            type={showConfirmPassword ? "text" : "password"}
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
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[30px] transition-colors cursor-pointer"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <span className="material-symbols-outlined text-xl">
              {showConfirmPassword ? "visibility_off" : "visibility"}
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
            {loading ? "Creating workspace…" : "Sign Up"}
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
          href="/sign-in"
          className="text-body-sm inline-flex items-center gap-1 transition-colors"
          style={{ color: "var(--primary)" }}
        >
          Already have an account? Sign In
        </Link>
      </div>

      {/* Info note */}
      <div
        className="mt-8 p-4 rounded border relative z-10"
        style={{
          background: "var(--surface-container-low)",
          borderColor: "rgba(204, 195, 216, 0.5)",
        }}
      >
        <p
          className="text-body-sm text-center flex items-center justify-center gap-2"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: "var(--outline)" }}
          >
            info
          </span>
          Employees can&apos;t self-register. An HR officer creates each employee
          record; DayFlow generates the Login ID and a one-time password.
        </p>
      </div>
    </div>
  );
}
