import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if user exists in auth
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const user = usersData?.users?.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "User not found in demo roster" }, { status: 404 });
    }

    // Set a known demo password or generate link
    const demoPassword = "DemoPassword123!";
    await adminClient.auth.admin.updateUserById(user.id, {
      password: demoPassword,
      email_confirm: true,
    });

    // Also ensure must_change_password is false for demo switching
    await adminClient
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id);

    // Sign in using server client to set cookies
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: demoPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 500 });
    }

    // Fetch profile to know role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      role: profile?.role || "employee",
      redirectUrl: profile?.role === "admin" ? "/admin/dashboard" : "/employee/dashboard",
    });
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
