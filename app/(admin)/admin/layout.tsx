import Link from "next/link";
import { LayoutDashboard, CalendarCheck, Ticket, Users, Settings, MapPin, TrendingUp } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-zinc-50 dark:bg-zinc-900">
                <div className="flex h-full flex-col">
                    <div className="flex-1 space-y-1 p-4">
                        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Admin Panel
                        </p>
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/reservations"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <CalendarCheck className="h-4 w-4" />
                            Reservations
                        </Link>
                        <Link
                            href="/admin/trips"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <MapPin className="h-4 w-4" />
                            Trips
                        </Link>
                        <Link
                            href="/admin/tickets"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Ticket className="h-4 w-4" />
                            Tickets
                        </Link>
                        <Link
                            href="/admin/sales"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Sales
                        </Link>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Users className="h-4 w-4" />
                            Users
                        </Link>
                        <Link
                            href="/admin/settings"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                    </div>
                    <div className="border-t p-4">
                        <AdminLogoutButton />
                    </div>
                </div>
            </aside>
            {/* Main Content */}
            <div className="flex-1 p-8">{children}</div>
        </div>
    );
}
