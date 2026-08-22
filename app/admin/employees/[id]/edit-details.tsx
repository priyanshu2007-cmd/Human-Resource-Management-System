"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  employeeId: string;
  initialFullName: string;
  initialEmail: string;
  initialJobTitle: string | null;
  initialDepartment: string | null;
  initialPhone: string | null;
  initialAddress: string | null;
  initialDateOfJoining: string | null;
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface-container-lowest)",
  borderColor: "var(--outline-variant)",
};

const inputStyle: React.CSSProperties = {
  background: "var(--surface-container-lowest)",
  borderColor: "var(--outline-variant)",
};

const labelClass =
  "block font-mono text-label-caps uppercase tracking-widest mb-1";
const labelStyle: React.CSSProperties = { color: "var(--on-surface-variant)" };

export function EmployeeEditDetails({
  employeeId,
  initialFullName,
  initialEmail,
  initialJobTitle,
  initialDepartment,
  initialPhone,
  initialAddress,
  initialDateOfJoining,
}: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [department, setDepartment] = useState(initialDepartment ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [dateOfJoining, setDateOfJoining] = useState(initialDateOfJoining ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleCancel() {
    setFullName(initialFullName);
    setEmail(initialEmail);
    setJobTitle(initialJobTitle ?? "");
    setDepartment(initialDepartment ?? "");
    setPhone(initialPhone ?? "");
    setAddress(initialAddress ?? "");
    setDateOfJoining(initialDateOfJoining ?? "");
    setError(null);
    setEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        email: email.trim(),
        job_title: jobTitle || null,
        department: department || null,
        phone: phone || null,
        address: address || null,
        date_of_joining: dateOfJoining || null,
      })
      .eq("id", employeeId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Details updated.");
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="border rounded-lg p-6 mb-6" style={cardStyle}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title-md font-semibold">Job &amp; Contact Details</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-body-sm font-semibold transition-colors cursor-pointer border"
            style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Edit
          </button>
        )}
      </div>

      {error && (
        <div
          className="p-3 rounded text-body-sm mb-4"
          style={{ background: "var(--error-container)", color: "var(--on-error-container)" }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="p-3 rounded text-body-sm mb-4"
          style={{ background: "rgba(34,197,94,0.1)", color: "var(--status-approved)" }}
        >
          {success}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jordan Doe"
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
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
                placeholder="e.g. Engineering"
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                style={inputStyle}
              />
            </div>
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
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass} style={labelStyle}>
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, state, ZIP"
                rows={3}
                className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors resize-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer border disabled:opacity-60"
              style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={labelStyle}>
              Full Name
            </p>
            <p className="text-body-sm">{fullName || "—"}</p>
          </div>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={labelStyle}>
              Email
            </p>
            <p className="text-body-sm">{email || "—"}</p>
          </div>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={labelStyle}>
              Job Title
            </p>
            <p className="text-body-sm">{jobTitle || "—"}</p>
          </div>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={labelStyle}>
              Department
            </p>
            <p className="text-body-sm">{department || "—"}</p>
          </div>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={labelStyle}>
              Phone
            </p>
            <p className="text-body-sm">{phone || "—"}</p>
          </div>
          <div>
            <p className="font-mono text-label-caps uppercase mb-1" style={labelStyle}>
              Date of Joining
            </p>
            <p className="text-body-sm">{dateOfJoining || "—"}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="font-mono text-label-caps uppercase mb-1" style={labelStyle}>
              Address
            </p>
            <p className="text-body-sm">{address || "—"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
