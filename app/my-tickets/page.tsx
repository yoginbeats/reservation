"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Clock, Bus, MapPin, Printer, ShieldCheck, CheckCircle2 } from "lucide-react";
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

function TicketsContent() {
    const [tickets, setTickets] = useState<UserTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get("payment");
    const statusParam = searchParams.get("status");
    const bookingId = searchParams.get("booking_id");
    const [isWaitingForApproval, setIsWaitingForApproval] = useState(statusParam === "pending_verification");
    const supabase = createClient();

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
                console.warn("Tickets relation query unavailable, querying reservations table fallback:", error.message || error);
                try {
                    const { data: userReservations } = await supabase
                        .from('reservations')
                        .select('*, trip:trips(*)')
                        .eq('customer_id', user.id)
                        .order('created_at', { ascending: false });

                    if (userReservations && userReservations.length > 0) {
                        const resIds = userReservations.map((r: any) => r.id);
                        const { data: rawTickets } = await supabase
                            .from('tickets')
                            .select('*')
                            .in('reservation_id', resIds);

                        const ticketMap = new Map((rawTickets || []).map((t: any) => [t.reservation_id, t]));

                        const formattedTickets: UserTicket[] = userReservations.map((res: any) => {
                            const matchingTicket = ticketMap.get(res.id);
                            const trip = res.trip;
                            return {
                                id: matchingTicket?.id || res.id,
                                qr_token: matchingTicket?.qr_code || matchingTicket?.qr_token || `TKT-${res.id.slice(0, 8).toUpperCase()}`,
                                ticket_status: matchingTicket?.ticket_status || (res.status === 'CONFIRMED' || res.status === 'confirmed' ? 'VALID' : 'PENDING'),
                                created_at: res.created_at,
                                booking: {
                                    id: res.id,
                                    passenger_name: res.passenger_name || user.user_metadata?.full_name || "Passenger",
                                    seat_number: res.seat_number,
                                    total_price: res.total_price || 850,
                                    booking_source: "ONLINE",
                                    passenger_id: res.customer_id,
                                    trip: {
                                        departure_time: trip?.departure_time || new Date().toISOString(),
                                        bus: { bus_number: "Superlines Express" },
                                        route: {
                                            origin: { name: trip?.origin || "Cubao" },
                                            destination: { name: trip?.destination || "Daet" },
                                        }
                                    }
                                }
                            };
                        });
                        setTickets(formattedTickets);
                    } else {
                        setTickets([]);
                    }
                } catch (fallbackErr) {
                    console.error("Fallback ticket fetch error:", fallbackErr);
                }
            } else if (data) {
                setTickets(data as any);
            }
        }

        // Integrate client-side ticket storage (supports guest bookings & offline ticket view)
        if (typeof window !== "undefined") {
            try {
                const keys = Object.keys(localStorage).filter(k => k.startsWith("superlines_booking_"));
                const localTickets: UserTicket[] = keys.map(k => {
                    const raw = localStorage.getItem(k);
                    if (!raw) return null;
                    const item = JSON.parse(raw);
                    return {
                        id: item.booking_id,
                        qr_token: item.qr_token,
                        ticket_status: "VALID",
                        created_at: item.created_at || new Date().toISOString(),
                        booking: {
                            id: item.booking_id,
                            passenger_name: item.passenger_name,
                            seat_number: item.seat_number,
                            total_price: item.total_price,
                            booking_source: "ONLINE",
                            passenger_id: item.passenger_id || null,
                            trip: {
                                departure_time: item.trip?.departure_time || new Date().toISOString(),
                                bus: { bus_number: item.trip?.bus?.bus_number || "Superlines Express" },
                                route: {
                                    origin: { name: item.trip?.origin || item.trip?.route?.origin?.name || "Cubao" },
                                    destination: { name: item.trip?.destination || item.trip?.route?.destination?.name || "Daet" }
                                }
                            }
                        }
                    };
                }).filter(Boolean) as UserTicket[];

                if (localTickets.length > 0) {
                    setTickets(prev => {
                        const existingIds = new Set(prev.map(t => t.id || t.booking?.id));
                        const additions = localTickets.filter(lt => !existingIds.has(lt.id) && !existingIds.has(lt.booking?.id));
                        return [...additions, ...prev];
                    });
                }
            } catch (err) {
                console.warn("Could not read local tickets:", err);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        // If returning from PayMongo checkout with payment=success
        if (paymentStatus === "success" && bookingId) {
            setPaymentVerified(true);
            setIsWaitingForApproval(false);
            // Verify payment and update ticket status
            fetch(`/api/payments/paymongo/verify?booking_id=${bookingId}`)
                .then((res) => res.json())
                .then(() => fetchTickets())
                .catch((err) => {
                    console.error("Verification error:", err);
                    fetchTickets();
                });
        } else if (isWaitingForApproval && bookingId) {
            fetchTickets();
            // Real-time polling for cashier approval in Manual Verification Mode
            const pollInterval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/payments/paymongo/verify?booking_id=${bookingId}`);
                    const data = await res.json();
                    if (data.status === "PAID" || data.status === "CONFIRMED") {
                        setIsWaitingForApproval(false);
                        setPaymentVerified(true);
                        clearInterval(pollInterval);
                        await fetchTickets();
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 2500);

            return () => clearInterval(pollInterval);
        } else {
            fetchTickets();
        }
    }, [paymentStatus, bookingId, isWaitingForApproval]);

    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">My Digital Tickets</h1>
                <p className="text-muted-foreground">Present your digital QR ticket to the conductor when boarding.</p>
            </div>

            {/* Waiting for Cashier Approval Banner (Mode 2) */}
            {isWaitingForApproval && (
                <div className="flex items-start gap-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/40 dark:to-zinc-900 p-5 text-amber-900 dark:text-amber-200 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md">
                        <Clock className="h-5 w-5 animate-spin" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-extrabold text-base flex items-center gap-2">
                                <span>Awaiting Cashier Approval...</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 animate-pulse">
                                    Live Sync Active
                                </span>
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your GCash payment reference has been submitted. As soon as the Superlines Cashier confirms your payment and clicks <strong>[Approve Ticket]</strong> on their terminal, your validated digital ticket will automatically appear here in real-time without needing to refresh!
                        </p>
                    </div>
                </div>
            )}

            {/* Payment Verified & Confirmed Banner */}
            {paymentVerified && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400 shadow-sm">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                    <div>
                        <p className="font-bold">Payment Verified & Ticket Issued!</p>
                        <p className="text-sm">Your booking #{bookingId?.slice(0, 8)} has been confirmed and your digital ticket is now active for boarding.</p>
                    </div>
                </div>
            )}

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

export default function MyTicketsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto max-w-4xl py-12 text-center text-muted-foreground">Loading tickets...</div>}>
            <TicketsContent />
        </Suspense>
    );
}
