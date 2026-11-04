import { NextRequest, NextResponse } from "next/server";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SYSTEM_CREDENTIALS } from "@/lib/constants/credentials";

// GET /api/admin/staff - Fetch all staff accounts (Admin, Teller, Conductor)
export async function GET(req: NextRequest) {
    try {
        const { user, role } = await getUserWithRoleAndTerminal();

        // Security check: Only Main Admin has permission to view and manage staff accounts
        if (!user || role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Access Denied: Only authorized Administrators can view staff rosters." },
                { status: 403 }
            );
        }

        // 1. Start with developer-seeded official staff accounts
        const staffList: any[] = SYSTEM_CREDENTIALS.map(sc => ({
            id: sc.id,
            email: sc.email,
            full_name: sc.name,
            role: sc.role,
            terminal_name: sc.terminal?.name || (sc.role === "ADMIN" ? "Headquarters" : "Unassigned"),
            provisioned_by: sc.role === "ADMIN" ? "System Developers" : "Superlines Administration",
            source: "SYSTEM_SEEDED",
            created_at: "2026-01-01T00:00:00.000Z",
            status: "ACTIVE",
        }));

        // 2. Fetch database provisioned staff from Supabase user_roles and profiles
        try {
            const { data: dbRoles, error: rolesError } = await supabaseAdmin
                .from("user_roles")
                .select("user_id, role, created_at")
                .in("role", ["ADMIN", "TELLER", "CONDUCTOR"]);

            if (!rolesError && dbRoles && dbRoles.length > 0) {
                const userIds = dbRoles.map(r => r.user_id);
                const { data: dbProfiles } = await supabaseAdmin
                    .from("profiles")
                    .select("id, email, full_name, first_name, last_name, terminal_name, created_at")
                    .in("id", userIds);

                const profileMap = new Map((dbProfiles || []).map(p => [p.id, p]));

                for (const r of dbRoles) {
                    const prof: any = profileMap.get(r.user_id);
                    const email = prof?.email || "staff@superlines.com";
                    
                    // Avoid duplicating system seeded accounts
                    const alreadyPresent = staffList.some(s => s.email.toLowerCase() === email.toLowerCase());
                    if (!alreadyPresent) {
                        staffList.push({
                            id: r.user_id,
                            email,
                            full_name: prof?.full_name || `${prof?.first_name || ''} ${prof?.last_name || ''}`.trim() || "Staff Member",
                            role: r.role,
                            terminal_name: prof?.terminal_name || "Assigned by Admin",
                            provisioned_by: r.role === "ADMIN" ? "System Developers" : "Superlines Administration",
                            source: "DATABASE",
                            created_at: prof?.created_at || r.created_at || new Date().toISOString(),
                            status: "ACTIVE",
                        });
                    }
                }
            }
        } catch (dbErr) {
            console.warn("Notice: could not query supabase db roles:", dbErr);
        }

        return NextResponse.json({
            success: true,
            staff: staffList,
        });
    } catch (err: any) {
        console.error("Staff list fetch error:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to fetch staff accounts." },
            { status: 500 }
        );
    }
}

// POST /api/admin/staff - Provision new staff credentials (Teller or Conductor)
export async function POST(req: NextRequest) {
    try {
        const { user, role } = await getUserWithRoleAndTerminal();

        // 🔒 STRICT SECURITY CHECK: Only Main Admin can provision staff accounts
        if (!user || role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Access Denied: Only Main Admin can issue operational staff credentials." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const firstName = (body.firstName || "").trim();
        const lastName = (body.lastName || "").trim();
        const email = (body.email || "").trim().toLowerCase();
        const password = (body.password || "").trim();
        const targetRole = (body.role || "").trim().toUpperCase();
        const terminal = (body.terminal || "Cubao Central Terminal").trim();

        if (!firstName || !lastName) {
            return NextResponse.json(
                { success: false, error: "Please enter the employee's first and last name." },
                { status: 400 }
            );
        }

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { success: false, error: "Please provide a valid work email address for the staff member." },
                { status: 400 }
            );
        }

        if (!password || password.length < 6) {
            return NextResponse.json(
                { success: false, error: "Initial password must be at least 6 characters long." },
                { status: 400 }
            );
        }

        // 🔒 DEVELOPER PRIVILEGE ENFORCEMENT:
        // Admin can ONLY create TELLER or CONDUCTOR accounts.
        // Admin credentials must be provisioned solely by system developers.
        if (targetRole !== "TELLER" && targetRole !== "CONDUCTOR") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Restricted: Administrators can only issue credentials for Tellers and Conductors. Administrator accounts are provisioned exclusively by System Developers.",
                },
                { status: 403 }
            );
        }

        const fullName = `${firstName} ${lastName}`;

        // 1. Create User via Supabase Admin Auth API
        const { data: createdAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                full_name: fullName,
                role: targetRole,
                terminal_name: terminal,
                provisioned_by_admin_id: user.id,
                provisioned_at: new Date().toISOString(),
                profile_completed: true,
            },
        });

        if (authError) {
            if (authError.message?.toLowerCase().includes("already registered") || authError.message?.toLowerCase().includes("exists")) {
                return NextResponse.json(
                    { success: false, error: `The email ${email} is already in use by another account.` },
                    { status: 400 }
                );
            }
            throw authError;
        }

        const newUserId = createdAuth.user.id;

        // 2. Insert into profiles table
        try {
            await supabaseAdmin.from("profiles").upsert({
                id: newUserId,
                email,
                first_name: firstName,
                last_name: lastName,
                full_name: fullName,
                role: targetRole,
                terminal_name: terminal,
                profile_completed: true,
                updated_at: new Date().toISOString(),
            });
        } catch (pErr) {
            console.warn("Notice: profile record upsert:", pErr);
        }

        // 3. Insert into user_roles table
        try {
            await supabaseAdmin.from("user_roles").upsert({
                user_id: newUserId,
                role: targetRole,
            });
        } catch (rErr) {
            console.warn("Notice: user_roles record upsert:", rErr);
        }

        return NextResponse.json({
            success: true,
            message: `Official ${targetRole} credentials created successfully for ${fullName}!`,
            staff: {
                id: newUserId,
                full_name: fullName,
                email,
                role: targetRole,
                terminal_name: terminal,
                temporary_password: password,
                provisioned_by: "Superlines Administration",
                created_at: new Date().toISOString(),
            },
        });
    } catch (err: any) {
        console.error("Staff account provisioning error:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to create staff credentials." },
            { status: 500 }
        );
    }
}
