"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatPicker } from "@/components/seat-picker";
import { Ticket, Bus, ArrowRight, Printer, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TellerWalkInBookingPage() {
    const searchParams = useSearchParams();
    const initialTripId = searchParams?.get("trip_id");

    const [trips, setTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<any>(null);
    const [bookedSeats, setBookedSeats] = useState<number[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form inputs
    const [passengerName, setPassengerName] = useState("");
    const [passengerContact, setPassengerContact] = useState("");
    const [amountTendered, setAmountTendered] = useState<string>("");

    // Success Ticket Modal State
    const [completedBooking, setCompletedBooking] = useState<any>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        setLoading(true);
        const { data, error } = await supabase
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
            .order('departure_time', { ascending: true });

        if (error) {
            console.error("Error fetching trips:", error);
        } else if (data) {
            setTrips(data);
            if (initialTripId) {
                const found = data.find(t => t.id === initialTripId);
                if (found) handleSelectTrip(found);
            }
        }
        setLoading(false);
    };

    const handleSelectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        setSelectedSeat(null);
        setError(null);
        setLoading(true);

        const { data: seatsData } = await supabase
            .from('trip_seats')
            .select('seat_number, is_available')
            .eq('trip_id', trip.id)
            .eq('is_available', false);

        if (seatsData) {
            setBookedSeats(seatsData.map(s => s.seat_number));
        }

        setLoading(false);
    };

    const handleProcessWalkInPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip || !selectedSeat || !passengerName) return;

        setError(null);
        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Get teller's assigned terminal
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('terminal_id')
                .eq('user_id', user?.id)
                .single();

            // Call atomic seat booking function
            const { data: result, error: rpcError } = await supabase.rpc(
                "book_seat_atomic",
                {
                    p_trip_id: selectedTrip.id,
                    p_seat_number: selectedSeat,
                    p_passenger_id: null, // Walk-in non-registered
                    p_passenger_name: passengerName,
                    p_passenger_contact: passengerContact || "",
                    p_total_price: selectedTrip.fare_amount || 850,
                    p_booking_source: "WALK_IN",
                    p_booking_terminal_id: roleData?.terminal_id || null,
                    p_created_by: user?.id || null,
                    p_payment_method: "CASH_WALKIN",
                    p_transaction_ref: `CASH-${Date.now()}`,
                }
            );

            if (rpcError) {
                throw new Error(rpcError.message || "Seat booking failed.");
            }

            setCompletedBooking({
                qr_token: result.qr_token,
                seat_number: selectedSeat,
                passenger_name: passengerName,
                total_price: selectedTrip.fare_amount || 850,
                trip: selectedTrip,
            });

            // Refresh seats list
            setBookedSeats((prev) => [...prev, selectedSeat]);
        } catch (err: any) {
            console.error("Walk-in booking error:", err);
            setError(err.message || "Failed to issue walk-in ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetForm = () => {
        setCompletedBooking(null);
        setSelectedSeat(null);
        setPassengerName("");
        setPassengerContact("");
        setAmountTendered("");
    };

    const fare = selectedTrip?.fare_amount || 850;
    const change = Number(amountTendered) > fare ? Number(amountTendered) - fare : 0;

    return (
        <div className="container mx-auto max-w-5xl space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Terminal Walk-in Reservation</h1>
                    <p className="text-sm text-muted-foreground">Process instant physical cash tickets for passengers at counter.</p>
                </div>
                {selectedTrip && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedTrip(null)}>
                        Change Trip Schedule
                    </Button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* ISSUED TICKET SUCCESS MODAL VIEW */}
            {completedBooking ? (
                <Card className="mx-auto max-w-md border-2 border-emerald-500 shadow-xl print:border-none print:shadow-none">
                    <CardHeader className="bg-emerald-600 text-white text-center rounded-t-xl print:bg-white print:text-black">
                        <CheckCircle className="mx-auto h-12 w-12 mb-2 print:hidden" />
                        <CardTitle className="text-xl">TICKET ISSUED SUCCESSFULLY</CardTitle>
                        <CardDescription className="text-emerald-100 text-xs print:text-black">Superlines Walk-in Ticket Receipt</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b pb-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Passenger Name</p>
                                <p className="font-bold text-base">{completedBooking.passenger_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Seat</p>
                                <p className="font-mono text-2xl font-black text-blue-600">#{completedBooking.seat_number}</p>
                            </div>
                        </div>

                        <div className="text-xs space-y-1">
                            <p className="text-muted-foreground">Route</p>
                            <p className="font-bold text-sm">
                                {completedBooking.trip.route?.origin?.name} ➔ {completedBooking.trip.route?.destination?.name}
                            </p>
                            <p className="text-muted-foreground">
                                Bus: {completedBooking.trip.bus?.bus_number} • Schedule: {new Date(completedBooking.trip.departure_time).toLocaleString()}
                            </p>
                        </div>

                        {/* Generated SVG QR Code */}
                        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-4 border border-dashed">
                            <div className="h-28 w-28 bg-white p-2 border rounded">
                                <svg viewBox="0 0 100 100" className="h-full w-full">
                                    <rect width="100" height="100" fill="white" />
                                    <rect x="5" y="5" width="25" height="25" fill="black" />
                                    <rect x="8" y="8" width="19" height="19" fill="white" />
                                    <rect x="12" y="12" width="11" height="11" fill="black" />
                                    <rect x="70" y="5" width="25" height="25" fill="black" />
                                    <rect x="73" y="8" width="19" height="19" fill="white" />
                                    <rect x="77" y="12" width="11" height="11" fill="black" />
                                    <rect x="5" y="70" width="25" height="25" fill="black" />
                                    <rect x="8" y="73" width="19" height="19" fill="white" />
                                    <rect x="12" y="77" width="11" height="11" fill="black" />
                                    <rect x="35" y="10" width="10" height="10" fill="black" />
                                    <rect x="50" y="20" width="10" height="10" fill="black" />
                                    <rect x="35" y="35" width="20" height="20" fill="black" />
                                    <rect x="65" y="35" width="10" height="10" fill="black" />
                                    <rect x="40" y="65" width="15" height="15" fill="black" />
                                </svg>
                            </div>
                            <p className="mt-2 font-mono text-xs font-bold">{completedBooking.qr_token}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 print:hidden">
                        <Button className="w-full" variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Print Ticket
                        </Button>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleResetForm}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Next Walk-in
                        </Button>
                    </CardFooter>
                </Card>
            ) : !selectedTrip ? (
                /* STEP 1: SELECT TRIP SCHEDULE */
                <div className="space-y-4">
                    <h2 className="text-lg font-bold">1. Select Trip Schedule</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {trips.map((t) => {
                            const origin = t.route?.origin?.name || "Origin";
                            const dest = t.route?.destination?.name || "Destination";
                            const busNum = t.bus?.bus_number || "Bus TBD";
                            const depTime = new Date(t.departure_time);

                            return (
                                <Card key={t.id} className="cursor-pointer transition-all hover:border-emerald-500 hover:shadow-md" onClick={() => handleSelectTrip(t)}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between text-xs font-bold text-emerald-600">
                                            <span>{busNum}</span>
                                            <span className="text-base font-extrabold text-foreground">₱{t.fare_amount || 850}</span>
                                        </div>
                                        <CardTitle className="text-base flex items-center justify-between mt-1">
                                            <span>{origin}</span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <span>{dest}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground">
                                        Departure: {depTime.toLocaleDateString()} {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* STEP 2: SEAT PICKER & PASSENGER CASH PAYMENT */
                <div className="grid gap-8 md:grid-cols-2">
                    <div>
                        <h2 className="text-lg font-bold mb-4">2. Select Seat</h2>
                        <SeatPicker
                            totalSeats={45}
                            bookedSeats={bookedSeats}
                            selectedSeat={selectedSeat}
                            onSelectSeat={(seatNum) => setSelectedSeat(seatNum)}
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold mb-4">3. Passenger Info & Cash Payment</h2>
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                                    <p className="font-bold text-sm">
                                        {selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name}
                                    </p>
                                    <p className="text-muted-foreground">Fare Amount: <span className="font-bold text-foreground">₱{fare}</span></p>
                                    <p className="text-muted-foreground">Selected Seat: <span className="font-bold text-blue-600">{selectedSeat ? `#${selectedSeat}` : "None Selected"}</span></p>
                                </div>

                                <form onSubmit={handleProcessWalkInPayment} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="wName">Passenger Name *</Label>
                                        <Input
                                            id="wName"
                                            required
                                            placeholder="Juan Dela Cruz"
                                            value={passengerName}
                                            onChange={(e) => setPassengerName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="wContact">Contact Number</Label>
                                        <Input
                                            id="wContact"
                                            placeholder="09171234567"
                                            value={passengerContact}
                                            onChange={(e) => setPassengerContact(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="wAmount">Cash Amount Tendered (₱)</Label>
                                        <Input
                                            id="wAmount"
                                            type="number"
                                            placeholder={`Minimum ₱${fare}`}
                                            value={amountTendered}
                                            onChange={(e) => setAmountTendered(e.target.value)}
                                        />
                                        {Number(amountTendered) >= fare && (
                                            <p className="text-xs font-bold text-emerald-600">
                                                Change: ₱{change.toFixed(2)}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                        disabled={submitting || !selectedSeat || !passengerName}
                                    >
                                        {submitting ? "Processing Walk-in..." : `Confirm & Issue Cash Ticket (₱${fare})`}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
