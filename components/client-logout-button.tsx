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
            await supabase.auth.signOut();
            router.refresh(); // Refresh to clear server session state
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error);
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
