"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function MobileSidebar({ role, branch }: { role: string; branch?: string | null }) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="text-zinc-600 dark:text-zinc-400">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle mobile menu</span>
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Overlay */}
                    <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setOpen(false)} />
                    
                    {/* Sidebar container */}
                    <div className="relative z-50 flex w-64 h-full bg-red-700 dark:bg-red-950 text-white flex-col shadow-xl animate-in slide-in-from-left-4 duration-200">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-4 right-[-48px] text-white hover:bg-white/20 hover:text-white" 
                            onClick={() => setOpen(false)}
                        >
                            <X className="h-6 w-6" />
                            <span className="sr-only">Close sidebar</span>
                        </Button>
                        <AdminSidebar role={role} branch={branch} className="flex w-full" />
                    </div>
                </div>
            )}
        </div>
    );
}
