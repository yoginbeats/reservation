import Link from "next/link";
import { LayoutDashboard, MapPin, Bus, Route, Calendar, Users, Ticket, BarChart3, ShieldCheck, Settings } from "lucide-react";
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
                            Superlines Admin
                        </p>
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>

                        <p className="mt-4 mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Master Data
                        </p>
                        <Link
                            href="/admin/terminals"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <MapPin className="h-4 w-4 text-blue-600" />
                            Terminals
                        </Link>
                        <Link
                            href="/admin/buses"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Bus className="h-4 w-4 text-emerald-600" />
                            Buses
                        </Link>
                        <Link
                            href="/admin/routes"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Route className="h-4 w-4 text-purple-600" />
                            Routes
                        </Link>
                        <Link
                            href="/admin/trips"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Calendar className="h-4 w-4 text-amber-600" />
                            Trips & Schedules
                        </Link>

                        <p className="mt-4 mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Operations & Users
                        </p>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Users className="h-4 w-4" />
                            Users & Roles
                        </Link>
                        <Link
                            href="/admin/reports"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <BarChart3 className="h-4 w-4 text-indigo-600" />
                            Reports
                        </Link>
                        <Link
                            href="/admin/logs"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <ShieldCheck className="h-4 w-4 text-rose-600" />
                            Audit Logs
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
