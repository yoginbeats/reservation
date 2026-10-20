import { NextRequest, NextResponse } from "next/server";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const { user, role, terminal } = await getUserWithRoleAndTerminal();
        if (!user) {
            return NextResponse.json({ authenticated: false, user: null, role: null });
        }
        return NextResponse.json({
            authenticated: true,
            user,
            role,
            terminal,
        });
    } catch (err: any) {
        return NextResponse.json({ authenticated: false, error: err?.message });
    }
}
