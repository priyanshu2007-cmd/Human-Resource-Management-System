"use client";

import { useState } from "react";
import Link from "next/link";

interface CreatedEmployee {
  employee_id: string;
  temp_password: string;
  full_name: string;
  email: string;
  message: string;
}

export default function NewEmployeePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [role, setRole] = useState<"employee" | "admin">("employee");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreatedEmployee | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setDepartment("");
    setDateOfJoining("");
    setRole("employee");
    setCreated(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError("Full name and email are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          job_title: jobTitle.trim() || undefined,
          department: department.trim() || undefined,
          date_of_joining: dateOfJoining || undefined,
          role,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || "Failed to create employee.");
        setLoading(false);
        return;
      }

      setCreated(body as CreatedEmployee);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // clipboard not available; silently ignore
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--surface-container-lowest)",
    borderColor: "var(--outline-variant)",
  };

  const labelClass =
    "block font-mono text-label-caps uppercase tracking-widest mb-1";
  const labelStyle: React.CSSProperties = { color: "var(--on-surface-variant)" };

  // ---- Success confirmation card ----
  if (created) {
    return (
      <div className="max-w-lg mx-auto">
        <div
          className="border rounded-lg p-6 mb-6 text-center"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <span
            className="material-symbols-outlined text-5xl mb-3 block"
            style={{ color: "var(--status-approved)" }}
          >
            check_circle
          </span>
          <h1 className="text-headline-lg font-semibold mb-1">
            Employee created
          </h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            {created.full_name} · {created.email}
          </p>
        </div>

        <div
          className="border rounded-lg p-6 mb-6"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div
            className="flex items-start gap-2 p-3 rounded mb-5 text-body-sm"
            style={{
              background: "var(--error-container)",
              color: "var(--on-error-container)",
            }}
          >
            <span className="material-symbols-outlined text-lg shrink-0">
              warning
            </span>
            This is the only time the one-time password will be shown. Share
            it with the employee now — Dayflow will not display it again.
          </div>

          {/* Login ID */}
          <div className="mb-4">
            <label className={labelClass} style={labelStyle}>
              Login ID
            </label>
            <div className="flex items-center gap-2">
              <span
                className="flex-1 font-mono text-title-md font-semibold px-3 py-2.5 rounded border"
                style={inputStyle}
              >
                {created.employee_id}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(created.employee_id, "id")}
                className="px-3 py-2.5 rounded border text-body-sm font-semibold transition-colors cursor-pointer"
                style={{ borderColor: "var(--outline-variant)" }}
              >
                <span className="material-symbols-outlined text-lg">
                  {copiedField === "id" ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Temp password */}
          <div className="mb-2">
            <label className={labelClass} style={labelStyle}>
              One-Time Password
            </label>
            <div className="flex items-center gap-2">
              <span
                className="flex-1 font-mono text-title-md font-semibold px-3 py-2.5 rounded border"
                style={inputStyle}
              >
                {created.temp_password}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(created.temp_password, "pw")}
                className="px-3 py-2.5 rounded border text-body-sm font-semibold transition-colors cursor-pointer"
                style={{ borderColor: "var(--outline-variant)" }}
              >
                <span className="material-symbols-outlined text-lg">
                  {copiedField === "pw" ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>

          <p className="text-body-sm mt-3" style={{ color: "var(--on-surface-variant)" }}>
            The employee will be required to change this password on first
            sign-in.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/employees"
            className="flex-1 text-center px-4 py-2.5 rounded text-body-sm font-semibold transition-colors border"
            style={{
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface-variant)",
            }}
          >
            Back to Employees
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="flex-1 px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
            }}
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  // ---- Creation form ----
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/employees"
          className="text-body-sm inline-flex items-center gap-1 mb-3"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Employees
        </Link>
        <h1 className="text-headline-lg font-semibold">New Employee</h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Dayflow generates the Login ID and a one-time password automatically.
        </p>
      </div>

      <div
        className="border rounded-lg p-6"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className={labelClass} style={labelStyle}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              required
              className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
              className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
              style={inputStyle}
            />
          </div>

          <div>
            <label className={labelClass} style={labelStyle}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Software Engineer"
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>
                Date of Joining
              </label>
              <input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              />
              <p className="text-body-sm mt-1" style={{ color: "var(--outline)" }}>
                Used for the Login ID's year.
              </p>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "employee" | "admin")}
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
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
              {loading ? "Creating…" : "Create Employee"}
              {!loading && (
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
