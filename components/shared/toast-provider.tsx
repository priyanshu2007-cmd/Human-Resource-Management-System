"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--surface-container-lowest)",
          color: "var(--on-surface)",
          border: "1px solid var(--outline-variant)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
        },
      }}
      closeButton
    />
  );
}
