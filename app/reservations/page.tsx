import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, MapPin, Clock, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ReservationsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const origin = params.origin as string | undefined;
    const destination = params.destination as string | undefined;
    const busType = params.busType as string | undefined;
    const date = params.date as string | undefined;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Check Authentication
    if (!user) {
        redirect("/login");
    }

    // Determine Role
    let role = user.user_metadata?.role;
    if (!role) {
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();
        role = roleData?.role || 'client';
    }

    const isManual = params.manual === 'true';

    // 2. RBAC Redirection
    if (role === 'admin' && !isManual) {
        redirect("/admin/reservations");
    }

    // 3. Fetch Available Trips (Client Context)
    let query = supabaseAdmin
        .from('trips')
        .select(`
            id, 
            origin, 
            destination, 
            departure_time, 
            price,
            buses (
                bus_number,
                bus_type,
                capacity
            )
        `)
        .gt('departure_time', new Date().toISOString()) // Only future trips

    if (origin) query = query.ilike('origin', origin);
    if (destination) query = query.ilike('destination', destination);
    if (busType) query = query.filter('buses.bus_type', 'ilike', busType);
    if (date) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query
            .gte('departure_time', new Date(date).toISOString())
            .lt('departure_time', nextDay.toISOString());
    }

    const { data: tripsData, error } = await query.order('departure_time', { ascending: true });

    // Graceful fallback — if the query fails (e.g. table not found), show empty state
    const trips = error ? [] : (tripsData ?? []);

    // 4. Fetch Reservation Counts for each trip to calculate available seats
    const tripIds = trips.map((t: any) => t.id);
    const { data: allReservations } = tripIds.length > 0
        ? await supabase
            .from('reservations')
            .select('trip_id')
            .in('trip_id', tripIds)
            .not('status', 'eq', 'cancelled')
        : { data: [] };

    const reservationCounts: Record<string, number> = {};
    allReservations?.forEach(res => {
        reservationCounts[res.trip_id] = (reservationCounts[res.trip_id] || 0) + 1;
    });

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-8">
            <div className="relative overflow-hidden rounded-3xl p-8 text-white">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: 'url("/hero-bg.jpg")',
                    }}
                />
                <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" />

                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight">Available <span className="text-red-500">Trips</span></h1>
                    <p className="mt-2 text-white/80 font-medium">
                        {origin && destination ? (
                            <>Showing trips from <span className="text-red-400 font-bold">{origin}</span> to <span className="text-red-400 font-bold">{destination}</span></>
                        ) : (
                            "Browse and book your next journey."
                        )}
                        {date && <> on <span className="text-red-400 font-bold">{new Date(date).toLocaleDateString()}</span></>}
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {trips && trips.length > 0 ? (
                    trips.map((trip: any) => {
                        const tripDate = new Date(trip.departure_time);
                        const departureTimeStr = tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        // Mock arrival time (9 hours later)
                        const arrivalDate = new Date(tripDate.getTime() + 9 * 60 * 60 * 1000);
                        const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        const dateStr = tripDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

                        const capacity = trip.buses?.capacity || 45;
                        const takenSeats = reservationCounts[trip.id] || 0;
                        const availableSeats = capacity - takenSeats;

                        return (
                            <Card key={trip.id} className="overflow-hidden border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all hover:scale-[1.01]">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-zinc-800">
                                        {/* Journey Info */}
                                        <div className="flex-[2] p-6 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Route Details</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl font-black">{trip.origin}</span>
                                                        <div className="flex items-center gap-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-600" />
                                                            <div className="w-12 h-px bg-zinc-200 dark:bg-zinc-700" />
                                                            <div className="h-1.5 w-1.5 border border-zinc-300 rounded-full" />
                                                        </div>
                                                        <span className="text-xl font-black">{trip.destination}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-zinc-400 text-xs font-bold uppercase mb-1">{dateStr}</div>
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold dark:bg-zinc-800">
                                                        <CalendarCheck className="h-3 w-3 text-red-600" />
                                                        Scheduled
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Departure</p>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-red-600" />
                                                        <span className="font-bold text-lg">{departureTimeStr}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Arrival (Est.)</p>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-zinc-400" />
                                                        <span className="font-bold text-lg">{arrivalTimeStr}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Bus</p>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm bg-red-50 text-red-600 px-2 py-0.5 rounded-md dark:bg-red-900/20 w-fit">{trip.buses?.bus_type}</span>
                                                        <span className="text-xs font-mono font-bold text-zinc-500">{trip.buses?.bus_number}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Available</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "font-black text-lg",
                                                            availableSeats < 5 ? "text-orange-500" : availableSeats === 0 ? "text-red-500" : "text-emerald-500"
                                                        )}>
                                                            {availableSeats}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Seats</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing & CTA */}
                                        <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 p-6 flex flex-col justify-center items-center gap-4 text-center">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Base Fare</p>
                                                <div className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                                                    <span className="text-sm font-medium">₱</span>{trip.price?.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600 dark:bg-emerald-900/20 uppercase tracking-tighter border border-emerald-100 dark:border-emerald-900/30">
                                                <Check className="h-3 w-3" />
                                                20% Discount Available
                                            </div>
                                            <Button
                                                className="w-full h-12 rounded-xl bg-red-600 font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                                                asChild
                                                disabled={availableSeats === 0}
                                            >
                                                <Link href={`/book/${trip.id}${params.passengers ? `?passengers=${params.passengers}` : ''}`}>
                                                    {availableSeats === 0 ? "Sold Out" : "Select Seat"}
                                                </Link>
                                            </Button>
                                            <p className="text-[10px] text-zinc-400 italic">Student • Senior • PWD</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        No upcoming trips available at the moment.
                    </div>
                )}
            </div>
        </div>
    );
}
