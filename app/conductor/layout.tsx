import Link from "next/link";
import Image from "next/image";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bus, QrCode, LayoutDashboard, User, FileText } from "lucide-react";
import { ClientLogoutButton } from "@/components/client-logout-button";

export default async function ConductorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, role } = await getUserWithRoleAndTerminal();

    if (!user || (role !== 'CONDUCTOR' && role !== 'ADMIN')) {
        redirect("/admin/login");
    }

    const conductorName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Conductor";

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-zinc-900 text-zinc-100">
            {/* Conductor Header */}
            <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur shadow-sm">
                <div className="w-full max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
                    <Link href="/conductor" className="flex items-center gap-2 group min-w-0">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={32}
                            height={25}
                            className="h-6 sm:h-7 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
                        />
                        <span className="text-sm sm:text-base font-black uppercase tracking-tight text-red-500 truncate">Superlines</span>
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 shrink-0">Conductor</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/conductor" className="flex items-center gap-1.5 text-xs font-semibold hover:text-red-400">
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Trips</span>
                        </Link>
                        <Link href="/conductor/manifest" className="flex items-center gap-1.5 text-xs font-semibold hover:text-red-400">
                            <FileText className="h-4 w-4" />
                            <span>Manifest</span>
                        </Link>
                        <Link href="/conductor/scan" className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/20">
                            <QrCode className="h-4 w-4" />
                            <span>QR Scanner</span>
                        </Link>

                        <div className="h-4 w-[1px] bg-zinc-800" />

                        <span className="text-xs text-zinc-400 font-mono">{conductorName}</span>
                        <ClientLogoutButton />
                    </nav>

                    {/* Mobile Logout */}
                    <div className="flex md:hidden items-center gap-2 shrink-0">
                        <ClientLogoutButton />
                    </div>
                </div>

                {/* Mobile Sub-Navigation Bar */}
                <nav className="grid grid-cols-3 gap-1.5 px-3 pb-2.5 md:hidden border-t border-zinc-800/80 pt-2">
                    <Link
                        href="/conductor"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 py-2 text-xs font-semibold text-zinc-200 hover:text-white"
                    >
                        <LayoutDashboard className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Trips</span>
                    </Link>
                    <Link
                        href="/conductor/manifest"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 py-2 text-xs font-semibold text-zinc-200 hover:text-white"
                    >
                        <FileText className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Manifest</span>
                    </Link>
                    <Link
                        href="/conductor/scan"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
                    >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>QR Scanner</span>
                    </Link>
                </nav>
            </header>

            <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">{children}</main>
        </div>
    );
}
