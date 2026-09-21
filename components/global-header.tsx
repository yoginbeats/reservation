"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, Calendar, Bus, LayoutDashboard, LogIn } from "lucide-react";

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
        <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md shadow-red-600/30 transition-transform group-hover:scale-105">
                        <Bus className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black uppercase tracking-wider text-red-600 leading-none">
                            Superlines
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 leading-none mt-1">
                            Transportation Co. Inc.
                        </span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="flex items-center gap-1 sm:gap-6">
                    <Link
                        href="/"
                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                            pathname === "/"
                                ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold"
                                : "text-zinc-600 hover:text-red-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                    >
                        Home
                    </Link>

                    <Link
                        href="/book"
                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                            pathname?.startsWith("/book")
                                ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold"
                                : "text-zinc-600 hover:text-red-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                    >
                        <Calendar className="h-4 w-4 text-red-600" />
                        <span>Book Trip</span>
                    </Link>

                    <Link
                        href="/my-tickets"
                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                            pathname?.startsWith("/my-tickets")
                                ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold"
                                : "text-zinc-600 hover:text-red-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                    >
                        <Ticket className="h-4 w-4 text-red-600" />
                        <span className="hidden sm:inline">My Digital Tickets</span>
                        <span className="sm:hidden">My Tickets</span>
                    </Link>

                    <Link
                        href="/dashboard"
                        className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                            pathname?.startsWith("/dashboard")
                                ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold"
                                : "text-zinc-600 hover:text-red-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        }`}
                    >
                        <LayoutDashboard className="h-4 w-4 text-red-600" />
                        <span className="hidden md:inline">Dashboard</span>
                    </Link>

                    <Link
                        href="/login"
                        className="ml-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-red-600/25 transition-all hover:brightness-110 hover:shadow-lg hover:shadow-red-600/35 flex items-center gap-2"
                    >
                        <LogIn className="h-4 w-4" />
                        <span>Sign In</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
