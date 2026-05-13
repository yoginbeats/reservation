import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, MapPin, Clock, QrCode, Download, Share2 } from "lucide-react";
import Link from "next/link";
import { CancelTicketButton } from "@/components/cancel-ticket-button";
import { TicketActions } from "@/components/ticket-actions";

export default async function MyTicketsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch Confirmed Reservations (Tickets)
    const { data: reservations, error } = await supabaseAdmin
        .from('reservations')
        .select(`
            *,
            trips (
                *,
                buses (*)
            )
        `)
        .eq('customer_id', user.id)
        .in('status', ['confirmed', 'cancelled'])
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
                            <Card key={res.id} className="overflow-hidden border border-dashed border-zinc-300 dark:border-zinc-800 bg-[#f9f9fb] dark:bg-zinc-950/50 shadow-sm rounded-xl">
                                <div id={`ticket-${res.id}`} className="bg-[#f9f9fb] dark:bg-zinc-950/50">
                                    <CardHeader className="bg-transparent border-b border-zinc-200 dark:border-zinc-800 pb-4 pt-6 px-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl font-black text-red-600 tracking-tight">Superlines</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                    Electronic Boarding Pass
                                                </CardDescription>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {res.status === 'cancelled' ? (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-none font-black uppercase text-[9px] px-2.5 py-0.5">
                                                        CANCELLED
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-none font-black uppercase text-[9px] px-2.5 py-0.5">
                                                        {res.status || 'CONFIRMED'}
                                                    </Badge>
                                                )}
                                                
                                                <div className="flex items-center gap-2" data-html2canvas-ignore="true">
                                                    <Button asChild className="rounded-full bg-zinc-900 px-4 py-1 h-auto text-[10px] font-bold text-white shadow-none transition-all hover:bg-zinc-800 uppercase tracking-widest">
                                                        <Link href={`/reservations?origin=${trip.origin}&destination=${trip.destination}`}>Rebook</Link>
                                                    </Button>
                                                    {res.status !== 'cancelled' && <CancelTicketButton reservationId={res.id} />}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-8">
                                        <div className="flex justify-between items-center bg-zinc-100/50 dark:bg-zinc-900/50 px-6 py-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                            <div className="text-center space-y-1 z-10 bg-zinc-100/50 dark:bg-zinc-900/50 px-2">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Origin</div>
                                                <div className="text-xl font-black">{trip.origin}</div>
                                            </div>
                                            <div className="flex-1 px-4 relative flex items-center justify-center">
                                                <div className="absolute w-full h-[2px] bg-zinc-200 dark:bg-zinc-700 top-1/2 -translate-y-1/2"></div>
                                                <div className="rounded-full bg-zinc-100 p-1.5 dark:bg-zinc-800 z-10 border-4 border-[#f9f9fb] dark:border-zinc-950">
                                                    <Clock className="h-3 w-3 text-zinc-400" />
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1 z-10 bg-zinc-100/50 dark:bg-zinc-900/50 px-2">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Destination</div>
                                                <div className="text-xl font-black">{trip.destination}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 px-2">
                                            <div className="space-y-1.5">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Departure Date</div>
                                                <div className="text-sm font-bold flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-red-600" />
                                                    {departureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Departure Time</div>
                                                <div className="text-sm font-bold">
                                                    {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bus Number</div>
                                                <div className="text-sm font-bold">{trip.buses?.bus_number || 'TBA'}</div>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Seat Number</div>
                                                <div className="text-lg font-black text-red-600">#{res.seat_number}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center pt-8 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                                            <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm mb-3 dark:bg-white">
                                                <QrCode className="h-32 w-32 text-zinc-950" />
                                            </div>
                                            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.15em]">
                                                Ref: {res.id.slice(0, 8)}-{trip.id.slice(0, 4)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </div>
                                <TicketActions reservationId={res.id} tripOrigin={trip.origin} tripDestination={trip.destination} />
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
