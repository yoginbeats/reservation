import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminAuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("superlines_auth_session")?.value;
    const roleCookie = cookieStore.get("superlines_user_role")?.value;

    let role = roleCookie;
    if (sessionCookie) {
        try {
            const parsed = JSON.parse(sessionCookie);
            role = parsed.role || role;
        } catch {}
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If a user is already logged in, evaluate access
    if (user || sessionCookie) {
        const effectiveRole = (role || user?.user_metadata?.role || "PASSENGER").toUpperCase();
        
        // Strictly prevent passengers from opening or viewing admin login
        if (effectiveRole === "PASSENGER" || effectiveRole === "CLIENT") {
            redirect("/dashboard");
        } else if (effectiveRole === "ADMIN") {
            redirect("/admin");
        } else if (effectiveRole === "TELLER") {
            redirect("/teller/walk-in");
        } else if (effectiveRole === "CONDUCTOR") {
            redirect("/conductor");
        }
    }

    return <>{children}</>;
}
