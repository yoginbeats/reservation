"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User, Menu, X, Ticket, Calendar, Home, ShieldCheck, Clock } from "lucide-react";

export function GlobalHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profileData, setProfileData] = useState<{ first_name?: string; full_name?: string; avatar_url?: string } | null>(null);
    const [localAvatar, setLocalAvatar] = useState<string | null>(null);
    const [localFirstName, setLocalFirstName] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const supabase = createClient();

    const checkUser = async () => {
        let currentUser: any = null;
        try {
            const res = await fetch("/api/auth/session");
            const data = await res.json();
            if (data.authenticated && data.user) {
                currentUser = data.user;
            }
        } catch {}

        if (!currentUser) {
            try {
                const { data } = await supabase.auth.getUser();
                currentUser = data?.user || null;
            } catch {
                currentUser = null;
            }
        }

        setUser(currentUser);

        if (currentUser) {
            // Check localStorage first for instant client cache
            if (typeof window !== "undefined") {
                const storedAvatar = localStorage.getItem(`superlines_avatar_${currentUser.id}`);
                if (storedAvatar) setLocalAvatar(storedAvatar);
                const storedName = localStorage.getItem(`superlines_first_name_${currentUser.id}`);
                if (storedName) setLocalFirstName(storedName);
            }

            // Query Supabase profiles table for latest DB values
            try {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("first_name, full_name, avatar_url")
                    .eq("id", currentUser.id)
                    .maybeSingle();

                if (profile) {
                    setProfileData(profile);
                    if (profile.avatar_url && !localAvatar) {
                        setLocalAvatar(profile.avatar_url);
                    }
                    if (profile.first_name && !localFirstName) {
                        setLocalFirstName(profile.first_name);
                    }
                }
            } catch (err) {
                console.warn("Could not fetch header profile:", err);
            }
        } else {
            setProfileData(null);
            setLocalAvatar(null);
            setLocalFirstName(null);
        }
    };

    useEffect(() => {
        checkUser();
    }, [pathname]);

    // Real-time synchronization when profile or avatar is updated
    useEffect(() => {
        const handleProfileUpdated = (e: any) => {
            if (e?.detail?.avatarUrl) setLocalAvatar(e.detail.avatarUrl);
            if (e?.detail?.firstName) setLocalFirstName(e.detail.firstName);
            if (user?.id && typeof window !== "undefined") {
                const storedAvatar = localStorage.getItem(`superlines_avatar_${user.id}`);
                if (storedAvatar) setLocalAvatar(storedAvatar);
                const storedName = localStorage.getItem(`superlines_first_name_${user.id}`);
                if (storedName) setLocalFirstName(storedName);
            }
        };

        window.addEventListener("superlines_profile_updated", handleProfileUpdated);
        return () => window.removeEventListener("superlines_profile_updated", handleProfileUpdated);
    }, [user?.id]);

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
        setProfileData(null);
        setLocalAvatar(null);
        setLocalFirstName(null);
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
        { href: "/schedules", label: "Daily Schedules", icon: Clock, active: pathname === "/schedules" },
        { href: "/my-tickets", label: "My Tickets", icon: Ticket, active: pathname?.startsWith("/my-tickets") },
        ...(user
            ? [{ href: "/dashboard", label: "My Account", icon: User, active: pathname?.startsWith("/dashboard") }]
            : []
        ),
    ];

    // Compute display First Name (instead of email username)
    const meta = user?.user_metadata || {};
    const firstName = 
        localFirstName ||
        profileData?.first_name ||
        meta.first_name ||
        meta.given_name ||
        (profileData?.full_name ? profileData.full_name.trim().split(" ")[0] : null) ||
        (meta.full_name ? meta.full_name.trim().split(" ")[0] : null) ||
        (meta.name ? meta.name.trim().split(" ")[0] : null) ||
        (user?.email ? user.email.split("@")[0] : "Passenger");

    // Compute display Avatar URL
    const avatarUrl =
        localAvatar ||
        profileData?.avatar_url ||
        meta.avatar_url ||
        meta.picture ||
        null;

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-all">
            <div className="w-full max-w-7xl mx-auto flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 sm:gap-6">
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
                            {/* Profile Pill Button: Displays First Name & Profile Picture */}
                            <Link
                                href="/dashboard"
                                className="hidden md:flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-red-600 border border-zinc-200 px-3 py-1.5 sm:py-2 rounded-full hover:border-zinc-300 hover:bg-zinc-50 transition-all max-w-[170px]"
                                title={user.email}
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={firstName}
                                        className="h-5 w-5 rounded-full object-cover shrink-0 ring-1 ring-zinc-200"
                                    />
                                ) : (
                                    <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black shrink-0">
                                        {firstName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="truncate">{firstName}</span>
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold overflow-hidden shrink-0 ring-1 ring-zinc-200">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={firstName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    firstName.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 truncate">
                                <p className="font-bold text-zinc-900 truncate">{firstName}</p>
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
