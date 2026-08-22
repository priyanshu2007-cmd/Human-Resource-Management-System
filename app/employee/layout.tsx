import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeShell } from "./employee-shell";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, employee_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/sign-up");

  const nameParts = profile.full_name.split(" ");
  const initials = (
    (nameParts[0]?.[0] || "") + (nameParts[nameParts.length - 1]?.[0] || "")
  ).toUpperCase();

  return (
    <EmployeeShell
      user={{
        name: profile.full_name,
        role: profile.role === "admin" ? "Admin" : "Employee",
        initials,
      }}
      isAdmin={profile.role === "admin"}
    >
      {children}
    </EmployeeShell>
  );
}
