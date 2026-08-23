import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, employee_id, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/employee/dashboard");
  }

  const nameParts = (profile.full_name || "Admin").split(" ");
  const initials = (
    (nameParts[0]?.[0] || "") + (nameParts[nameParts.length - 1]?.[0] || "")
  ).toUpperCase() || "AD";

  return (
    <AdminShell
      user={{
        name: profile.full_name || "Admin",
        role: "Admin",
        initials,
      }}
    >
      {children}
    </AdminShell>
  );
}
