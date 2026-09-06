import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Bus, ArrowRight, UserCheck, MapPin } from "lucide-react";
import { createClient, getUserWithRoleAndTerminal } from "@/lib/supabase/server";

export default async function TellerDashboardPage() {
    const { user, terminal } = await getUserWithRoleAndTerminal();
    const termObj = Array.isArray(terminal) ? (terminal as any)[0] : (terminal as any);
    const supabase = await createClient();

    // Fetch today's trips
    const { data: trips } = await supabase
        .from('trips')
        .select(`
            id,
            departure_time,
            fare_amount,
            bus:buses(bus_number),
            route:routes(
                origin:origin_terminal_id(name),
                destination:destination_terminal_id(name)
            )
        `)
        .order('departure_time', { ascending: true })
        .limit(6);

    // Fetch total walk-in bookings created by this teller or at this terminal
    const { count: walkInCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_source', 'WALK_IN');

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Teller Terminal Counter</h1>
                    <p className="text-muted-foreground">
                        Process walk-in passenger reservations and manage terminal schedules for {termObj?.name || 'Superlines Terminal'}.
                    </p>
                </div>
                <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                    <Link href="/teller/walk-in">
                        <Ticket className="mr-2 h-5 w-5" />
                        Process Walk-in Booking
                    </Link>
                </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Assigned Terminal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-blue-600">{termObj?.name || 'Central'}</div>
                        <p className="text-xs text-muted-foreground mt-1">{termObj?.location || 'Superlines Station'}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Walk-in Bookings Processed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">{walkInCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total physical counter sales</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Active Schedules</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-purple-600">{trips?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Upcoming departures today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Trips Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Upcoming Departure Schedules</CardTitle>
                            <CardDescription>Select a trip schedule to process walk-in passengers or view manifests.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/teller/manifest">View All Manifests</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {trips && trips.length > 0 ? (
                            trips.map((t: any) => {
                                const origin = t.route?.origin?.name || "Origin";
                                const dest = t.route?.destination?.name || "Destination";
                                const busNum = t.bus?.bus_number || "Bus TBD";
                                const depTime = new Date(t.departure_time);

                                return (
                                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold">
                                                <Bus className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base flex items-center gap-2">
                                                    <span>{origin}</span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    <span>{dest}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Bus: <span className="font-semibold text-foreground">{busNum}</span> • Departure: {depTime.toLocaleDateString()} {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/teller/manifest?trip_id=${t.id}`}>Manifest</Link>
                                            </Button>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                                                <Link href={`/teller/walk-in?trip_id=${t.id}`}>Book Walk-in</Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">No upcoming departure schedules found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
