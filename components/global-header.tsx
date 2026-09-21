"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";

export function GlobalHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data?.user || null);
        };
        checkUser();
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/login");
        router.refresh();
    };

    // Hide header on admin, teller, and conductor routes as they have dedicated navigation bars
    if (
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/teller") ||
        pathname?.startsWith("/conductor")
    ) {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
            <div className="container mx-auto flex h-20 items-center justify-between px-6">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {/* Official Superlines Emblem */}
                        <div className="flex h-10 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 via-red-600 to-blue-700 p-0.5 shadow-md">
                            <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-zinc-900 font-black italic text-amber-400 text-lg tracking-tighter">
                                S
                            </div>
                        </div>
                        <span className="text-2xl font-black uppercase tracking-tight text-red-600">
                            SUPERLINES
                        </span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
                    <Link
                        href="/"
                        className={`transition-colors ${
                            pathname === "/" ? "text-red-600 font-bold" : "text-zinc-700 hover:text-red-600"
                        }`}
                    >
                        Home
                    </Link>

                    <Link
                        href="/book"
                        className={`transition-colors ${
                            pathname?.startsWith("/book") ? "text-red-600 font-bold" : "text-zinc-700 hover:text-red-600"
                        }`}
                    >
                        Search & Book
                    </Link>

                    <Link
                        href="/my-tickets"
                        className={`transition-colors ${
                            pathname?.startsWith("/my-tickets") ? "text-red-600 font-bold" : "text-zinc-700 hover:text-red-600"
                        }`}
                    >
                        Trip Schedule
                    </Link>

                    <Link
                        href="/dashboard"
                        className={`transition-colors ${
                            pathname?.startsWith("/dashboard") ? "text-red-600 font-bold" : "text-zinc-700 hover:text-red-600"
                        }`}
                    >
                        About Us
                    </Link>
                </nav>

                {/* Action Button */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg flex items-center gap-2"
                        >
                            <User className="h-4 w-4" />
                            <span>Sign In</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
