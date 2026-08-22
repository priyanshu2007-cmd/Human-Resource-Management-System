import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

/**
 * POST /api/admin/employees
 *
 * Service-role Route Handler for employee creation.
 * - Validates the caller is an admin
 * - Creates an auth user with a generated temporary password
 * - Inserts a profiles row with the auto-generated Login ID
 * - Returns the Login ID and temporary password for the admin to share
 */
export async function POST(request: Request) {
  try {
    // 1. Verify the caller is an authenticated admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create employees" },
        { status: 403 }
      );
    }

    // 2. Parse the request body
    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      job_title,
      department,
      date_of_joining,
      role = "employee",
    } = body as {
      full_name: string;
      email: string;
      phone?: string;
      job_title?: string;
      department?: string;
      date_of_joining?: string;
      role?: "admin" | "employee";
    };

    if (!full_name || !email) {
      return NextResponse.json(
        { error: "full_name and email are required" },
        { status: 400 }
      );
    }

    // 3. Generate a one-time password
    const tempPassword = generateTempPassword();

    // 4. Generate the Login ID using the SQL function
    const orgId = adminProfile.organization_id;
    const nameParts = full_name.trim().split(/\s+/);
    const firstName = nameParts[0] || "XX";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "XX";
    const joiningYear = date_of_joining
      ? new Date(date_of_joining).getFullYear()
      : new Date().getFullYear();

    const { data: loginIdResult, error: loginIdError } = await supabase.rpc(
      "generate_login_id",
      {
        p_org_id: orgId,
        p_first_name: firstName,
        p_last_name: lastName,
        p_joining_year: joiningYear,
      }
    );

    if (loginIdError) {
      return NextResponse.json(
        { error: "Failed to generate Login ID: " + loginIdError.message },
        { status: 500 }
      );
    }

    const employeeId = loginIdResult as string;

    // 5. Create the auth user using the service-role client
    const adminClient = createAdminClient();

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Skip email confirmation for admin-created users
        user_metadata: {
          full_name,
          employee_id: employeeId,
        },
      });

    if (createError) {
      return NextResponse.json(
        { error: "Failed to create auth user: " + createError.message },
        { status: 500 }
      );
    }

    // 6. Insert the profiles row
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: newUser.user.id,
        organization_id: orgId,
        employee_id: employeeId,
        full_name,
        email,
        role,
        phone: phone || null,
        job_title: job_title || null,
        department: department || null,
        date_of_joining: date_of_joining || null,
        must_change_password: true,
      });

    if (profileError) {
      // Clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 }
      );
    }

    // 7. Return the Login ID and temp password for the admin to share
    return NextResponse.json({
      employee_id: employeeId,
      temp_password: tempPassword,
      full_name,
      email,
      message: `Employee created. Share the Login ID (${employeeId}) and temporary password with the employee.`,
    });
  } catch (err) {
    console.error("Employee creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generates a readable temporary password.
 * Format: Df-XXXX-XXXX (12 chars, meets complexity requirements)
 */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  let pw = "Df-";
  for (let i = 0; i < 8; i++) {
    pw += chars[bytes[i] % chars.length];
    if (i === 3) pw += "-";
  }
  return pw;
}
