"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
    Bus, 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    ShieldCheck, 
    GraduationCap, 
    HeartHandshake, 
    ArrowUpRight,
    ExternalLink
} from "lucide-react";

export function GlobalFooter() {
    const pathname = usePathname();

    // Do not show on staff and administrative portals (they have their own full-height layout)
    if (
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/teller") ||
        pathname?.startsWith("/conductor")
    ) {
        return null;
    }

    return (
        <footer className="border-t border-zinc-800 bg-zinc-950 text-white font-sans">
            {/* Top Info Grid */}
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    
                    {/* 1. Brand & Emblem */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-12 items-center justify-center shrink-0">
                                <Image
                                    src="/superlines_emblem_transparent.png"
                                    alt="Superlines Emblem"
                                    width={48}
                                    height={40}
                                    className="h-full w-auto object-contain drop-shadow"
                                />
                            </div>
                            <div>
                                <span className="text-lg font-black uppercase tracking-tight text-red-600 block leading-tight">
                                    SUPERLINES
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block leading-tight">
                                    Transportation Co. Inc.
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Serving Bicol and Metro Manila travelers with premier, safe, and comfortable express bus services. Centralized reservation and digital QR ticketing.
                        </p>

                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pt-1">
                            <GraduationCap className="h-4 w-4 shrink-0 text-amber-400" />
                            <span>BSIT Capstone Project 2026</span>
                        </div>
                    </div>

                    {/* 2. Official Terminals */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            Official Bus Terminals
                        </h4>
                        <ul className="space-y-2 text-xs text-zinc-400 font-medium">
                            <li className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                                <strong className="text-white block">Daet Central Terminal</strong>
                                <span className="text-[11px] text-zinc-500">Camarines Norte (Origin Dispatch Hub)</span>
                            </li>
                            <li className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                                <strong className="text-white block">Cubao Terminal</strong>
                                <span className="text-[11px] text-zinc-500">EDSA, Quezon City, Metro Manila</span>
                            </li>
                            <li className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                                <strong className="text-white block">PITX Terminal</strong>
                                <span className="text-[11px] text-zinc-500">Parañaque Integrated Terminal Exchange</span>
                            </li>
                        </ul>
                    </div>

                    {/* 3. Quick Navigation & Services */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                            <Bus className="h-3.5 w-3.5 text-red-500" />
                            Passenger Navigation
                        </h4>
                        <ul className="space-y-2 text-xs font-semibold text-zinc-400">
                            <li>
                                <Link href="/" className="hover:text-red-400 transition-colors flex items-center gap-1.5">
                                    <span>Home & Search Trips</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/schedules" className="hover:text-red-400 transition-colors flex items-center gap-1.5">
                                    <span>Daily Dispatch Schedules</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/my-tickets" className="hover:text-red-400 transition-colors flex items-center gap-1.5">
                                    <span>My Digital Tickets & QR Pass</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="hover:text-red-400 transition-colors flex items-center gap-1.5">
                                    <span>Passenger Portal & Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/login" className="hover:text-zinc-200 transition-colors text-[11px] text-zinc-500 flex items-center gap-1 pt-2">
                                    <span>Authorized Staff Portal Login</span>
                                    <ArrowUpRight className="h-3 w-3" />
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 4. Support & Regulatory Policies */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Policies & Compliance
                        </h4>
                        <div className="space-y-2 text-xs">
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent("open-privacy-policy"))}
                                className="w-full text-left p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-emerald-500/50 transition-colors group"
                            >
                                <span className="font-bold text-white group-hover:text-emerald-400 block text-xs">
                                    Data Privacy Notice
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                    Republic Act 10173 (Data Privacy Act of 2012)
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent("open-academic-disclaimer"))}
                                className="w-full text-left p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/50 transition-colors group"
                            >
                                <span className="font-bold text-white group-hover:text-amber-400 block text-xs">
                                    Academic Project Notice
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                    BSIT Thesis / Capstone Demo Simulation
                                </span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Copyright & Disclaimer Sub-bar */}
            <div className="border-t border-zinc-800/80 bg-zinc-950/90 py-4 px-4 sm:px-6">
                <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-zinc-500">
                    <p>
                        &copy; 2026 Superlines Transportation Co. Inc. • Centralized Reservation & Ticketing System
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>System Status: Online (SSL Encrypted)</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
