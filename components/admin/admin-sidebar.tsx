"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Ticket, Users, Settings, MapPin, TrendingUp, Bus, Bell, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLogoutButton } from "@/components/admin-logout-button";

interface AdminSidebarProps {
    role: string;
    branch?: string | null;
    className?: string;
}

export function AdminSidebar({ role, branch, className }: AdminSidebarProps) {
    const pathname = usePathname();

    const isAdmin = role === 'admin';

    const links = [
        {
            title: "Dashboard",
            href: isAdmin ? "/admin" : `/admin/${branch?.toLowerCase()}`,
            icon: LayoutDashboard,
            visible: true
        },

        {
            title: "Trips",
            href: "/admin/trips",
            icon: MapPin,
            visible: isAdmin
        },
        {
            title: "Walk-in",
            href: "/admin/walk-in",
            icon: UserPlus,
            visible: true
        },
        {
            title: "Buses",
            href: "/admin/buses",
            icon: Bus,
            visible: isAdmin
        },
        {
            title: "Tickets",
            href: "/admin/tickets",
            icon: Ticket,
            visible: true
        },
        {
            title: "Users",
            href: "/admin/users",
            icon: Users,
            visible: isAdmin
        },
        {
            title: "Settings",
            href: "/admin/settings",
            icon: Settings,
            visible: isAdmin
        },
        {
            title: "Announcements",
            href: "/admin/announcements",
            icon: Bell,
            visible: isAdmin
        }
    ];

    return (
        <aside className={cn("w-64 border-r-0 bg-red-700 dark:bg-red-950 print:hidden text-white shadow-xl z-10 flex-shrink-0 flex-col", className)}>
            <div className="flex h-full flex-col print:hidden">
                <div className="flex items-center justify-center h-[72px] border-b border-red-600/50 dark:border-red-900/50 px-4 print:hidden">
                    <Link href="/admin" className="flex items-center gap-3 w-full justify-center">
                        <img src="/482809688_1079373070897719_6989867294877356725_n.jpg" alt="Logo" className="h-10 w-10 object-contain rounded-full bg-white p-0.5" />
                        <span className="text-xl font-black uppercase tracking-tighter text-white">
                            SUPERLINES
                        </span>
                    </Link>
                </div>
                <div className="flex-1 space-y-1 p-4 overflow-y-auto print:hidden">
                    <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-red-200 print:hidden">
                        {isAdmin ? "Main Admin" : `${branch} Admin`}
                    </p>
                    {links.filter(link => link.visible).map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-red-800 dark:hover:bg-red-900",
                                    isActive ? "bg-red-800 dark:bg-red-900 text-white shadow-sm" : "text-red-100 dark:text-red-200"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.title}
                            </Link>
                        );
                    })}
                </div>
                <div className="border-t border-red-600/50 dark:border-red-900/50 p-4">
                    {/* Logout button typically moved to topbar in bootstrap, but we can keep it here for fallback or remove it later if we fully rely on topbar */}
                    <AdminLogoutButton />
                </div>
            </div>
        </aside>
    );
}
