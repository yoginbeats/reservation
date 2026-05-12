import { getActiveAnnouncementsAction } from "@/app/actions/announcement";
import { Megaphone, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Announcements - Super Lines",
    description: "Latest updates and news from Super Lines.",
};

export default async function AnnouncementsPage() {
    const result = await getActiveAnnouncementsAction();
    const announcements = result.success && result.data ? result.data : [];

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            <main className="flex-1">
                {/* Hero Section */}
                <div className="bg-zinc-900 text-white py-32 relative overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-cover bg-right opacity-60 mix-blend-luminosity"
                        style={{ backgroundImage: "url('/announcements-bg.jpg')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-zinc-950 via-zinc-950/50 to-transparent" />
                    <div className="container mx-auto px-6 relative z-10 flex justify-end text-right">
                        <div className="max-w-2xl flex flex-col items-end">
                            <div className="inline-flex items-center gap-2 rounded-full bg-red-600/20 px-3 py-1 text-sm font-bold text-red-400 mb-6 border border-red-500/20">
                                <Megaphone className="h-4 w-4" />
                                <span>LATEST NEWS</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                                Company <span className="text-red-500">Announcements</span>
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-xl">
                                Stay up to date with the latest news, service updates, and special offers from Super Lines.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="container mx-auto px-6 py-12">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {announcements.length === 0 ? (
                            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <Megaphone className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">No active announcements</h3>
                                <p className="text-zinc-500 dark:text-zinc-400">There are no news items to display at this time. Check back later!</p>
                                <Link href="/" className="mt-6 inline-block text-red-600 font-bold hover:underline">
                                    Return to Home
                                </Link>
                            </div>
                        ) : (
                            announcements.map((announcement: any) => (
                                <article 
                                    key={announcement.id} 
                                    className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                    
                                    <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                                        <div className="md:w-1/4 shrink-0">
                                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest mb-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-600 dark:text-zinc-300">
                                                Update
                                            </div>
                                        </div>
                                        
                                        <div className="md:w-3/4">
                                            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mb-4 tracking-tight group-hover:text-red-600 transition-colors">
                                                {announcement.title}
                                            </h2>
                                            {announcement.image_url && (
                                                <div className="mb-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-2xl">
                                                    {announcement.image_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                                        <video 
                                                            src={announcement.image_url} 
                                                            className="w-full max-h-96 object-cover bg-black"
                                                            autoPlay
                                                        />
                                                    ) : (
                                                        <img 
                                                            src={announcement.image_url} 
                                                            alt={announcement.title} 
                                                            className="w-full max-h-96 object-cover hover:scale-105 transition-transform duration-500"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {announcement.content}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
