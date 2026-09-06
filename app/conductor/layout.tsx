import Link from "next/link";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bus, QrCode, LayoutDashboard, User } from "lucide-react";
import { ClientLogoutButton } from "@/components/client-logout-button";

export default async function ConductorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role } = await getUserWithRoleAndTerminal();

    if (!user || (role !== 'CONDUCTOR' && role !== 'ADMIN')) {
        redirect("/login");
    }

    const conductorName = user.email?.split('@')[0] || "Conductor";

    return (
        <div className="min-h-screen bg-zinc-900 text-zinc-100">
            {/* Conductor Header */}
            <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/conductor" className="flex items-center gap-2">
                        <span className="rounded-lg bg-red-600 px-2 py-1 text-xs font-black uppercase text-white">Superlines</span>
                        <span className="text-base font-bold">Conductor Verification</span>
                    </Link>

                    <nav className="flex items-center gap-4">
                        <Link href="/conductor" className="flex items-center gap-1.5 text-xs font-semibold hover:text-red-400">
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="hidden sm:inline">Trips</span>
                        </Link>
                        <Link href="/conductor/scan" className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/20">
                            <QrCode className="h-4 w-4" />
                            <span>QR Scanner</span>
                        </Link>

                        <div className="h-4 w-[1px] bg-zinc-800" />

                        <span className="hidden md:inline text-xs text-zinc-400 font-mono">{conductorName}</span>
                        <ClientLogoutButton />
                    </nav>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6">{children}</main>
        </div>
    );
}
