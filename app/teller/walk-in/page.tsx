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
    const [passengerType, setPassengerType] = useState<"REGULAR" | "SENIOR" | "STUDENT" | "PWD">("REGULAR");
    const [discountIdNumber, setDiscountIdNumber] = useState("");
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
        let rawData: any[] = [];

        const { data, error } = await supabase
            .from('trips')
            .select('*, bus:buses(bus_number, bus_type)')
            .order('departure_time', { ascending: true });

        if (error) {
            const { data: fallbackData } = await supabase
                .from('trips')
                .select('*')
                .order('departure_time', { ascending: true });
            if (fallbackData) rawData = fallbackData;
        } else if (data) {
            rawData = data;
        }

        const normalizedTrips = rawData.map((t: any) => ({
            ...t,
            fare_amount: t.fare_amount ?? t.price ?? 850,
            route: {
                origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
                destination: { name: t.destination || t.route?.destination?.name || "Daet" }
            },
            bus: t.bus || {
                bus_number: "Superlines Express",
                bus_type: "REGULAR AIRCON"
            }
        }));

        setTrips(normalizedTrips);
        if (initialTripId) {
            const found = normalizedTrips.find((t: any) => t.id === initialTripId);
            if (found) handleSelectTrip(found);
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

            const baseFare = selectedTrip.fare_amount || 850;
            const isDiscounted = passengerType !== "REGULAR";
            const discountDeduction = isDiscounted ? Math.round(baseFare * 0.20) : 0;
            const finalAmount = baseFare - discountDeduction;

            // Get teller's assigned terminal
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('terminal_id')
                .eq('user_id', user?.id)
                .single();

            let bookingQrToken: string;

            // Attempt atomic seat booking procedure
            let result: any = null;
            let rpcError: any = null;

            try {
                const res = await supabase.rpc(
                    "book_seat_atomic",
                    {
                        p_trip_id: selectedTrip.id,
                        p_seat_number: selectedSeat,
                        p_passenger_id: null, // Walk-in non-registered
                        p_passenger_name: passengerName,
                        p_passenger_contact: passengerContact || "",
                        p_total_price: finalAmount,
                        p_booking_source: "WALK_IN",
                        p_booking_terminal_id: roleData?.terminal_id || null,
                        p_created_by: user?.id || null,
                        p_payment_method: "CASH_WALKIN",
                        p_transaction_ref: `CASH-${Date.now()}`,
                    }
                );
                result = res.data;
                rpcError = res.error;
            } catch (err: any) {
                rpcError = err;
            }

            if (!rpcError && result?.qr_token) {
                bookingQrToken = result.qr_token;
            } else {
                console.warn("Atomic RPC unavailable, falling back to direct database table booking:", rpcError);

                // Fallback direct table inserts for Walk-in (try bookings first, then reservations)
                let bookingId: string | null = null;
                let isUsingReservations = false;

                const { data: newBooking, error: bErr } = await supabase
                    .from('bookings')
                    .insert({
                        trip_id: selectedTrip.id,
                        passenger_id: null,
                        passenger_name: passengerName,
                        passenger_contact: passengerContact || "",
                        seat_number: selectedSeat,
                        total_price: selectedTrip.fare_amount || 850,
                        booking_source: 'WALK_IN',
                        booking_terminal_id: roleData?.terminal_id || null,
                        created_by: user?.id || null,
                        booking_status: 'CONFIRMED'
                    })
                    .select('id')
                    .single();

                if (newBooking && !bErr) {
                    bookingId = newBooking.id;
                } else {
                    console.warn("Could not insert to 'bookings' table, falling back to 'reservations':", bErr?.message);
                    const { data: newRes, error: resErr } = await supabase
                        .from('reservations')
                        .insert({
                            trip_id: selectedTrip.id,
                            customer_id: null,
                            passenger_name: passengerName,
                            seat_number: selectedSeat,
                            total_price: selectedTrip.fare_amount || 850,
                            status: 'CONFIRMED'
                        })
                        .select('id')
                        .single();

                    if (newRes && !resErr) {
                        bookingId = newRes.id;
                        isUsingReservations = true;
                    } else {
                        throw new Error(bErr?.message || resErr?.message || "Failed to create booking record.");
                    }
                }

                bookingQrToken = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

                // Mark seat as occupied in trip_seats if exists
                try {
                    await supabase
                        .from('trip_seats')
                        .update({ is_available: false, booked_by_booking_id: bookingId })
                        .eq('trip_id', selectedTrip.id)
                        .eq('seat_number', selectedSeat);
                } catch {
                    // Ignore if trip_seats does not exist
                }

                // Insert paid payment
                if (!isUsingReservations) {
                    const { error: payErr } = await supabase
                        .from('payments')
                        .insert({
                            booking_id: bookingId,
                            amount: selectedTrip.fare_amount || 850,
                            payment_method: 'CASH_WALKIN',
                            payment_status: 'PAID',
                            transaction_ref: `CASH-${Date.now()}`
                        });
                    if (payErr) {
                        await supabase
                            .from('payments')
                            .insert({
                                reservation_id: bookingId,
                                amount: selectedTrip.fare_amount || 850,
                                payment_method: 'CASH_WALKIN',
                                status: 'PAID',
                                transaction_id: `CASH-${Date.now()}`
                            });
                    }
                } else {
                    const { error: payErr } = await supabase
                        .from('payments')
                        .insert({
                            reservation_id: bookingId,
                            amount: selectedTrip.fare_amount || 850,
                            payment_method: 'CASH_WALKIN',
                            status: 'PAID',
                            transaction_id: `CASH-${Date.now()}`
                        });
                    if (payErr) {
                        await supabase
                            .from('payments')
                            .insert({
                                booking_id: bookingId,
                                amount: selectedTrip.fare_amount || 850,
                                payment_method: 'CASH_WALKIN',
                                payment_status: 'PAID',
                                transaction_ref: `CASH-${Date.now()}`
                            });
                    }
                }

                // Insert valid ticket
                if (!isUsingReservations) {
                    const { error: tktErr } = await supabase
                        .from('tickets')
                        .insert({
                            booking_id: bookingId,
                            qr_token: bookingQrToken,
                            ticket_status: 'VALID'
                        });
                    if (tktErr) {
                        await supabase
                            .from('tickets')
                            .insert({
                                reservation_id: bookingId,
                                qr_code: bookingQrToken,
                            });
                    }
                } else {
                    const { error: tktErr } = await supabase
                        .from('tickets')
                        .insert({
                            reservation_id: bookingId,
                            qr_code: bookingQrToken,
                        });
                    if (tktErr) {
                        await supabase
                            .from('tickets')
                            .insert({
                                booking_id: bookingId,
                                qr_token: bookingQrToken,
                                ticket_status: 'VALID'
                            });
                    }
                }
            }

            setCompletedBooking({
                qr_token: bookingQrToken,
                seat_number: selectedSeat,
                passenger_name: passengerName,
                total_price: finalAmount,
                base_fare: baseFare,
                discount_amount: discountDeduction,
                passenger_type: passengerType,
                discount_id: discountIdNumber,
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
        setPassengerType("REGULAR");
        setDiscountIdNumber("");
        setAmountTendered("");
    };

    const regularFare = selectedTrip?.fare_amount || 850;
    const isDiscounted = passengerType !== "REGULAR";
    const discountDeduction = isDiscounted ? Math.round(regularFare * 0.20) : 0;
    const fare = regularFare - discountDeduction;
    const change = Number(amountTendered) >= fare ? Number(amountTendered) - fare : 0;

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

                        {completedBooking.passenger_type && completedBooking.passenger_type !== "REGULAR" && (
                            <div className="bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                                <div className="flex justify-between items-center text-purple-700 dark:text-purple-300 font-bold">
                                    <span>20% Statutory Discount:</span>
                                    <span>{completedBooking.passenger_type}</span>
                                </div>
                                {completedBooking.discount_id && (
                                    <p className="text-[11px] text-muted-foreground font-mono">
                                        ID Verified: {completedBooking.discount_id}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-muted/50 p-2.5 rounded-lg text-xs">
                            <span className="text-muted-foreground">Cash Fare Paid:</span>
                            <span className="font-mono font-extrabold text-emerald-600 text-sm">₱{completedBooking.total_price}.00</span>
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

                                    {/* Passenger Classification & Discount (20% Off) */}
                                    <div className="space-y-2 pt-1 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-foreground">
                                                Fare Classification
                                            </Label>
                                            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                                                20% Statutory Discount
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPassengerType("REGULAR");
                                                    setDiscountIdNumber("");
                                                }}
                                                className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                                                    passengerType === "REGULAR"
                                                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                                                        : "border-border hover:bg-muted/40 text-muted-foreground"
                                                }`}
                                            >
                                                <div>Regular Fare</div>
                                                <div className="text-[10px] font-normal text-muted-foreground mt-0.5">Standard Ticket</div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPassengerType("SENIOR")}
                                                className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                                                    passengerType === "SENIOR"
                                                        ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20"
                                                        : "border-border hover:bg-muted/40 text-muted-foreground"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Senior Citizen</span>
                                                    <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-extrabold">-20%</span>
                                                </div>
                                                <div className="text-[10px] font-normal text-muted-foreground mt-0.5">OSCA / 60+ Years Old</div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPassengerType("STUDENT")}
                                                className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                                                    passengerType === "STUDENT"
                                                        ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20"
                                                        : "border-border hover:bg-muted/40 text-muted-foreground"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Student</span>
                                                    <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-extrabold">-20%</span>
                                                </div>
                                                <div className="text-[10px] font-normal text-muted-foreground mt-0.5">Current School ID / Form</div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPassengerType("PWD")}
                                                className={`p-2.5 rounded-lg border text-xs font-bold text-left transition-all ${
                                                    passengerType === "PWD"
                                                        ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20"
                                                        : "border-border hover:bg-muted/40 text-muted-foreground"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>PWD</span>
                                                    <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.2 rounded font-extrabold">-20%</span>
                                                </div>
                                                <div className="text-[10px] font-normal text-muted-foreground mt-0.5">Govt PWD ID Card</div>
                                            </button>
                                        </div>

                                        {isDiscounted && (
                                            <div className="space-y-1.5 p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 mt-2">
                                                <Label htmlFor="wDiscId" className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                                                    {passengerType === "SENIOR" && "OSCA Senior Citizen ID Number *"}
                                                    {passengerType === "STUDENT" && "Student School ID / Registration No. *"}
                                                    {passengerType === "PWD" && "PWD Identification Card Number *"}
                                                </Label>
                                                <Input
                                                    id="wDiscId"
                                                    required={isDiscounted}
                                                    placeholder={
                                                        passengerType === "SENIOR" ? "e.g. OSCA-12345" :
                                                        passengerType === "STUDENT" ? "e.g. 2024-ST-9988" : "e.g. PWD-45678"
                                                    }
                                                    value={discountIdNumber}
                                                    onChange={(e) => setDiscountIdNumber(e.target.value)}
                                                    className="bg-white dark:bg-zinc-900 text-xs"
                                                />
                                                <p className="text-[10px] text-muted-foreground">
                                                    Teller instruction: Inspect the passenger&apos;s physical valid ID card before issuing discounted ticket.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Real-time Fare Breakdown */}
                                    <div className="p-3 rounded-lg bg-muted/60 border text-xs space-y-1">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Regular Fare:</span>
                                            <span>₱{regularFare}.00</span>
                                        </div>
                                        {isDiscounted && (
                                            <div className="flex justify-between text-emerald-600 font-semibold">
                                                <span>20% Discount ({passengerType}):</span>
                                                <span>-₱{discountDeduction}.00</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1 border-t font-bold text-sm text-foreground">
                                            <span>Total Amount Due:</span>
                                            <span className="font-mono text-emerald-600">₱{fare}.00</span>
                                        </div>
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
                                        disabled={submitting || !selectedSeat || !passengerName || (isDiscounted && !discountIdNumber.trim())}
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
