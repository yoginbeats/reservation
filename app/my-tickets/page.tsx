"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Clock, Bus, MapPin, Printer, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserTicket {
    id: string;
    qr_token: string;
    ticket_status: string;
    created_at: string;
    booking: {
        id: string;
        passenger_name: string;
        seat_number: number;
        total_price: number;
        booking_source: string;
        trip: {
            departure_time: string;
            bus: { bus_number: string } | null;
            route: {
                origin: { name: string } | null;
                destination: { name: string } | null;
            } | null;
        } | null;
    } | null;
}

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState<UserTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    id,
                    qr_token,
                    ticket_status,
                    created_at,
                    booking:bookings!inner(
                        id,
                        passenger_name,
                        seat_number,
                        total_price,
                        booking_source,
                        passenger_id,
                        trip:trips(
                            departure_time,
                            bus:buses(bus_number),
                            route:routes(
                                origin:origin_terminal_id(name),
                                destination:destination_terminal_id(name)
                            )
                        )
                    )
                `)
                .eq('booking.passenger_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching tickets:", error);
            } else if (data) {
                setTickets(data as any);
            }
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">My Digital Tickets</h1>
                <p className="text-muted-foreground">Present your digital QR ticket to the conductor when boarding.</p>
            </div>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">Loading your tickets...</div>
            ) : tickets.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {tickets.map((t) => {
                        const booking = t.booking;
                        const trip = booking?.trip;
                        const origin = trip?.route?.origin?.name || "Origin";
                        const dest = trip?.route?.destination?.name || "Destination";
                        const busNum = trip?.bus?.bus_number || "Superlines Express";
                        const depTime = trip?.departure_time ? new Date(trip.departure_time) : new Date();

                        return (
                            <Card key={t.id} className="relative overflow-hidden border-2 shadow-lg">
                                {/* Ticket Status Banner */}
                                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-white flex justify-between items-center ${
                                    t.ticket_status === 'USED'
                                        ? 'bg-zinc-600'
                                        : t.ticket_status === 'VALID'
                                        ? 'bg-emerald-600'
                                        : 'bg-yellow-600'
                                }`}>
                                    <span>Superlines Digital Ticket</span>
                                    <span>{t.ticket_status}</span>
                                </div>

                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between border-b pb-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Passenger</p>
                                            <p className="font-bold text-base">{booking?.passenger_name || "Passenger"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Seat Number</p>
                                            <p className="font-mono text-xl font-black text-blue-600">
                                                #{booking?.seat_number ? (booking.seat_number < 10 ? `0${booking.seat_number}` : booking.seat_number) : "--"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Route & Bus</p>
                                        <p className="text-lg font-extrabold flex items-center gap-2">
                                            <span>{origin}</span>
                                            <span>➔</span>
                                            <span>{dest}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{busNum} • ₱{booking?.total_price || 850}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-xs border-t pt-3">
                                        <div>
                                            <p className="text-muted-foreground">Departure</p>
                                            <p className="font-semibold">{depTime.toLocaleDateString()} • {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>

                                    {/* QR Code Container */}
                                    <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 p-4 border border-dashed">
                                        <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-white p-2 border shadow-inner">
                                            {/* Generated SVG QR Visual Representation */}
                                            <svg viewBox="0 0 100 100" className="h-full w-full">
                                                <rect width="100" height="100" fill="white" />
                                                {/* Corner Position Detection Patterns */}
                                                <rect x="5" y="5" width="25" height="25" fill="black" />
                                                <rect x="8" y="8" width="19" height="19" fill="white" />
                                                <rect x="12" y="12" width="11" height="11" fill="black" />

                                                <rect x="70" y="5" width="25" height="25" fill="black" />
                                                <rect x="73" y="8" width="19" height="19" fill="white" />
                                                <rect x="77" y="12" width="11" height="11" fill="black" />

                                                <rect x="5" y="70" width="25" height="25" fill="black" />
                                                <rect x="8" y="73" width="19" height="19" fill="white" />
                                                <rect x="12" y="77" width="11" height="11" fill="black" />

                                                {/* Data matrix representation */}
                                                <rect x="35" y="10" width="10" height="10" fill="black" />
                                                <rect x="50" y="20" width="10" height="10" fill="black" />
                                                <rect x="10" y="35" width="10" height="10" fill="black" />
                                                <rect x="35" y="35" width="20" height="20" fill="black" />
                                                <rect x="65" y="35" width="10" height="10" fill="black" />
                                                <rect x="40" y="65" width="15" height="15" fill="black" />
                                                <rect x="70" y="70" width="20" height="20" fill="black" />
                                            </svg>
                                        </div>
                                        <p className="mt-2 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wider">
                                            {t.qr_token}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-12 text-center text-muted-foreground">
                    <Ticket className="mx-auto h-12 w-12 text-zinc-400 mb-3" />
                    <h3 className="text-lg font-bold text-foreground">No Tickets Found</h3>
                    <p className="text-sm mt-1">You haven&apos;t booked any tickets yet.</p>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/book'}>
                        Book a Trip Now
                    </Button>
                </Card>
            )}
        </div>
    );
}
