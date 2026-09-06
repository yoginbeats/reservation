"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Calendar, User } from "lucide-react";

export function GlobalHeader() {
    const pathname = usePathname();

    // Hide header on admin, teller, and conductor routes as they have dedicated navigation bars
    if (
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/teller") ||
        pathname?.startsWith("/conductor")
    ) {
        return null;
    }

    return (
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur dark:bg-zinc-950/95">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2">
                    <span className="rounded-lg bg-red-600 px-2.5 py-1 text-sm font-black uppercase text-white tracking-wider">
                        Superlines
                    </span>
                    <span className="text-lg font-bold tracking-tight">Ticketing</span>
                </Link>

                <nav className="flex items-center gap-6">
                    <Link
                        href="/book"
                        className="text-sm font-semibold transition-colors hover:text-red-600 flex items-center gap-1.5"
                    >
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Book Trip
                    </Link>
                    <Link
                        href="/my-tickets"
                        className="text-sm font-semibold transition-colors hover:text-red-600 flex items-center gap-1.5"
                    >
                        <Ticket className="h-4 w-4 text-emerald-600" />
                        My Digital Tickets
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 shadow-md shadow-red-600/20"
                    >
                        Sign In / Register
                    </Link>
                </nav>
            </div>
        </header>
    );
}
