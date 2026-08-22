"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/types/database.types";

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Tables<"holidays">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("holidays")
      .select("*")
      .order("date", { ascending: true });

    setHolidays(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !date) {
      setError("Name and date are required.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("holidays").insert({
      organization_id: profile.organization_id,
      name: name.trim(),
      date,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setName("");
    setDate("");
    setShowForm(false);
    setSubmitting(false);
    await fetchData();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("holidays").delete().eq("id", id);
    await fetchData();
    setDeletingId(null);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-lg font-semibold">Holidays</h1>
          <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
            Manage the organization&apos;s holiday calendar
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer"
          style={{
            background: "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New
        </button>
      </div>

      {/* New holiday form */}
      {showForm && (
        <div
          className="border rounded-lg p-6 mb-6"
          style={{
            background: "var(--surface-container-lowest)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <h2 className="text-title-md font-semibold mb-4">Add holiday</h2>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block font-mono text-label-caps uppercase tracking-widest mb-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Independence Day"
                  required
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
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2.5 text-body-md focus:outline-none focus:ring-1 transition-colors"
                  style={{
                    background: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer border"
                style={{
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface-variant)",
                }}
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 rounded text-body-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                style={{
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                }}
              >
                {submitting ? "Adding…" : "Add Holiday"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Holiday list */}
      <div
        className="border rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <h2 className="text-title-md font-semibold">
            {holidays.length} {holidays.length === 1 ? "holiday" : "holidays"}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              Loading…
            </p>
          </div>
        ) : holidays.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: "var(--primary)" }}
                  >
                    celebration
                  </span>
                  <div>
                    <p className="text-body-sm font-semibold">{h.name}</p>
                    <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
                      {formatDate(h.date)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(h.id)}
                  disabled={deletingId === h.id}
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-container-high)] disabled:opacity-60"
                  style={{ color: "var(--error)" }}
                  aria-label={`Delete ${h.name}`}
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-2 block"
              style={{ color: "var(--outline-variant)" }}
            >
              celebration
            </span>
            <p className="text-body-sm" style={{ color: "var(--on-surface-variant)" }}>
              No holidays yet. Click &quot;New&quot; to add one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
