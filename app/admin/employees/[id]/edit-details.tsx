"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  employeeId: string;
  initialJobTitle: string | null;
  initialDepartment: string | null;
  initialPhone: string | null;
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
  initialJobTitle,
  initialDepartment,
  initialPhone,
}: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [department, setDepartment] = useState(initialDepartment ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleCancel() {
    setJobTitle(initialJobTitle ?? "");
    setDepartment(initialDepartment ?? "");
    setPhone(initialPhone ?? "");
    setError(null);
    setEditing(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        job_title: jobTitle || null,
        department: department || null,
        phone: phone || null,
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>
      )}
    </div>
  );
}
