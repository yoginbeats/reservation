import Link from "next/link";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bus, MapPin, User, LogOut, LayoutDashboard, Ticket, FileText } from "lucide-react";
import { ClientLogoutButton } from "@/components/client-logout-button";

export default async function TellerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role, terminal } = await getUserWithRoleAndTerminal();

    if (!user || (role !== 'TELLER' && role !== 'ADMIN')) {
        redirect("/login");
    }

    const tellerName = user.email?.split('@')[0] || "Teller";
    const termObj = Array.isArray(terminal) ? (terminal as any)[0] : (terminal as any);
    const terminalName = termObj?.name || "Terminal Counter";

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Teller Header */}
            <header className="sticky top-0 z-30 border-b bg-white dark:bg-zinc-900 shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link href="/teller" className="flex items-center gap-2">
                            <span className="rounded-lg bg-red-600 px-2.5 py-1 text-sm font-extrabold text-white">Superlines</span>
                            <span className="text-lg font-bold">Teller Terminal</span>
                        </Link>

                        {/* Assigned Terminal Badge */}
                        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Assigned Terminal: {terminalName}</span>
                        </div>
                    </div>

                    <nav className="flex items-center gap-4">
                        <Link href="/teller" className="flex items-center gap-1.5 text-sm font-medium hover:text-blue-600">
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Link>
                        <Link href="/teller/walk-in" className="flex items-center gap-1.5 text-sm font-medium hover:text-blue-600">
                            <Ticket className="h-4 w-4 text-emerald-600" />
                            <span className="font-bold text-emerald-600">New Walk-in Booking</span>
                        </Link>
                        <Link href="/teller/manifest" className="flex items-center gap-1.5 text-sm font-medium hover:text-blue-600">
                            <FileText className="h-4 w-4" />
                            <span className="hidden md:inline">Manifest</span>
                        </Link>

                        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700" />

                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">{tellerName}</span>
                        </div>
                        <ClientLogoutButton />
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-6">{children}</main>
        </div>
    );
}
