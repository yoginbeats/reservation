import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function ReservationsPage() {
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

    // 2. RBAC Redirection
    if (role === 'admin') {
        redirect("/admin/reservations");
    }

    // 3. Fetch Available Trips (Client Context)
    const { data: trips, error } = await supabase
        .from('trips')
        .select(`
            id, 
            origin, 
            destination, 
            departure_time, 
            price,
            buses (
                bus_number,
                bus_type
            )
        `)
        .gt('departure_time', new Date().toISOString()) // Only future trips
        .order('departure_time', { ascending: true });

    if (error) {
        console.error("Error fetching trips:", error);
    }

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
                    <p className="mt-2 text-white/80 font-medium">Browse and book your next journey.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trips && trips.length > 0 ? (
                    trips.map((trip: any) => {
                        const tripDate = new Date(trip.departure_time);
                        const dateStr = tripDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                        const timeStr = tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <Card key={trip.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-lg">
                                        <span>{trip.origin}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span>{trip.destination}</span>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <CalendarCheck className="h-4 w-4" />
                                        {dateStr}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {timeStr}
                                        </div>
                                        <div className="font-semibold">
                                            {trip.buses?.bus_number || "Bus TBD"}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-sm font-medium text-muted-foreground">{trip.buses?.bus_type}</span>
                                        <span className="text-xl font-bold text-red-600">₱{trip.price?.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" asChild>
                                        <Link href={`/book/${trip.id}`}>
                                            Buy Ticket
                                        </Link>
                                    </Button>
                                </CardFooter>
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
