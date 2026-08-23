import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "./admin-shell";
import { unstable_cache } from "next/cache";

async function getAdminProfile(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, employee_id, organization_id")
    .eq("id", userId)
    .single();
  return profile;
}

const getCachedAdminProfile = unstable_cache(
  getAdminProfile,
  ["admin-profile"],
  { revalidate: 60, tags: ["admin-profile"] }
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const profile = await getCachedAdminProfile(user.id);

  if (!profile || profile.role !== "admin") redirect("/employee/dashboard");

  const nameParts = profile.full_name.split(" ");
  const initials = (
    (nameParts[0]?.[0] || "") + (nameParts[nameParts.length - 1]?.[0] || "")
  ).toUpperCase();

  return (
    <AdminShell
      user={{
        name: profile.full_name,
        role: "Admin",
        initials,
      }}
    >
      {children}
    </AdminShell>
  );
}
