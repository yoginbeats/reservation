import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, ArrowRight, History, Clock } from "lucide-react";
import Link from "next/link";

export default async function MyReservationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch All Reservations
    const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
            *,
            trips (
                *,
                buses (*)
            )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-8">
            <div className="relative overflow-hidden rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: 'url("/hero-bg.jpg")',
                    }}
                />
                <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />

                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight">Booking <span className="text-red-500">History</span></h1>
                    <p className="mt-2 text-white/80 font-medium">View all your past and current reservations.</p>
                </div>

                <div className="relative z-10">
                    <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-6 py-6 shadow-lg shadow-red-900/20">
                        <Link href="/reservations" className="gap-2">
                            <CalendarCheck className="h-5 w-5" />
                            New Booking
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {reservations && reservations.length > 0 ? (
                    reservations.map((res: any) => {
                        const trip = res.trips;
                        const tripDate = new Date(trip.departure_time);

                        return (
                            <Card key={res.id} className="transition-all hover:shadow-md">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-center">
                                        <div className="flex-1 p-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                                                    <History className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{trip.origin} to {trip.destination}</h3>
                                                    <p className="text-sm text-muted-foreground">Reservation ID: {res.id.slice(0, 8).toUpperCase()}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Departure</div>
                                                    <div className="text-sm font-semibold">{tripDate.toLocaleDateString()}</div>
                                                    <div className="text-xs text-muted-foreground">{tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Seat</div>
                                                    <div className="text-sm font-semibold">Seat {res.seat_number}</div>
                                                    <div className="text-xs text-muted-foreground">{trip.buses?.bus_number}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Status</div>
                                                    <div className={`text-sm font-bold uppercase ${res.status === 'confirmed' ? 'text-green-600' :
                                                        res.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {res.status}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Price Paid</div>
                                                    <div className="text-sm font-bold">₱{res.total_price?.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t md:border-t-0 md:border-l p-6 flex flex-row md:flex-col gap-2 bg-zinc-50 dark:bg-zinc-900/50">
                                            {res.status === 'confirmed' ? (
                                                <Button size="sm" asChild className="flex-1">
                                                    <Link href="/my-tickets">View Ticket</Link>
                                                </Button>
                                            ) : res.status === 'pending' ? (
                                                <Button size="sm" asChild className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white">
                                                    <Link href={`/checkout/${res.id}`}>Complete Payment</Link>
                                                </Button>
                                            ) : null}
                                            <Button variant="ghost" size="sm" className="flex-1">Details</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="py-20 text-center space-y-4 rounded-xl border-2 border-dashed">
                        <div className="mx-auto h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                            <Clock className="h-8 w-8 text-zinc-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">No reservation history</h3>
                            <p className="text-muted-foreground">You haven't made any bookings yet.</p>
                        </div>
                        <Button asChild>
                            <Link href="/reservations">Book Your First Journey</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
