"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getActiveAnnouncementsAction, AnnouncementItem } from "@/app/actions/announcement";
import { Megaphone } from "lucide-react";

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
    {
        id: "default-1",
        title: "New Ride, Better Journey",
        content: "We're happy to announce that a new bus unit has officially arrived and is now ready to serve our passengers! Enjoy a safer, smoother, and more comfortable trip.",
        is_active: true,
    },
];

export function AnnouncementPanel() {
    const pathname = usePathname();
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_ANNOUNCEMENTS);

    useEffect(() => {
        let isMounted = true;
        const fetchAnnouncements = async () => {
            try {
                // Check local storage first for instant offline/cached announcement load
                if (typeof window !== "undefined") {
                    const localRaw = localStorage.getItem("superlines_announcements");
                    if (localRaw) {
                        try {
                            const parsed = JSON.parse(localRaw);
                            if (Array.isArray(parsed) && parsed.length > 0 && isMounted) {
                                const activeList = parsed.filter((a: any) => a.is_active !== false);
                                if (activeList.length > 0) setAnnouncements(activeList);
                            }
                        } catch (e) {
                            // Ignore json parse error
                        }
                    }
                }

                const res = await getActiveAnnouncementsAction();
                if (isMounted && res.success && res.data && res.data.length > 0) {
                    setAnnouncements(res.data);
                    if (typeof window !== "undefined") {
                        localStorage.setItem("superlines_announcements", JSON.stringify(res.data));
                    }
                }
            } catch (err) {
                console.warn("Announcement panel load notice:", err);
            }
        };

        fetchAnnouncements();
        return () => {
            isMounted = false;
        };
    }, [pathname]);

    // Hide announcement banner on staff / internal management portals
    if (
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/teller") ||
        pathname?.startsWith("/conductor")
    ) {
        return null;
    }

    if (!announcements || announcements.length === 0) {
        return null;
    }

    return (
        <div className="w-full bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-inner relative overflow-hidden border-b border-red-500/20 z-40">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay pointer-events-none" />

            <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-2.5 relative z-10 flex items-center gap-3 overflow-hidden">
                <div className="flex items-center gap-1.5 shrink-0 bg-red-950/80 border border-red-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
                    <Megaphone className="h-3.5 w-3.5 text-red-300 animate-pulse" />
                    <span className="hidden xs:inline">Announcements</span>
                </div>

                <div className="flex-1 overflow-hidden relative h-6 flex items-center">
                    <div className="flex gap-8 whitespace-nowrap animate-marquee">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="flex items-center gap-2 text-xs">
                                {announcement.image_url && (
                                    announcement.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video
                                            src={announcement.image_url}
                                            className="h-5 w-auto rounded object-cover shadow-sm mr-1"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={announcement.image_url}
                                            alt="Announcement"
                                            className="h-5 w-auto rounded object-cover shadow-sm mr-1"
                                        />
                                    )
                                )}
                                <span className="font-extrabold text-amber-300">{announcement.title}:</span>
                                <span className="font-medium text-red-50">{announcement.content}</span>
                                <span className="text-red-400/60 mx-4">•</span>
                            </div>
                        ))}

                        {/* Duplicate for seamless continuous looping marquee */}
                        {announcements.map((announcement) => (
                            <div key={`dup-${announcement.id}`} className="flex items-center gap-2 text-xs">
                                {announcement.image_url && (
                                    announcement.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video
                                            src={announcement.image_url}
                                            className="h-5 w-auto rounded object-cover shadow-sm mr-1"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={announcement.image_url}
                                            alt="Announcement"
                                            className="h-5 w-auto rounded object-cover shadow-sm mr-1"
                                        />
                                    )
                                )}
                                <span className="font-extrabold text-amber-300">{announcement.title}:</span>
                                <span className="font-medium text-red-50">{announcement.content}</span>
                                <span className="text-red-400/60 mx-4">•</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 35s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `,
                }}
            />
        </div>
    );
}
