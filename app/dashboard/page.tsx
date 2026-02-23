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
        <div className="space-y-10 py-6">
            <div className="relative overflow-hidden rounded-3xl p-8 text-white md:p-12">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
                    style={{
                        backgroundImage: 'url("/hero-bg.jpg")',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                        Welcome Back, <span className="text-white underline decoration-red-400 decoration-4 underline-offset-8">{userName}!</span>
                    </h1>
                    <p className="mt-4 text-lg text-white/90 max-w-xl font-medium">
                        Manage your reservations and tickets from your personal dashboard.
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3">
                <Link href="/book" className="block">
                    <Card className="group h-full cursor-pointer border-2 border-transparent transition-all hover:border-red-600 hover:shadow-xl dark:bg-zinc-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-red-50 p-4 transition-colors group-hover:bg-red-600 group-hover:text-white dark:bg-red-900/20">
                                    <CalendarCheck className="h-7 w-7" />
                                </div>
                                <ArrowRight className="h-6 w-6 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2 text-xl">New Reservation</CardTitle>
                            <CardDescription className="text-base text-zinc-500">Book a new trip for your upcoming travel.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/my-tickets" className="block">
                    <Card className="group h-full cursor-pointer border-2 border-transparent transition-all hover:border-red-600 hover:shadow-xl dark:bg-zinc-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-red-50 p-4 transition-colors group-hover:bg-red-600 group-hover:text-white dark:bg-red-900/20">
                                    <Ticket className="h-7 w-7" />
                                </div>
                                <ArrowRight className="h-6 w-6 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2 text-xl">View Tickets</CardTitle>
                            <CardDescription className="text-base text-zinc-500">Access your purchased tickets and QR codes.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/history" className="block">
                    <Card className="group h-full cursor-pointer border-2 border-transparent transition-all hover:border-red-600 hover:shadow-xl dark:bg-zinc-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-red-50 p-4 transition-colors group-hover:bg-red-600 group-hover:text-white dark:bg-red-900/20">
                                    <Clock className="h-7 w-7" />
                                </div>
                                <ArrowRight className="h-6 w-6 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2 text-xl">History</CardTitle>
                            <CardDescription className="text-base text-zinc-500">View your past reservations and transactions.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Upcoming Reservations */}
            <Card className="border-none bg-zinc-50 shadow-none dark:bg-zinc-900/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">Your Reservations</CardTitle>
                            <CardDescription className="text-base">Your latest booking activity.</CardDescription>
                        </div>
                        <Button variant="outline" asChild className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
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
                                    <div key={res.id} className="flex items-center gap-6 rounded-2xl bg-white border border-transparent p-5 transition-all hover:border-red-100 hover:shadow-md dark:bg-zinc-900">
                                        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none">
                                            <span className="text-xs font-black uppercase">{month}</span>
                                            <span className="text-2xl font-black">{day}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50">
                                                    {trip ? `${trip.origin} → ${trip.destination}` : `Reservation #${res.id.slice(0, 6)}`}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-zinc-500 uppercase font-bold tracking-wider">
                                                <span>{trip?.departure_time
                                                    ? new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Time TBA'}</span>
                                                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                                                <span>{trip?.bus_number || 'Bus Pending'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-tighter ${res.reservation_status === 'confirmed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {res.reservation_status}
                                            </span>
                                            <Button variant="ghost" size="sm" className="h-8 font-bold text-red-600 hover:bg-red-50 hover:text-red-700">Details</Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="mb-4 rounded-full bg-zinc-100 p-5 dark:bg-zinc-800">
                                    <Ticket className="h-8 w-8 text-zinc-300" />
                                </div>
                                <h3 className="text-lg font-bold">No reservations yet</h3>
                                <p className="text-sm text-zinc-500 max-w-xs mt-2">
                                    You haven&apos;t made any reservations yet. Start your journey today!
                                </p>
                                <Button variant="link" asChild className="mt-4 font-bold text-red-600">
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
