import { createClient, getRole } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarCheck, Search, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { ReservationActions } from "@/components/admin/reservation-actions";
import { ManualReservationButton } from "@/components/admin/manual-reservation-button";

export default async function ReservationsPage() {
    const { role, branch } = await getRole();
    const supabase = await createClient();

    // Fetch All Reservations with Customer and Trip details
    const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
            *,
            trips (
                origin,
                destination,
                departure_time
            ),
            profiles:customer_id (
                full_name,
                email
            )
        `)
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reservations</h1>
                    <p className="text-muted-foreground italic">Monitor and manage all customer bookings.</p>
                </div>
                {role === 'admin' && (
                    <ManualReservationButton />
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search by Reservation ID or Customer Name..." className="pl-10 h-10 border-zinc-200 dark:border-zinc-800" />
                </div>
                <Button variant="outline" className="h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    Status
                </Button>
            </div>

            {/* Reservations List */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
                    <CardTitle>All Booking Records</CardTitle>
                    <CardDescription>Comprehensive list of all reservations in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {reservations && reservations.length > 0 ? (
                            reservations.map((res) => {
                                const trip = res.trips as { origin: string; destination: string; departure_time: string };
                                const profiles = res.profiles as { full_name: string; email: string }[] | { full_name: string; email: string };
                                const customer = Array.isArray(profiles) ? profiles[0] : profiles;
                                const tripDate = new Date(trip?.departure_time);

                                return (
                                    <div key={res.id} className="flex items-center gap-6 p-6 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                                            <CalendarCheck className="h-6 w-6 text-blue-600" />
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <p className="font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">#{res.id.slice(0, 8)}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="font-medium text-blue-600">{customer?.full_name || "Unknown"}</span>
                                                    <span>•</span>
                                                    <span>Seat {res.seat_number}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold">{trip?.origin} → {trip?.destination}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {tripDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase transition-colors ${res.status === 'confirmed'
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : res.status === 'pending'
                                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}>
                                                    {res.status}
                                                </span>
                                            </div>
                                        </div>

                                        <ReservationActions
                                            reservationId={res.id}
                                            status={res.status}
                                            role={role}
                                            branch={branch}
                                            tripOrigin={trip?.origin}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-20 text-center text-muted-foreground">
                                No reservations found in the database.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
