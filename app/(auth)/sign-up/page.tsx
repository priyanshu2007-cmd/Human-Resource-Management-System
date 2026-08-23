"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
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

      // 1. Generate employee ID and metadata for the admin
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "XX";
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "XX";
      const prefix =
        (firstName.slice(0, 2) + lastName.slice(0, 2)).toUpperCase().padEnd(4, "X");
      const year = new Date().getFullYear();
      const employeeId = `${prefix}${year}0001`;

      // 2. Create auth user with metadata for PostgreSQL trigger
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
          data: {
            employee_id: employeeId,
            first_name: firstName,
            last_name: lastName,
            full_name: fullName.trim(),
            role: "admin",
            company_name: companyName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

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
      className="fixed inset-0 z-50 flex flex-col lg:flex-row"
      style={{ background: "var(--surface)" }}
    >
      {/* Left decorative panel — desktop only */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between relative overflow-hidden p-10 xl:p-14"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
        }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in srgb, var(--on-primary) 30%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10">
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: "var(--on-primary)" }}
          >
            Dayflow
          </span>
        </div>

        <div className="relative z-10 max-w-sm">
          <p
            className="text-headline-lg font-semibold mb-3"
            style={{ color: "var(--on-primary)" }}
          >
            Every workday, perfectly aligned.
          </p>
          <p
            className="text-body-md"
            style={{
              color: "color-mix(in srgb, var(--on-primary) 85%, transparent)",
            }}
          >
            Onboarding, attendance, leave, and payroll — one calm, orderly
            workspace for your whole company.
          </p>
        </div>

        <div
          className="relative z-10 flex items-start gap-3 rounded-lg p-4"
          style={{
            background: "color-mix(in srgb, var(--on-primary) 12%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--on-primary) 25%, transparent)",
          }}
        >
          <Shield
            className="shrink-0 mt-0.5"
            size={22}
            style={{ color: "var(--on-primary)" }}
          />
          <div>
            <p
              className="text-title-md font-semibold"
              style={{ color: "var(--on-primary)" }}
            >
              Enterprise Grade Security
            </p>
            <p
              className="text-body-sm mt-0.5"
              style={{
                color: "color-mix(in srgb, var(--on-primary) 80%, transparent)",
              }}
            >
              Your data is protected with industry-leading standards.
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 min-h-0 overflow-y-auto flex justify-center">
        <div className="w-full max-w-[480px] px-6 py-10 sm:px-10">
          {/* Compact company logo upload */}
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 shrink-0 rounded-lg border border-dashed flex items-center justify-center cursor-pointer transition-colors group relative overflow-hidden"
              style={{
                borderColor: "var(--primary)",
                background: logoPreview ? "transparent" : "var(--surface-container-low)",
              }}
            >
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span
                  className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform"
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
            <div>
              <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                Company logo
              </p>
              <p className="text-label-caps font-mono" style={{ color: "var(--outline)" }}>
                PNG or SVG, min 256×256
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-headline-lg font-semibold mb-1">
              Create an Account
            </h1>
            <p
              className="text-body-sm"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Join Dayflow to manage your workspace efficiently.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="mt-6 text-center">
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
            className="mt-8 p-4 rounded border"
            style={{
              background: "var(--surface-container-low)",
              borderColor: "var(--outline-variant)",
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
      </div>
    </div>
  );
}
