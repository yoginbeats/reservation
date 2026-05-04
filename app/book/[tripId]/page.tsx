import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Armchair, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { SeatSelection } from "@/components/seat-selection";

export default async function BookTripPage({
    params,
    searchParams
}: {
    params: { tripId: string },
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { tripId } = await params;
    const { passengers } = await searchParams;
    const passengerCount = passengers ? parseInt(passengers as string) : 1;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch Trip and Bus Details
    const { data: trip, error: tripError } = await supabaseAdmin
        .from('trips')
        .select(`
            *,
            buses (*)
        `)
        .eq('id', tripId)
        .single();

    if (tripError || !trip) {
        notFound();
    }

    // Fetch existing reservations for this trip to mark seats as taken
    const { data: reservedSeats } = await supabase
        .from('reservations')
        .select('seat_number')
        .eq('trip_id', tripId)
        .not('status', 'eq', 'cancelled');

    const takenSeats = new Set(reservedSeats?.map((r: { seat_number: string }) => r.seat_number) || []);

    // Generate Seat Map
    const busType = trip.buses?.bus_type || "Regular Aircon";
    const capacity = busType.toLowerCase().includes('regular') ? 49 : 45;
    const seats = [];
    for (let i = 1; i <= capacity; i++) {
        seats.push({
            id: i.toString(),
            label: i.toString(),
            isTaken: takenSeats.has(i.toString())
        });
    }

    return (
        <div className="container mx-auto max-w-4xl py-10 space-y-8">
            <Link href="/reservations" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Trips
            </Link>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Seat Selection */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative overflow-hidden rounded-3xl p-8 text-white">
                        {/* Background Image with Overlay */}
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: 'url("/hero-bg.jpg")',
                            }}
                        />
                        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />

                        <div className="relative z-10">
                            <h1 className="text-3xl font-black tracking-tight">Select Your <span className="text-red-500">Seat</span></h1>
                            <p className="mt-2 text-white/80 font-medium">Pick your preferred seat for your trip from {trip.origin} to {trip.destination}.</p>
                        </div>
                    </div>

                    <Card className="bg-zinc-50 dark:bg-zinc-900/50">
                        <CardHeader className="text-center border-b pb-4">
                            <div className="mx-auto h-8 w-24 rounded-t-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                FRONT
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <SeatSelection
                                seats={seats}
                                tripId={tripId}
                                price={trip.price}
                                userId={user.id}
                                busType={busType}
                                passengerCount={passengerCount}
                            />
                        </CardContent>
                    </Card>


                </div>

                {/* Trip Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trip Summary</CardTitle>
                            <CardDescription>Review your journey details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Route</span>
                                    <span className="text-zinc-600 font-bold dark:text-zinc-300">{trip.origin} → {trip.destination}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Departure</span>
                                    <span className="text-zinc-600 font-bold dark:text-zinc-300">
                                        {new Date(trip.departure_time).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Bus Unit</span>
                                    <div className="text-right">
                                        <div className="text-zinc-600 font-bold dark:text-zinc-300">{trip.buses?.bus_number}</div>
                                        <div className="text-[10px] text-muted-foreground">{trip.buses?.bus_type}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold">Price per seat</span>
                                    <span className="text-2xl font-bold text-red-600">₱{trip.price?.toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">Select a seat to see the total amount.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10 flex gap-3 items-start border border-blue-100 dark:border-blue-900/20">
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-700 dark:text-blue-400">
                            <p className="font-semibold mb-1 uppercase tracking-wider">Boarding Info</p>
                            <p className="leading-relaxed">Please arrive 30 minutes before departure for verification of digital tickets.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
