import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const password = (body.password || "").trim();

        if (!password) {
            return NextResponse.json(
                { success: false, error: "Please provide a new password." },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: "Password must be at least 6 characters long." },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data: { user }, error: userErr } = await supabase.auth.getUser();

        if (userErr || !user) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Your reset session has expired or is invalid. Please request a new password reset link from the forgot password page.",
                },
                { status: 401 }
            );
        }

        const { error: updateErr } = await supabase.auth.updateUser({
            password,
        });

        if (updateErr) {
            return NextResponse.json(
                { success: false, error: updateErr.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Your password has been successfully updated! You can now sign in with your new credentials.",
        });
    } catch (err: any) {
        console.error("Reset password error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to update password." },
            { status: 500 }
        );
    }
}
