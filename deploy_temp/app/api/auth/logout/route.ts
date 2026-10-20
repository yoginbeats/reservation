import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        try {
            const supabase = await createClient();
            await supabase.auth.signOut();
        } catch {}

        const response = NextResponse.json({ success: true, message: "Logged out successfully" });
        response.cookies.delete("superlines_auth_session");
        response.cookies.delete("superlines_user_role");
        response.cookies.delete("superlines_user_terminal");
        return response;
    } catch (err: any) {
        const response = NextResponse.json({ success: true });
        response.cookies.delete("superlines_auth_session");
        response.cookies.delete("superlines_user_role");
        response.cookies.delete("superlines_user_terminal");
        return response;
    }
}

export async function GET(req: NextRequest) {
    return POST(req);
}
