"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
    Megaphone, 
    Calendar, 
    Clock, 
    RefreshCw, 
    AlertTriangle, 
    Info, 
    CheckCircle2, 
    ExternalLink, 
    Maximize2, 
    Sparkles,
    ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface Announcement {
    id: string;
    title: string;
    content: string;
    image_url?: string | null;
    is_active?: boolean;
    created_at?: string;
}

const FALLBACK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: "default-1",
        title: "Official Superlines Service Classes & Fares",
        content: "Regular Aircon (₱850 • 49 Seats) | Super Deluxe with Restroom (₱950 • 43 Seats) | First Class Premier Sleeper (₱1,100 • 41 Seats). Book online with instant e-boarding pass and live seat selection!",
        created_at: new Date().toISOString(),
        is_active: true,
    },
    {
        id: "default-2",
        title: "Pet Travel Policy & Passenger Safety Guidelines",
        content: "Superlines permits domesticated pets under strict travel regulations: pets must be kept in secure, leak-proof cages, wearing diapers, and accompanied by an additional paid adjacent seat booking.",
        created_at: new Date().toISOString(),
        is_active: true,
    },
    {
        id: "default-3",
        title: "Mandatory Physical ID Verification for Concession Discounts",
        content: "All passengers availing of the 20% statutory discount (Senior Citizens, PWD, Students) must present their valid physical government-issued ID upon boarding to the bus conductor.",
        created_at: new Date().toISOString(),
        is_active: true,
    }
];

interface PassengerAnnouncementsProps {
    limit?: number;
    showViewAllButton?: boolean;
    compact?: boolean;
    className?: string;
    showTitle?: boolean;
}

export function PassengerAnnouncements({
    limit,
    showViewAllButton = false,
    compact = false,
    className = "",
    showTitle = true,
}: PassengerAnnouncementsProps) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const fetchAnnouncements = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const res = await fetch("/api/announcements", {
                cache: "no-store",
                headers: { "Pragma": "no-cache" }
            });
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                setAnnouncements(json.data);
                // Also cache locally for instant offline loading
                if (typeof window !== "undefined") {
                    localStorage.setItem("superlines_announcements", JSON.stringify(json.data));
                }
            } else {
                // If API returned empty array or error, load cached or fallback
                if (typeof window !== "undefined") {
                    const cached = localStorage.getItem("superlines_announcements");
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                setAnnouncements(parsed.filter((a: any) => a.is_active !== false));
                                return;
                            }
                        } catch {}
                    }
                }
                setAnnouncements(FALLBACK_ANNOUNCEMENTS);
            }
        } catch (err) {
            console.warn("Notice: Using cached/fallback passenger announcements", err);
            if (typeof window !== "undefined") {
                const cached = localStorage.getItem("superlines_announcements");
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setAnnouncements(parsed.filter((a: any) => a.is_active !== false));
                            return;
                        }
                    } catch {}
                }
            }
            setAnnouncements(FALLBACK_ANNOUNCEMENTS);
        } finally {
            setLoading(false);
            setLastUpdated(new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
    }, []);

    useEffect(() => {
        fetchAnnouncements();

        // Auto poll every 45 seconds to pick up any new admin announcement without refreshing
        const interval = setInterval(() => {
            fetchAnnouncements(true);
        }, 45000);

        return () => clearInterval(interval);
    }, [fetchAnnouncements]);

    const displayedAnnouncements = limit ? announcements.slice(0, limit) : announcements;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Official Advisory";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "Official Advisory";
        }
    };

    return (
        <section className={`w-full ${className}`}>
            {showTitle && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-400">
                            <Megaphone className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                            <span>Official Headquarters Broadcast</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                            Announcements &amp; Travel Advisories
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                            Real-time trip advisories, holiday schedules, weather bulletins, and fleet updates direct from Superlines operations.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAnnouncements(false)}
                            disabled={loading}
                            className="text-xs h-9 font-semibold gap-1.5"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>

                        {showViewAllButton && (
                            <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9">
                                <Link href="/announcements">
                                    View All Announcements &rarr;
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Content Display */}
            {loading && announcements.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between" />
                    ))}
                </div>
            ) : displayedAnnouncements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center text-zinc-500">
                    <Megaphone className="h-10 w-10 mx-auto text-zinc-400 mb-2 opacity-50" />
                    <p className="text-sm font-bold">No active announcements at the moment</p>
                    <p className="text-xs text-zinc-400 mt-1">Bus trips are operating on normal scheduled turnaround.</p>
                </div>
            ) : (
                <div className={`grid grid-cols-1 ${compact ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"} gap-4 sm:gap-6`}>
                    {displayedAnnouncements.map((item, idx) => {
                        const isVideo = item.image_url && item.image_url.match(/\.(mp4|webm|ogg|mov)$/i);
                        return (
                            <Card 
                                key={item.id || idx}
                                className="group relative flex flex-col justify-between overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-sm hover:shadow-md transition-all hover:border-red-500/50 rounded-2xl"
                            >
                                {/* Top Banner Image / Video if available */}
                                {item.image_url && (
                                    <div 
                                        className="relative w-full h-44 bg-zinc-950 overflow-hidden cursor-pointer"
                                        onClick={() => setSelectedAnnouncement(item)}
                                    >
                                        {isVideo ? (
                                            <video 
                                                src={item.image_url} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md p-1.5 text-white/80 hover:text-white">
                                            <Maximize2 className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                )}

                                <CardHeader className="space-y-2 p-5 pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-950/80 border border-red-200/60 dark:border-red-900/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                                            <Sparkles className="h-2.5 w-2.5" /> Official Advisory
                                        </span>
                                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(item.created_at)}</span>
                                        </div>
                                    </div>

                                    <CardTitle className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                                        {item.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line line-clamp-4">
                                        {item.content}
                                    </p>

                                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAnnouncement(item)}
                                            className="font-bold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 text-xs"
                                        >
                                            Read Full Notice &rarr;
                                        </button>
                                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                                            Superlines Operations
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal Dialog for Reading Full Announcement */}
            <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                    {selectedAnnouncement && (
                        <div className="space-y-4">
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="rounded-md bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-900 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                                        Official Travel Advisory
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Published on {formatDate(selectedAnnouncement.created_at)}
                                    </span>
                                </div>
                                <DialogTitle className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-snug">
                                    {selectedAnnouncement.title}
                                </DialogTitle>
                            </DialogHeader>

                            {selectedAnnouncement.image_url && (
                                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
                                    {selectedAnnouncement.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video
                                            src={selectedAnnouncement.image_url}
                                            controls
                                            className="w-full max-h-80 object-contain mx-auto"
                                            autoPlay
                                        />
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={selectedAnnouncement.image_url}
                                            alt={selectedAnnouncement.title}
                                            className="w-full max-h-80 object-contain mx-auto"
                                        />
                                    )}
                                </div>
                            )}

                            <div className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                                {selectedAnnouncement.content}
                            </div>

                            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div>
                                    <strong className="block font-bold">Official Superlines Advisory Notice</strong>
                                    For inquiries regarding departures, terminal operations, or booking assistance, please contact the terminal dispatch counter directly.
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
