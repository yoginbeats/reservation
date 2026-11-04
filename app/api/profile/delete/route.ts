import { NextRequest, NextResponse } from "next/server";
import { createClient, getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user via unified session
        const sessionResult = await getUserWithRoleAndTerminal();
        let user: any = sessionResult.user;
        const role = sessionResult.role;

        // Fallback for body userId verification if session is in headers
        if (!user) {
            try {
                const body = await req.json();
                if (body?.userId) {
                    const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(body.userId);
                    if (adminUser?.user) {
                        user = adminUser.user;
                    }
                }
            } catch {}
        }

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Please log in first." },
                { status: 401 }
            );
        }

        // Safety: Do not allow deletion of primary Administrator accounts via passenger portal
        if (role === "ADMIN") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Administrator accounts cannot be deleted through the passenger portal. Please contact the system administrator.",
                },
                { status: 403 }
            );
        }

        const userId = user.id;

        // 2. Anonymize/clean up dependent relational records to maintain audit integrity & avoid FK conflicts
        try {
            await supabaseAdmin
                .from("reservations")
                .update({ customer_id: null })
                .eq("customer_id", userId);
        } catch (e) {
            console.warn("Notice: reservations cleanup:", e);
        }

        try {
            await supabaseAdmin
                .from("bookings")
                .update({ passenger_id: null })
                .eq("passenger_id", userId);

            await supabaseAdmin
                .from("bookings")
                .update({ created_by: null })
                .eq("created_by", userId);
        } catch (e) {
            console.warn("Notice: bookings cleanup:", e);
        }

        try {
            await supabaseAdmin
                .from("audit_logs")
                .update({ user_id: null })
                .eq("user_id", userId);
        } catch (e) {
            console.warn("Notice: audit_logs cleanup:", e);
        }

        // 3. Delete user's profile record
        try {
            await supabaseAdmin
                .from("profiles")
                .delete()
                .eq("id", userId);
        } catch (e) {
            console.warn("Notice: profiles delete:", e);
        }

        // 4. Delete user's role record
        try {
            await supabaseAdmin
                .from("user_roles")
                .delete()
                .eq("user_id", userId);
        } catch (e) {
            console.warn("Notice: user_roles delete:", e);
        }

        // 5. Delete Supabase Auth account permanently
        try {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteAuthError) {
                console.error("Supabase Admin deleteUser error:", deleteAuthError);
            }
        } catch (authErr) {
            console.error("Auth delete exception:", authErr);
        }

        // 6. Sign out current session
        try {
            const supabase = await createClient();
            await supabase.auth.signOut();
        } catch {}

        // 7. Clear all session and authentication cookies
        const response = NextResponse.json({
            success: true,
            message: "Passenger account has been permanently deleted.",
        });

        response.cookies.delete("superlines_auth_session");
        response.cookies.delete("superlines_user_role");
        response.cookies.delete("superlines_user_terminal");

        return response;
    } catch (err: any) {
        console.error("Account delete server error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "An unexpected error occurred while deleting your account." },
            { status: 500 }
        );
    }
}
