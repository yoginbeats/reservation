"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GlobalHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data?.user || null);
            setIsLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    // Hide header on admin and auth routes to avoid redundancy and provide a clean UI
    if (pathname?.startsWith("/admin") || pathname === "/login" || pathname === "/register") {
        return null;
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-zinc-950/95">
            <div className="container mx-auto flex h-20 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-3">
                    <img
                        src="/482809688_1079373070897719_6989867294877356725_n.jpg"
                        alt="Logo"
                        className="h-12 w-12 object-contain"
                    />
                    <span className="text-2xl font-black uppercase tracking-tighter">
                        <span className="text-red-600">SUPER</span>
                        <span className="text-zinc-900 dark:text-zinc-50">LINES</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    <Link
                        href="/"
                        className={`text-sm font-semibold transition-colors hover:text-red-600 ${pathname === "/" ? "text-red-600" : "text-zinc-600 dark:text-zinc-400"}`}
                    >
                        Home
                    </Link>
                    <Link
                        href="/dashboard"
                        className={`text-sm font-semibold transition-colors hover:text-red-600 ${pathname === "/dashboard" ? "text-red-600" : "text-zinc-600 dark:text-zinc-400"}`}
                    >
                        Search & Book
                    </Link>
                    <Link
                        href="/schedule"
                        className={`text-sm font-semibold transition-colors hover:text-red-600 ${pathname === "/schedule" ? "text-red-600" : "text-zinc-600 dark:text-zinc-400"}`}
                    >
                        Trip Schedule
                    </Link>
                    <Link
                        href="/announcements"
                        className={`text-sm font-semibold transition-colors hover:text-red-600 ${pathname === "/announcements" ? "text-red-600" : "text-zinc-600 dark:text-zinc-400"}`}
                    >
                        Announcements
                    </Link>
                    <Link
                        href="/about"
                        className={`text-sm font-semibold transition-colors hover:text-red-600 ${pathname === "/about" ? "text-red-600" : "text-zinc-600 dark:text-zinc-400"}`}
                    >
                        About Us
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    {!isLoading && (
                        user ? (
                            <button
                                onClick={handleLogout}
                                className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg active:scale-95"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg active:scale-95"
                            >
                                Login
                            </Link>
                        )
                    )}
                </div>
            </div>
        </header>
    );
}
