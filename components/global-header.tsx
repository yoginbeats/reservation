"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User, Menu, X, Ticket, Calendar, Home, ShieldCheck } from "lucide-react";

export function GlobalHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (data.authenticated && data.user) {
                    setUser(data.user);
                    return;
                }
            } catch {}

            try {
                const { data } = await supabase.auth.getUser();
                setUser(data?.user || null);
            } catch {
                setUser(null);
            }
        };
        checkUser();
    }, [pathname]);

    // Automatically close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch {}
        try {
            await supabase.auth.signOut();
        } catch {}
        if (typeof document !== "undefined") {
            document.cookie = "superlines_auth_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            document.cookie = "superlines_user_role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            document.cookie = "superlines_user_terminal=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
        setUser(null);
        setMobileMenuOpen(false);
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

    const navLinks = [
        { href: "/", label: "Home", icon: Home, active: pathname === "/" },
        { href: "/book", label: "Search & Book", icon: Calendar, active: pathname?.startsWith("/book") },
        { href: "/my-tickets", label: "My Tickets", icon: Ticket, active: pathname?.startsWith("/my-tickets") },
        ...(user
            ? [{ href: "/dashboard", label: "My Account", icon: User, active: pathname?.startsWith("/dashboard") }]
            : []
        ),
    ];

    const username = user?.email ? user.email.split("@")[0] : "Passenger";

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-all">
            <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 gap-3 sm:gap-6">
                {/* Brand Logo */}
                <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
                    {/* Official Superlines Emblem */}
                    <div className="relative flex h-9 w-10 sm:h-10 sm:w-12 items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                        <Image
                            src="/superlines_emblem_transparent.png"
                            alt="Superlines Emblem"
                            width={48}
                            height={40}
                            className="h-full w-auto object-contain drop-shadow-sm"
                            priority
                        />
                    </div>
                    <span className="text-xl sm:text-2xl font-black uppercase tracking-tight text-red-600 transition-colors group-hover:text-red-700">
                        SUPERLINES
                    </span>
                </Link>

                {/* Desktop Navigation Links */}
                <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold shrink-0">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`transition-colors whitespace-nowrap py-1 relative ${
                                link.active
                                    ? "text-red-600 font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-red-600 after:rounded-full"
                                    : "text-zinc-700 hover:text-red-600"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Action Buttons & Mobile Toggle */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {user ? (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Link
                                href="/dashboard"
                                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-red-600 border border-zinc-200 px-3 py-1.5 sm:py-2 rounded-full hover:border-zinc-300 transition-colors max-w-[140px] truncate"
                                title={user.email}
                            >
                                {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                                    <img
                                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                                        alt={username}
                                        className="h-4 w-4 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <User className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                )}
                                <span className="truncate">{username}</span>
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="rounded-full bg-red-600 px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md flex items-center gap-1.5"
                                title="Sign out of your account"
                            >
                                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="hidden xs:inline sm:inline">Logout</span>
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="rounded-full bg-red-600 px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md flex items-center gap-1.5 sm:gap-2"
                        >
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                            <span>Sign In</span>
                        </Link>
                    )}

                    {/* Mobile Hamburger Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="flex lg:hidden items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-lg border border-zinc-200 text-zinc-700 hover:text-red-600 hover:bg-zinc-50 transition-colors"
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="lg:hidden border-t border-zinc-200 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
                    {user && (
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-xs">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold overflow-hidden shrink-0">
                                {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                                    <img
                                        src={user.user_metadata.avatar_url || user.user_metadata.picture}
                                        alt={username}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    username.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 truncate">
                                <p className="font-bold text-zinc-900 truncate">{username}</p>
                                <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <nav className="flex flex-col space-y-1">
                        {navLinks.map((link) => {
                            const IconComponent = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                        link.active
                                            ? "bg-red-50 text-red-600 font-bold"
                                            : "text-zinc-700 hover:bg-zinc-100 hover:text-red-600"
                                    }`}
                                >
                                    <IconComponent className={`h-4 w-4 ${link.active ? "text-red-600" : "text-zinc-400"}`} />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="pt-2 border-t border-zinc-100">
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-700 py-2.5 text-xs font-bold transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700 py-2.5 text-xs font-bold shadow transition-colors"
                            >
                                <User className="h-4 w-4" />
                                <span>Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
