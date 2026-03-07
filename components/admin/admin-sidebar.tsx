"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarCheck, Ticket, Users, Settings, MapPin, TrendingUp, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLogoutButton } from "@/components/admin-logout-button";

interface AdminSidebarProps {
    role: string;
    branch?: string | null;
}

export function AdminSidebar({ role, branch }: AdminSidebarProps) {
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
            title: "Reservations",
            href: "/admin/reservations",
            icon: CalendarCheck,
            visible: true
        },
        {
            title: "Trips",
            href: "/admin/trips",
            icon: MapPin,
            visible: isAdmin
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
            title: "Sales",
            href: "/admin/sales",
            icon: TrendingUp,
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
        }
    ];

    return (
        <aside className="w-64 border-r bg-zinc-50 dark:bg-zinc-900 print:hidden">
            <div className="flex h-full flex-col">
                <div className="flex-1 space-y-1 p-4">
                    <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
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
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800",
                                    isActive ? "bg-zinc-200 dark:bg-zinc-800 text-blue-600" : "text-zinc-600 dark:text-zinc-400"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {link.title}
                            </Link>
                        );
                    })}
                </div>
                <div className="border-t p-4">
                    <AdminLogoutButton />
                </div>
            </div>
        </aside>
    );
}
