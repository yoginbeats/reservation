import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Calendar, ArrowRight, ShieldCheck, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PassengerAnnouncements } from "@/components/passenger-announcements";

export const metadata: Metadata = {
    title: "Official Announcements & Travel Advisories | Superlines",
    description: "Real-time updates, holiday schedule announcements, weather bulletins, and passenger travel advisories from Superlines Transportation Co. Inc.",
};

export default function AnnouncementsPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
            {/* Header Banner */}
            <div 
                className="relative overflow-hidden py-14 px-4 sm:px-6 lg:px-8 text-white shadow-xl bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `linear-gradient(to right, rgba(185, 28, 28, 0.92), rgba(127, 29, 29, 0.85)), url('/scenic_highway_bg.jpg')`
                }}
            >
                <div className="relative z-10 max-w-5xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white border border-white/30">
                        <Megaphone className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                        <span>Superlines Operations Broadcast</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-tight">
                        Company Announcements &amp; Advisories
                    </h1>

                    <p className="text-sm sm:text-base text-red-100 max-w-2xl font-medium leading-relaxed">
                        Stay informed on scheduled bus dispatch times, terminal operational advisories, holiday travel guidelines, and real-time fleet announcements.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-3">
                        <Button asChild size="sm" className="bg-white text-red-700 hover:bg-zinc-100 font-bold shadow-md text-xs">
                            <Link href="/book">
                                <Bus className="h-4 w-4 mr-1.5" /> Book a Trip Now
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="bg-red-950/40 border-red-300/40 text-white hover:bg-red-900/60 font-semibold text-xs">
                            <Link href="/schedules">
                                <Calendar className="h-4 w-4 mr-1.5" /> Check Daily Schedules
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                <PassengerAnnouncements showTitle={false} />

                {/* Important Passenger Notice Box */}
                <div className="mt-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Official Communication Channel</span>
                            </div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                                Need Urgent Trip Inquiries or Assistance?
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
                                For trip cancellations, weather re-routing, or cargo express inquiries, visit our terminal dispatch counters in Daet, Cubao, or PITX.
                            </p>
                        </div>
                        <Button asChild className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs shrink-0">
                            <Link href="/schedules">
                                View Terminal Routes &rarr;
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
