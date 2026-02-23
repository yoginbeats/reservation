import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, MapPin, Clock, QrCode, Download, Share2 } from "lucide-react";
import Link from "next/link";

export default async function MyTicketsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch Confirmed Reservations (Tickets)
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
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

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
                <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />

                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight">My Digital <span className="text-red-500">Tickets</span></h1>
                    <p className="mt-2 text-white/80 font-medium">Present these QR codes at the terminal for boarding.</p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {reservations && reservations.length > 0 ? (
                    reservations.map((res: any) => {
                        const trip = res.trips;
                        const departureDate = new Date(trip.departure_time);

                        return (
                            <Card key={res.id} className="overflow-hidden border-2 border-dashed">
                                <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold text-red-600">Superlines</CardTitle>
                                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                Electronic Boarding Pass
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            CONFIRMED
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="flex justify-between items-center bg-zinc-100/50 dark:bg-zinc-800/50 p-4 rounded-xl">
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Origin</div>
                                            <div className="text-lg font-bold">{trip.origin}</div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="h-[2px] w-12 bg-zinc-300 dark:bg-zinc-700" />
                                            <div className="rounded-full bg-zinc-200 p-1 dark:bg-zinc-800">
                                                <Clock className="h-3 w-3 text-zinc-500" />
                                            </div>
                                            <div className="h-[2px] w-12 bg-zinc-300 dark:bg-zinc-700" />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Destination</div>
                                            <div className="text-lg font-bold">{trip.destination}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Departure Date</div>
                                            <div className="text-sm font-semibold flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-red-600" />
                                                {departureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Departure Time</div>
                                            <div className="text-sm font-semibold">
                                                {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Bus Number</div>
                                            <div className="text-sm font-semibold">{trip.buses?.bus_number}</div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase">Seat Number</div>
                                            <div className="text-lg font-bold text-red-600 italic">#{res.seat_number}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center pt-4 border-t border-dashed">
                                        <div className="bg-white p-4 rounded-xl border-2 shadow-sm mb-2 dark:bg-zinc-50">
                                            <QrCode className="h-32 w-32 text-zinc-900" />
                                        </div>
                                        <p className="text-[10px] font-mono text-muted-foreground uppercase">
                                            Ref: {res.id.slice(0, 8)}-{trip.id.slice(0, 4)}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-t flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                                        <Download className="h-4 w-4" />
                                        Save Image
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                                        <Share2 className="h-4 w-4" />
                                        Share
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                            <Ticket className="h-8 w-8 text-zinc-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">No tickets found</h3>
                            <p className="text-muted-foreground">You don't have any confirmed bookings yet.</p>
                        </div>
                        <Button asChild>
                            <Link href="/reservations">Book a Trip Now</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
            {children}
        </span>
    );
}
