import { getActiveAnnouncementsAction } from "@/app/actions/announcement";
import { Megaphone } from "lucide-react";

export async function AnnouncementPanel() {
    const result = await getActiveAnnouncementsAction();

    // If no announcements or there was an error, don't render anything
    if (!result.success || !result.data || result.data.length === 0) {
        return null;
    }

    const announcements = result.data;

    return (
        <div className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white shadow-md relative overflow-hidden">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay"></div>
            
            <div className="container mx-auto px-6 py-3 relative z-10 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 font-bold uppercase tracking-widest shrink-0 bg-red-950/30 px-3 py-1 rounded-full text-sm">
                    <Megaphone className="h-4 w-4 text-red-200 animate-pulse" />
                    <span className="text-red-50">Announcements</span>
                </div>
                
                <div className="flex-1 w-full overflow-hidden relative h-6 sm:h-auto flex items-center">
                    {/* Marquee effect for multiple announcements, or static if just one */}
                    <div className="flex gap-8 whitespace-nowrap animate-marquee">
                        {announcements.map((announcement: any) => (
                            <div key={announcement.id} className="flex items-center gap-2">
                                {announcement.image_url && (
                                    announcement.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video src={announcement.image_url} className="h-8 w-auto rounded object-cover shadow-sm mr-1" autoPlay muted loop playsInline />
                                    ) : (
                                        <img src={announcement.image_url} alt="Announcement" className="h-8 w-auto rounded object-cover shadow-sm mr-1" />
                                    )
                                )}
                                <span className="font-bold text-red-100">{announcement.title}:</span>
                                <span className="text-white/90">{announcement.content}</span>
                                <span className="text-red-400 mx-4">•</span>
                            </div>
                        ))}
                        {/* Duplicate for seamless looping if there are multiple */}
                        {announcements.map((announcement: any) => (
                            <div key={`dup-${announcement.id}`} className="flex items-center gap-2">
                                {announcement.image_url && (
                                    announcement.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                        <video src={announcement.image_url} className="h-8 w-auto rounded object-cover shadow-sm mr-1" autoPlay muted loop playsInline />
                                    ) : (
                                        <img src={announcement.image_url} alt="Announcement" className="h-8 w-auto rounded object-cover shadow-sm mr-1" />
                                    )
                                )}
                                <span className="font-bold text-red-100">{announcement.title}:</span>
                                <span className="text-white/90">{announcement.content}</span>
                                <span className="text-red-400 mx-4">•</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}} />
        </div>
    );
}
