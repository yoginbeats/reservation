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
    let tripsRaw: any[] = [];
    const { data: rawTrips, error } = await supabase
        .from('trips')
        .select('*, bus:buses(bus_number)')
        .order('departure_time', { ascending: true });

    if (error) {
        const { data: fallbackTrips } = await supabase
            .from('trips')
            .select('*')
            .order('departure_time', { ascending: true });
        if (fallbackTrips) tripsRaw = fallbackTrips;
    } else if (rawTrips) {
        tripsRaw = rawTrips;
    }

    const trips = tripsRaw.map((t: any) => ({
        ...t,
        origin: t.origin || t.route?.origin_terminal?.name || "Cubao",
        destination: t.destination || t.route?.destination_terminal?.name || "Daet",
        bus_number: t.bus_number || t.bus?.bus_number || "Superlines Express",
        fare_amount: t.fare_amount ?? t.price ?? 850
    }));

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Available Trips & Reservations</h1>
                    <p className="text-muted-foreground">Select a trip and pay securely online via PayMongo (GCash, Maya, Cards).</p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 px-3 py-1.5 rounded-full border border-red-200">
                    <span className="font-semibold">Secured by PayMongo</span>
                    <span>•</span>
                    <span>GCash / Maya / Card</span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {trips && trips.length > 0 ? (
                    trips.map((trip: any) => {
                        const tripDate = new Date(trip.departure_time);
                        const dateStr = tripDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                        const timeStr = tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <Card key={trip.id} className="flex flex-col border transition-all hover:shadow-md">
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
                                            {trip.bus_number || "Bus TBD"}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <span className="text-xs text-muted-foreground">Ticket Fare</span>
                                        <span className="text-lg font-black text-red-600">₱{trip.fare_amount}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
                                        <Link href={`/book?tripId=${trip.id}`}>
                                            Book & Pay with PayMongo
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
