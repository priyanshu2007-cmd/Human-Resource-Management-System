import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sjbyazwtokihprndebxh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYnlhend0b2tpaHBybmRlYnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjU2ODYsImV4cCI6MjEwMjk0MTY4Nn0.aghkqP3_r8M8jX7vQP2e0KmL_a30kUsajjeD2yXj6Zs",
  },
};

export default nextConfig;
