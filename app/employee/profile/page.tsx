"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
  address: string | null;
  profile_picture_url: string | null;
  job_title: string | null;
  department: string | null;
  date_of_joining: string | null;
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select(
        "employee_id, full_name, email, role, phone, address, profile_picture_url, job_title, department, date_of_joining",
      )
      .eq("id", user.id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      setPhone(data.phone || "");
      setAddress(data.address || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        phone: phone || null,
        address: address || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Profile updated.");
    setSaving(false);
    await fetchProfile();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setUploading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-pictures").getPublicUrl(path);

    // Cache-bust so the new image shows immediately after an overwrite.
    const bustedUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profile_picture_url: bustedUrl })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setSuccess("Profile picture updated.");
    setUploading(false);
    await fetchProfile();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const initials = profile
    ? (
        (profile.full_name.split(" ")[0]?.[0] || "") +
        (profile.full_name.split(" ").slice(-1)[0]?.[0] || "")
      ).toUpperCase()
    : "";

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          Could not load your profile.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-headline-lg font-semibold">My Profile</h1>
        <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
          View your details and update your contact information
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div
          className="p-3 rounded text-body-sm mb-4"
          style={{
            background: "var(--error-container)",
            color: "var(--on-error-container)",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="p-3 rounded text-body-sm mb-4"
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "var(--status-approved)",
          }}
        >
          {success}
        </div>
      )}

      {/* Identity card */}
      <div
        className="border rounded-lg p-6 mb-6"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-headline-lg font-semibold overflow-hidden"
              style={{
                background: "var(--primary-container)",
                color: "var(--on-primary-container)",
              }}
            >
              {profile.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_picture_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer disabled:opacity-60"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
              aria-label="Change profile picture"
            >
              <span className="material-symbols-outlined text-sm">
                {uploading ? "hourglass_empty" : "photo_camera"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="min-w-0">
            <p className="text-title-md font-semibold truncate">{profile.full_name}</p>
            <p className="text-body-sm truncate" style={{ color: "var(--on-surface-variant)" }}>
              {profile.job_title || "—"}
              {profile.department ? ` · ${profile.department}` : ""}
            </p>
            <p
              className="font-mono text-label-caps uppercase mt-1"
              style={{ color: "var(--outline)" }}
            >
              {profile.employee_id}
            </p>
          </div>
        </div>

        {/* Read-only details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t" style={{ borderColor: "var(--outline-variant)" }}>
          <div>
            <p
              className="font-mono text-label-caps uppercase tracking-widest mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Email
            </p>
            <p className="text-body-sm">{profile.email}</p>
          </div>
          <div>
            <p
              className="font-mono text-label-caps uppercase tracking-widest mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Role
            </p>
            <p className="text-body-sm capitalize">{profile.role}</p>
          </div>
          <div>
            <p
              className="font-mono text-label-caps uppercase tracking-widest mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Job Title
            </p>
            <p className="text-body-sm">{profile.job_title || "—"}</p>
          </div>
          <div>
            <p
              className="font-mono text-label-caps uppercase tracking-widest mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Department
            </p>
            <p className="text-body-sm">{profile.department || "—"}</p>
          </div>
          <div>
            <p
              className="font-mono text-label-caps uppercase tracking-widest mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Date of Joining
            </p>
            <p className="text-body-sm">{formatDate(profile.date_of_joining)}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div
        className="border rounded-lg p-6"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <h2 className="text-title-md font-semibold mb-4">Contact information</h2>
        <p className="text-body-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
          You can update your phone number and address. Other details are managed by your admin.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              className="block font-mono text-label-caps uppercase tracking-widest mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
              style={{
                background: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            />
          </div>

          <div>
            <label
              className="block font-mono text-label-caps uppercase tracking-widest mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, state, ZIP"
              rows={3}
              className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors resize-none"
              style={{
                background: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
