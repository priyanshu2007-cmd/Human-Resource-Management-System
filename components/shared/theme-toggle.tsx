"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dayflow-theme";

/**
 * Minimal no-dependency dark/light toggle. Reads/writes a `.dark` class on
 * `<html>` and persists the choice in localStorage. The actual "no flash of
 * wrong theme on load" work happens in app/layout.tsx via a blocking inline
 * script that runs before paint — this component only handles the toggle
 * interaction and keeping its own icon in sync after mount.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // localStorage unavailable (e.g. private browsing) — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-container-high)]",
        className,
      )}
      style={{ color: "var(--on-surface-variant)" }}
    >
      <span className="material-symbols-outlined text-xl">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
