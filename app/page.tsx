import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let target = "/sign-in";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      target = profile?.role === "admin" ? "/admin/dashboard" : "/employee/dashboard";
    }
  } catch {
    target = "/sign-in";
  }

  redirect(target);
}
