import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, MapPin, Bus, Route, Calendar, Users, Ticket, BarChart3, ShieldCheck, Settings, Megaphone, CalendarCheck, Zap } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
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

    if (!user && !sessionCookie) {
        redirect("/admin/login");
    }

    const effectiveRole = (role || user?.user_metadata?.role || "PASSENGER").toUpperCase();
    if (effectiveRole !== "ADMIN") {
        // Passengers and non-admin users must NEVER be able to open the admin portal
        redirect("/dashboard");
    }

    return (
        <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-950/95 shrink-0 sticky top-0 h-screen overflow-y-auto z-30">
                <div className="flex h-full flex-col">
                    <div className="flex-1 space-y-1 p-4">
                        <Link href="/admin" className="flex items-center gap-2.5 px-2 mb-4 group">
                            <Image
                                src="/superlines_emblem_transparent.png"
                                alt="Superlines Emblem"
                                width={32}
                                height={26}
                                className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                            <div>
                                <span className="text-sm font-black uppercase tracking-tight text-red-600 block leading-tight">Superlines</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Admin Portal</span>
                            </div>
                        </Link>
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>

                        <p className="mt-4 mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Master Data & CMS
                        </p>
                        <Link
                            href="/admin/announcements"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Megaphone className="h-4 w-4 text-red-600" />
                            Announcements
                        </Link>
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
                            Bookings & Operations
                        </p>
                        <Link
                            href="/admin/reservations"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <CalendarCheck className="h-4 w-4 text-emerald-600" />
                            Reservations
                        </Link>
                        <Link
                            href="/admin/tickets"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        >
                            <Ticket className="h-4 w-4 text-amber-600" />
                            Tickets
                        </Link>
                        <Link
                            href="/teller/walk-in"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 text-emerald-700 dark:text-emerald-400 font-semibold"
                        >
                            <Zap className="h-4 w-4 text-emerald-600" />
                            Counter Walk-In POS
                        </Link>
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
            <main className="flex-1 min-w-0 p-6 sm:p-8 max-w-full overflow-x-hidden">{children}</main>
        </div>
    );
}
