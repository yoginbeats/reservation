import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock, MapPin, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "About Us | SUPERLINES",
    description: "Learn about Superlines Transport history, fleet, and safety dedication.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden bg-zinc-900">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 animate-in zoom-in duration-1000"
                    style={{ backgroundImage: "url('/hero-bg.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150">
                    <div className="flex h-20 w-20 items-center justify-center mb-6 rounded-3xl bg-white shadow-2xl">
                        <img src="/482809688_1079373070897719_6989867294877356725_n.jpg" alt="Logo" className="w-14 h-14 object-contain" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase max-w-4xl">
                        Journey With <span className="text-red-500">Excellence</span>
                    </h1>
                    <p className="mt-6 text-lg md:text-xl font-medium text-zinc-300 max-w-2xl">
                        Pioneering premium road transportation across the Philippines. Comfort, punctuality, and uncompromising safety since our inception.
                    </p>
                </div>
            </div>

            {/* Core Values Section */}
            <div className="container mx-auto px-4 sm:px-6 py-24">
                <div className="grid gap-12 lg:grid-cols-2 items-center">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-red-600 mb-2">Our Philosophy</h2>
                            <h3 className="text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">
                                Redefining Travel <br /> Standards
                            </h3>
                        </div>
                        <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                            Superlines is not just a transit company—we are your dedicated travel partners. 
                            We continuously upgrade our fleet and rigorously train our staff to guarantee that every journey is smooth, secure, and incredibly comfortable.
                        </p>
                        
                        <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-900">
                            <div className="space-y-3">
                                <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/20 flex items-center justify-center">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Uncompromising Safety</h4>
                                <p className="text-sm text-zinc-500">State-of-the-art dispatch and highly trained dual-driver deployments per trip.</p>
                            </div>
                            <div className="space-y-3">
                                <div className="h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-600 dark:bg-zinc-900 flex items-center justify-center">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Pinpoint Punctuality</h4>
                                <p className="text-sm text-zinc-500">Optimized scheduling algorithms to ensure departures and arrivals are always on time.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-600 translate-x-4 translate-y-4 rounded-[2rem] -z-10" />
                        <img 
                            src="/poster1.jpg" 
                            alt="Superlines Bus" 
                            className="w-full h-auto aspect-square object-cover rounded-[2rem] shadow-2xl"
                        />
                    </div>
                </div>
            </div>

            {/* Stats / Numbers */}
            <div className="bg-zinc-950 py-20 text-white">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><MapPin className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">20+</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Routes Nationwide</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><Bus className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">150</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Modern Buses</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><ShieldCheck className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">500k</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Safe Journeys</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4"><Clock className="h-8 w-8 text-red-500" /></div>
                            <p className="text-5xl font-black">98%</p>
                            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">On-time Record</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="container mx-auto px-4 sm:px-6 py-24 text-center">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 mb-6">
                    Ready to Start Your Journey?
                </h2>
                <p className="text-lg text-zinc-500 font-medium max-w-xl mx-auto mb-10">
                    Join thousands of satisfied passengers who trust Superlines for their inter-provincial travel needs. Book your seat online today.
                </p>
                <div className="flex justify-center gap-4">
                    <Button asChild className="h-14 rounded-full px-8 text-sm font-bold bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-none transition-all hover:scale-105 active:scale-95">
                        <Link href="/schedule">View Schedule</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 rounded-full px-8 text-sm font-bold border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105 active:scale-95">
                        <Link href="/dashboard">Book Now <ArrowRight className="h-4 w-4 ml-2" /></Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
