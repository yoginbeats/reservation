import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    try {
        // Try supabaseAdmin first
        let data: any = null;
        let error: any = null;

        try {
            const adminRes = await supabaseAdmin
                .from("announcements")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false });
            data = adminRes.data;
            error = adminRes.error;
        } catch (adminErr) {
            error = adminErr;
        }

        // Fallback to server supabase client if admin client had an issue
        if (error || !data) {
            try {
                const supabase = await createClient();
                const clientRes = await supabase
                    .from("announcements")
                    .select("*")
                    .eq("is_active", true)
                    .order("created_at", { ascending: false });
                if (!clientRes.error && clientRes.data) {
                    data = clientRes.data;
                    error = null;
                }
            } catch {}
        }

        if (error && !data) {
            return NextResponse.json(
                { success: false, error: error.message || "Failed to fetch announcements", data: [] },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, data: data || [] },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        );
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err?.message || "Unexpected error", data: [] },
            { status: 500 }
        );
    }
}
