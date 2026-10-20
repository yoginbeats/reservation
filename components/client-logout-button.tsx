"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ClientLogoutButton() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            try {
                await fetch("/api/auth/logout", { method: "POST" });
            } catch {}
            try {
                await supabase.auth.signOut();
            } catch {}
            // Explicitly delete cookies on document
            if (typeof document !== "undefined") {
                document.cookie = "superlines_auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                document.cookie = "superlines_user_role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                document.cookie = "superlines_user_terminal=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            }
            router.refresh();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
            router.push("/login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
        >
            <LogOut className="h-4 w-4" />
            {isLoading ? "Logging out..." : "Logout"}
        </Button>
    );
}
