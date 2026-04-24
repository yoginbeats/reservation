import { createClient } from "@/lib/supabase/server";
import { Bus, MapPin, Clock, CalendarDays, Ticket } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 0; // Ensure fresh data on every load

export default async function TripSchedulePage() {
    const supabase = await createClient();
    const { data: trips } = await supabase
        .from("trips")
        .select(`
            *,
            buses (
                bus_number,
                bus_type,
                capacity
            )
        `)
        .order("departure_time", { ascending: true });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6">
            <div className="container mx-auto max-w-5xl space-y-12">
                {/* Header Section */}
                <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-600 mb-6">
                        <CalendarDays className="h-8 w-8 stroke-[2.5]" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">
                        Official <span className="text-red-600">Trip Schedule</span>
                    </h1>
                    <p className="text-lg text-zinc-500 font-medium max-w-2xl mx-auto">
                        Find the perfect time to travel. Browse our comprehensive list of active routes, real-time departure times, and exclusive bus tiers.
                    </p>
                </div>

                {/* Schedules Grid */}
                <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1200 delay-150">
                    {trips && trips.length > 0 ? (
                        trips.map((trip: any) => {
                            const d = new Date(trip.departure_time);
                            const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
                            const day = d.getDate();
                            const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            
                            return (
                                <Card key={trip.id} className="group overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500">
                                    <div className="flex flex-col sm:flex-row">
                                        {/* Date Block */}
                                        <div className="flex flex-row sm:flex-col items-center justify-center p-6 bg-red-600 text-white gap-2 sm:gap-0 sm:w-32 shrink-0 group-hover:bg-red-700 transition-colors">
                                            <span className="text-sm font-black uppercase tracking-widest text-red-200">{month}</span>
                                            <span className="text-4xl font-black tracking-tighter">{day}</span>
                                        </div>

                                        {/* Trip Details */}
                                        <CardContent className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
                                            <div className="flex flex-wrap items-center justify-between gap-6 mb-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-zinc-400">
                                                        <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-red-500" /> {timeStr}</span>
                                                        <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                                        <span className="flex items-center gap-1"><Bus className="h-4 w-4" /> {trip.buses?.bus_type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 pt-2">
                                                        <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">{trip.origin}</span>
                                                        <div className="flex-1 h-[2px] w-8 sm:w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full relative">
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 px-2 text-zinc-300">
                                                                &#x2794;
                                                            </div>
                                                        </div>
                                                        <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">{trip.destination}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-4 sm:mt-0">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Standard Fare</p>
                                                        <p className="text-3xl font-black text-red-600">₱{trip.price}</p>
                                                    </div>
                                                    <Button asChild className="hidden sm:inline-flex h-12 rounded-full px-8 text-sm font-bold shadow-lg shadow-red-500/20 active:scale-95 bg-red-600 hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-zinc-900 transition-all mt-4">
                                                        <Link href={`/book/${trip.id}/seats`}>Reserve Seat</Link>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Mobile Button Only */}
                                            <Button asChild className="sm:hidden w-full h-12 mt-6 rounded-xl font-bold bg-zinc-900 text-white">
                                                <Link href={`/book/${trip.id}/seats`}>Reserve Seat</Link>
                                            </Button>
                                        </CardContent>
                                    </div>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2rem] bg-zinc-100 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
                            <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl shadow-xl mb-6">
                                <MapPin className="h-10 w-10 text-zinc-300" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">No Scheduled Trips</h3>
                            <p className="text-zinc-500 font-medium max-w-md mt-2">
                                We are currently updating our nationwide routes. Please check back later for our new schedule postings.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
