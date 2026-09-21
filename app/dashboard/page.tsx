import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Ticket, Clock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ClientDashboard() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        // This should be handled by middleware, but as a safety net:
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Please log in to view your dashboard.</p>
                <Link href="/login">
                    <Button>Go to Login</Button>
                </Link>
            </div>
        );
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

    // Fetch upcoming reservations (just fetching latest 3 for now)
    // Ideally we filter by trip date >= now
    const { data: reservations } = await supabase
        .from('reservations')
        .select(`
            id,
            total_price,
            reservation_status,
            created_at,
            trips (
                destination,
                origin,
                departure_time
            )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

    const userName = profile?.full_name || user?.email?.split('@')[0] || "Client";

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 p-8 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur">
                        Official Passenger Portal
                    </span>
                    <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                        Welcome to Superlines Transportation Co. Inc.
                    </h1>
                    <p className="mt-2 text-base font-medium text-red-100">
                        Hello, <span className="font-bold text-white">{userName}</span>! Manage your online bus reservations, book trips, and view your digital tickets easily.
                    </p>
                </div>
                <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/book" className="block">
                    <Card className="group h-full cursor-pointer transition-all hover:border-blue-500 hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                    <CalendarCheck className="h-6 w-6 text-blue-600" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2">New Reservation</CardTitle>
                            <CardDescription>Book a new trip for your upcoming travel.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/my-tickets" className="block">
                    <Card className="group h-full cursor-pointer transition-all hover:border-green-500 hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                    <Ticket className="h-6 w-6 text-green-600" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2">View Tickets</CardTitle>
                            <CardDescription>Access your purchased tickets and QR codes.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/history" className="block">
                    <Card className="group h-full cursor-pointer transition-all hover:border-purple-500 hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                                    <Clock className="h-6 w-6 text-purple-600" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2">History</CardTitle>
                            <CardDescription>View your past reservations and transactions.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Upcoming Reservations */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Your Reservations</CardTitle>
                            <CardDescription>Your latest booking activity.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/my-reservations">View All</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {reservations && reservations.length > 0 ? (
                            reservations.map((res: any) => {
                                const trip = res.trips; // Safe access if relation exists
                                const tripDate = trip?.departure_time ? new Date(trip.departure_time) : new Date(res.created_at);
                                const month = tripDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                                const day = tripDate.getDate();

                                return (
                                    <div key={res.id} className="flex items-center gap-4 rounded-lg border p-4">
                                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <span className="text-xs font-bold text-blue-600">{month}</span>
                                            <span className="text-xl font-bold text-blue-600">{day}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-base">
                                                {trip ? `${trip.origin} to ${trip.destination}` : `Reservation #${res.id.slice(0, 6)}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {trip?.departure_time
                                                    ? new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Time TBA'}
                                                {' • ' + (trip?.bus_number || 'Bus Pending')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${res.reservation_status === 'confirmed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {res.reservation_status}
                                            </span>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs">Details</Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="mb-2 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                                    <Ticket className="h-6 w-6 text-zinc-400" />
                                </div>
                                <h3 className="text-sm font-medium">No reservations yet</h3>
                                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                    You haven&apos;t made any reservations yet. Start your journey today!
                                </p>
                                <Button variant="link" asChild className="mt-2 text-blue-600">
                                    <Link href="/book">Book Now</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
