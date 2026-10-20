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
        redirect("/login");
    }

    const conductorName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Conductor";

    return (
        <div className="min-h-screen bg-zinc-900 text-zinc-100">
            {/* Conductor Header */}
            <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur shadow-sm">
                <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/conductor" className="flex items-center gap-2.5 group">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={32}
                            height={25}
                            className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                        <span className="text-base font-black uppercase tracking-tight text-red-500">Superlines</span>
                        <span className="text-sm font-semibold text-zinc-300">Conductor</span>
                    </Link>

                    <nav className="flex items-center gap-3 sm:gap-4">
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

                        <span className="hidden md:inline text-xs text-zinc-400 font-mono">{conductorName}</span>
                        <ClientLogoutButton />
                    </nav>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        </div>
    );
}
