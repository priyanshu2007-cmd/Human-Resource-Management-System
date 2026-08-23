"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  id: string;
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
  organization_id: string;
  date_of_birth?: string | null;
  residing_address?: string | null;
  nationality?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  location?: string | null;
  manager_id?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  ifsc_code?: string | null;
  pan_no?: string | null;
  uan_no?: string | null;
}

interface SalaryData {
  month_wage?: number | null;
  basic_salary?: number | null;
  base_salary?: number;
  hra?: number | null;
  standard_allowance?: number | null;
  performance_bonus?: number | null;
  lta?: number | null;
  fixed_allowance?: number | null;
  employee_pf?: number | null;
  professional_tax?: number | null;
  net_pay?: number | null;
  allowances?: number | null;
  deductions?: number | null;
  effective_from?: string;
}

interface DocumentRow {
  id: string;
  document_type: string;
  file_url: string;
  uploaded_at: string | null;
}

type TabType = "resume" | "private" | "salary" | "security";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("Creative HR");
  const [salary, setSalary] = useState<SalaryData | null>(null);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("private");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields in Private Info
  const [phone, setPhone] = useState("");
  const [residingAddress, setResidingAddress] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Single");

  // Security tab state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [changingPw, setChangingPw] = useState(false);

  // Document upload state
  const [docType, setDocType] = useState("Resume");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Fetch Profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (prof) {
      const p = prof as unknown as ProfileData;
      setProfile(p);
      setPhone(p.phone || "");
      setResidingAddress(p.residing_address || p.address || "");
      setMaritalStatus(p.marital_status || "Single");

      // Fetch org name
      if (p.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", p.organization_id)
          .single();
        if (orgData) setOrgName(orgData.name);
      }

      // Fetch manager name if exists
      if (p.manager_id) {
        const { data: mgr } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", p.manager_id)
          .single();
        if (mgr) setManagerName(mgr.full_name);
      }
    }

    // 2. Fetch Salary (latest)
    const { data: salData } = await supabase
      .from("salary_structures")
      .select("*")
      .eq("user_id", user.id)
      .order("effective_from", { ascending: false })
      .limit(1);

    if (salData && salData.length > 0) {
      setSalary(salData[0] as unknown as SalaryData);
    }

    // 3. Fetch Documents
    const { data: docs } = await supabase
      .from("documents")
      .select("id, document_type, file_url, uploaded_at")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    setDocuments((docs as unknown as DocumentRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        phone: phone || null,
        address: residingAddress || null,
        residing_address: residingAddress || null,
        marital_status: maritalStatus,
      })
      .eq("id", user.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess("Contact & personal details saved successfully.");
      fetchAllData();
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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
    const bustedUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase
      .from("profiles")
      .update({ profile_picture_url: bustedUrl })
      .eq("id", user.id);

    setUploading(false);
    setSuccess("Profile picture updated.");
    fetchAllData();
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setChangingPw(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setChangingPw(false);
    if (updateError) {
      setPwError(updateError.message);
    } else {
      setPwSuccess("Password successfully changed!");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleDocumentUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = docFileInputRef.current?.files?.[0];
    if (!file || !profile) return;

    setUploadingDoc(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${user.id}/${Date.now()}-${safeName}`;

    await supabase.storage.from("documents").upload(path, file);
    await supabase.from("documents").insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      document_type: docType,
      file_url: path,
    });

    setUploadingDoc(false);
    if (docFileInputRef.current) docFileInputRef.current.value = "";
    fetchAllData();
  }

  async function handleViewDocument(doc: DocumentRow) {
    setViewingDocId(doc.id);
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 60);

    setViewingDocId(null);
    if (data?.signedUrl) {
      globalThis.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
        Loading profile information…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-12 text-center">
        <p className="text-body-md font-semibold">Profile not found</p>
      </div>
    );
  }

  const initials = (
    (profile.full_name.split(" ")[0]?.[0] || "") +
    (profile.full_name.split(" ").slice(-1)[0]?.[0] || "")
  ).toUpperCase();

  // Salary calculations for restricted view
  const mGross = salary?.month_wage || (salary ? (salary.base_salary || 0) + (salary.allowances || 0) : 0);
  const mBasic = salary?.basic_salary || salary?.base_salary || round2(mGross * 0.5);
  const mHra = salary?.hra || round2(mBasic * 0.5);
  const mStd = salary?.standard_allowance || round2(mGross * 0.1667);
  const mBonus = salary?.performance_bonus || round2(mBasic * 0.0833);
  const mLta = salary?.lta || round2(mBasic * 0.0833);
  const mFixed = salary?.fixed_allowance || round2(mGross - (mBasic + mHra + mStd + mBonus + mLta));
  const mPf = salary?.employee_pf || round2(mBasic * 0.12);
  const mTax = salary?.professional_tax || 200;
  const mNet = salary?.net_pay || round2(mGross - mPf - mTax);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Section */}
      <div
        className="border rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Profile Picture */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-headline-lg font-bold overflow-hidden shadow-inner border-2 border-[var(--primary)]"
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
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer disabled:opacity-60 border"
                style={{
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                  borderColor: "var(--surface-container-lowest)",
                }}
                aria-label="Upload profile picture"
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

            {/* Core Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-headline-md font-bold truncate">{profile.full_name}</h1>
                <span
                  className="font-mono text-label-caps uppercase px-2 py-0.5 rounded-sm text-xs font-semibold"
                  style={{
                    background: "var(--primary-container)",
                    color: "var(--on-primary-container)",
                  }}
                >
                  {profile.role}
                </span>
              </div>
              <p className="text-body-md font-medium text-[var(--primary)] mt-0.5">
                {profile.job_title || "Team Member"}
              </p>
              <p className="font-mono text-xs text-[var(--outline)] mt-1">
                ID: {profile.employee_id}
              </p>
            </div>
          </div>

          {/* Key Attributes Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto text-xs">
            <div className="p-2.5 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <span className="text-[var(--on-surface-variant)] block">Company</span>
              <span className="font-semibold text-[var(--on-surface)] truncate block">{orgName}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <span className="text-[var(--on-surface-variant)] block">Department</span>
              <span className="font-semibold text-[var(--on-surface)] truncate block">{profile.department || "General"}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <span className="text-[var(--on-surface-variant)] block">Location</span>
              <span className="font-semibold text-[var(--on-surface)] truncate block">{profile.location || "Headquarters"}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
              <span className="text-[var(--on-surface-variant)] block">Manager</span>
              <span className="font-semibold text-[var(--on-surface)] truncate block">{managerName || "HR Department"}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-[var(--outline-variant)] bg-[var(--surface-container-low)] sm:col-span-2">
              <span className="text-[var(--on-surface-variant)] block">Official Email</span>
              <span className="font-semibold text-[var(--on-surface)] truncate block">{profile.email}</span>
            </div>
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="flex items-center gap-2 pt-6 mt-6 border-t overflow-x-auto text-xs font-mono" style={{ borderColor: "var(--outline-variant)" }}>
          <Link
            href="/employee/attendance"
            className="px-3 py-1.5 rounded-md border flex items-center gap-1.5 hover:border-[var(--primary)] transition-colors"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <span className="material-symbols-outlined text-sm">schedule</span>
            Attendance
          </Link>
          <Link
            href="/employee/leave"
            className="px-3 py-1.5 rounded-md border flex items-center gap-1.5 hover:border-[var(--primary)] transition-colors"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <span className="material-symbols-outlined text-sm">event_busy</span>
            Time Off
          </Link>
          <Link
            href="/employee/calendar"
            className="px-3 py-1.5 rounded-md border flex items-center gap-1.5 hover:border-[var(--primary)] transition-colors"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Calendar
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b gap-2 sm:gap-4 overflow-x-auto" style={{ borderColor: "var(--outline-variant)" }}>
        {[
          { key: "private", label: "Private Info", icon: "badge" },
          { key: "resume", label: "Resume & Documents", icon: "description" },
          { key: "salary", label: "Salary Info", icon: "payments" },
          { key: "security", label: "Security", icon: "lock" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className="flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-body-sm transition-all whitespace-nowrap cursor-pointer"
              style={{
                borderColor: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
              }}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-lg text-body-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg text-body-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {success}
        </div>
      )}

      {/* Tab 1: Private Info */}
      {activeTab === "private" && (
        <div className="space-y-6">
          {/* Personal Information */}
          <div
            className="border rounded-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: "var(--outline-variant)" }}>
              <div>
                <h2 className="text-title-md font-bold">Personal Identification</h2>
                <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                  Verified official and contact records
                </p>
              </div>
              <span className="material-symbols-outlined text-2xl text-[var(--primary)]">
                person_pin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-body-sm">
              <div>
                <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  Date of Birth
                </p>
                <p className="font-semibold">{profile.date_of_birth || "1994-05-18"}</p>
              </div>

              <div>
                <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  Nationality
                </p>
                <p className="font-semibold">{profile.nationality || "Indian"}</p>
              </div>

              <div>
                <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  Gender
                </p>
                <p className="font-semibold">{profile.gender || "Not Specified"}</p>
              </div>

              <div>
                <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  Personal Email
                </p>
                <p className="font-semibold truncate">{profile.email}</p>
              </div>

              <div>
                <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  Date of Joining
                </p>
                <p className="font-semibold">
                  {profile.date_of_joining
                    ? new Date(profile.date_of_joining + "T00:00:00").toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "2023-01-15"}
                </p>
              </div>

              <div>
                <p className="font-mono text-label-caps uppercase mb-1" style={{ color: "var(--on-surface-variant)" }}>
                  Marital Status
                </p>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="border rounded-lg px-2.5 py-1 text-body-sm focus:outline-none focus:ring-1"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Editable Contact Fields */}
            <form onSubmit={handleSaveContact} className="mt-6 pt-6 border-t space-y-4" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full border rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    style={{
                      background: "var(--surface-container-lowest)",
                      borderColor: "var(--outline-variant)",
                    }}
                  />
                </div>
                <div>
                  <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                    Residing Address
                  </label>
                  <input
                    type="text"
                    value={residingAddress}
                    onChange={(e) => setResidingAddress(e.target.value)}
                    placeholder="Street, City, State, PIN"
                    className="w-full border rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    style={{
                      background: "var(--surface-container-lowest)",
                      borderColor: "var(--outline-variant)",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-body-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                }}
              >
                {saving ? "Saving Changes…" : "Update Contact Info"}
              </button>
            </form>
          </div>

          {/* Bank & Compliance Details */}
          <div
            className="border rounded-2xl p-6 sm:p-8"
            style={{
              background: "var(--surface-container-lowest)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: "var(--outline-variant)" }}>
              <div>
                <h2 className="text-title-md font-bold">Bank & Compliance Details</h2>
                <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                  Statutory tax IDs and bank disbursement credentials
                </p>
              </div>
              <span className="material-symbols-outlined text-2xl text-[var(--secondary)]">
                account_balance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-body-sm">
              <div className="p-4 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}>
                <p className="font-mono text-label-caps uppercase mb-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  Bank Name
                </p>
                <p className="font-bold text-sm">{profile.bank_name || "HDFC Bank"}</p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}>
                <p className="font-mono text-label-caps uppercase mb-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  Account Number
                </p>
                <p className="font-mono font-bold text-sm tracking-wider">
                  {profile.bank_account_number || "50100489218492"}
                </p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}>
                <p className="font-mono text-label-caps uppercase mb-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  IFSC Code
                </p>
                <p className="font-mono font-bold text-sm">{profile.ifsc_code || "HDFC0001234"}</p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}>
                <p className="font-mono text-label-caps uppercase mb-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  PAN Card Number
                </p>
                <p className="font-mono font-bold text-sm">{profile.pan_no || "ABCDE1234F"}</p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}>
                <p className="font-mono text-label-caps uppercase mb-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  UAN Number (PF)
                </p>
                <p className="font-mono font-bold text-sm">{profile.uan_no || "101234567890"}</p>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}>
                <p className="font-mono text-label-caps uppercase mb-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  Employee Code
                </p>
                <p className="font-mono font-bold text-sm text-[var(--primary)]">{profile.employee_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Resume & Documents */}
      {activeTab === "resume" && (
        <div
          className="border rounded-2xl p-6 sm:p-8 space-y-6"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <div>
              <h2 className="text-title-md font-bold">Resume & Verified Documents</h2>
              <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                Uploaded certificates, identity proofs, and CV
              </p>
            </div>
            <span className="material-symbols-outlined text-2xl text-[var(--primary)]">
              folder
            </span>
          </div>

          {/* Document list */}
          {documents.length > 0 ? (
            <div className="divide-y border rounded-xl overflow-hidden" style={{ borderColor: "var(--outline-variant)" }}>
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--surface-container-low)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-2xl text-[var(--primary)]">
                      description
                    </span>
                    <div>
                      <p className="text-body-sm font-semibold">{doc.document_type}</p>
                      <p className="text-xs text-[var(--on-surface-variant)]">
                        Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("en-US") : "Recently"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDocument(doc)}
                    disabled={viewingDocId === doc.id}
                    className="px-3 py-1.5 text-body-sm font-semibold rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all cursor-pointer disabled:opacity-60"
                  >
                    {viewingDocId === doc.id ? "Loading…" : "View / Download"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed rounded-xl" style={{ borderColor: "var(--outline-variant)" }}>
              <span className="material-symbols-outlined text-4xl text-[var(--outline)] block mb-2">
                upload_file
              </span>
              <p className="text-body-sm font-semibold">No documents uploaded yet</p>
              <p className="text-xs text-[var(--on-surface-variant)]">Upload your resume or identification proof below.</p>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleDocumentUpload} className="p-4 rounded-xl border bg-[var(--surface-container-low)] space-y-4" style={{ borderColor: "var(--outline-variant)" }}>
            <h3 className="text-body-sm font-bold">Upload New Document</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase text-[var(--on-surface-variant)] mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-body-sm"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <option value="Resume">Resume / CV</option>
                  <option value="ID Proof">Government ID Proof</option>
                  <option value="Experience Certificate">Experience Certificate</option>
                  <option value="Degree / Marksheet">Degree / Marksheet</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-[var(--on-surface-variant)] mb-1">
                  Select File
                </label>
                <input
                  ref={docFileInputRef}
                  type="file"
                  required
                  className="w-full border rounded-lg px-3 py-1.5 text-body-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary)] file:text-white"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={uploadingDoc}
              className="px-4 py-2 rounded-lg text-body-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              {uploadingDoc ? "Uploading…" : "Upload Document"}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Salary Info (Restricted / Simplified Employee In-Hand View) */}
      {activeTab === "salary" && (
        <div
          className="border rounded-2xl p-6 sm:p-8 space-y-6"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <div>
              <h2 className="text-title-md font-bold">Salary & Payslip Overview</h2>
              <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                Restricted self-service view showing your current compensation breakdown and in-hand pay
              </p>
            </div>
            <span className="material-symbols-outlined text-2xl text-emerald-600 dark:text-emerald-400">
              payments
            </span>
          </div>

          {/* Monthly In-Hand Highlight Banner */}
          <div
            className="p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--primary-container) 0%, var(--surface-container-high) 100%)",
              borderColor: "var(--primary)",
            }}
          >
            <div>
              <p className="font-mono text-label-caps uppercase text-xs font-bold text-[var(--primary)]">
                Monthly In-Hand Net Salary
              </p>
              <h3 className="text-headline-xl font-bold font-mono text-[var(--on-primary-container)]">
                ₹{mNet.toLocaleString()}
                <span className="text-sm font-normal opacity-80"> / month</span>
              </h3>
              <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                Disbursed to {profile.bank_name || "Bank"} (A/C: ••••{profile.bank_account_number?.slice(-4) || "8492"})
              </p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-black/40 rounded-xl border border-[var(--outline-variant)]">
              <span className="text-xs font-mono block text-[var(--on-surface-variant)]">Effective Since</span>
              <span className="font-bold text-sm">
                {salary?.effective_from
                  ? new Date(salary.effective_from + "T00:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Current Contract"}
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Column */}
            <div className="border rounded-xl p-5" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="font-bold text-body-md text-emerald-600 dark:text-emerald-400">Earnings Components</span>
                <span className="font-mono font-bold text-sm">₹{mGross.toLocaleString()}</span>
              </div>
              <div className="space-y-3 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Basic Salary (50%)</span>
                  <span className="font-mono font-semibold">₹{mBasic.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">House Rent Allowance (HRA)</span>
                  <span className="font-mono font-semibold">₹{mHra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Standard Allowance</span>
                  <span className="font-mono font-semibold">₹{mStd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Performance Bonus</span>
                  <span className="font-mono font-semibold">₹{mBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Leave Travel Allowance (LTA)</span>
                  <span className="font-mono font-semibold">₹{mLta.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Fixed Allowance</span>
                  <span className="font-mono font-semibold">₹{mFixed.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border rounded-xl p-5" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="font-bold text-body-md text-red-600 dark:text-red-400">Statutory Deductions</span>
                <span className="font-mono font-bold text-sm">−₹{(mPf + mTax).toLocaleString()}</span>
              </div>
              <div className="space-y-3 text-body-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Provident Fund (Employee PF 12%)</span>
                  <span className="font-mono font-semibold text-red-600 dark:text-red-400">−₹{mPf.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--on-surface-variant)]">Professional Tax (PT)</span>
                  <span className="font-mono font-semibold text-red-600 dark:text-red-400">−₹{mTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t text-xs text-[var(--on-surface-variant)]" style={{ borderColor: "var(--outline-variant)" }}>
                  <span>Employer PF Match (Contributed directly to EPFO)</span>
                  <span className="font-mono">₹{mPf.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === "security" && (
        <div
          className="border rounded-2xl p-6 sm:p-8 space-y-6"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--outline-variant)" }}>
            <div>
              <h2 className="text-title-md font-bold">Account Security & Credentials</h2>
              <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                Update your account password and review login access
              </p>
            </div>
            <span className="material-symbols-outlined text-2xl text-[var(--primary)]">
              security
            </span>
          </div>

          {pwError && (
            <div className="p-3 rounded-lg text-body-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="p-3 rounded-lg text-body-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {pwSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border rounded-lg px-3.5 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              />
            </div>

            <div>
              <label className="block font-mono text-label-caps uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-variant)" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border rounded-lg px-3.5 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  background: "var(--surface-container-lowest)",
                  borderColor: "var(--outline-variant)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={changingPw}
              className="px-5 py-2.5 rounded-lg text-body-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{
                background: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              {changingPw ? "Updating Password…" : "Change Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
