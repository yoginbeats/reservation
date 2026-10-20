"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatPicker } from "@/components/seat-picker";
import { Ticket, Bus, ArrowRight, Printer, CheckCircle, AlertCircle, RefreshCw, Calculator } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DiscountPerson {
    id: string;
    name: string;
    classification: "SENIOR" | "STUDENT" | "PWD";
    idNumber: string;
}

export default function TellerWalkInBookingPage() {
    const searchParams = useSearchParams();
    const initialTripId = searchParams?.get("trip_id");

    const [trips, setTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<any>(null);
    const [bookedSeats, setBookedSeats] = useState<number[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form inputs
    const [passengerName, setPassengerName] = useState("");
    const [passengerContact, setPassengerContact] = useState("");
    const [discountCount, setDiscountCount] = useState<number>(0);
    const [discountPersons, setDiscountPersons] = useState<DiscountPerson[]>([]);
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

        let finalTrips = normalizedTrips;
        if (finalTrips.length === 0) {
            try {
                const res = await fetch("/api/trips/available");
                const availData = await res.json();
                if (availData?.trips && Array.isArray(availData.trips)) {
                    finalTrips = availData.trips.map((t: any) => ({
                        ...t,
                        fare_amount: t.fare_amount ?? 850,
                        route: {
                            origin: { name: t.origin || "Cubao" },
                            destination: { name: t.destination || "Daet" }
                        },
                        bus: {
                            bus_number: t.bus_number || "SL-401 (Superlines Aircon)",
                            bus_type: t.bus_type || "REGULAR AIRCON"
                        }
                    }));
                }
            } catch {}
        }

        setTrips(finalTrips);
        if (initialTripId) {
            const found = finalTrips.find((t: any) => t.id === initialTripId);
            if (found) handleSelectTrip(found);
        }
        setLoading(false);
    };

    const handleSelectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        setSelectedSeat(null);
        setSelectedSeats([]);
        setDiscountCount(0);
        setDiscountPersons([]);
        setError(null);
        setLoading(true);

        const busNum = trip.bus?.bus_number || trip.bus_number || "";
        const depTime = trip.departure_time || "";

        try {
            // 1. Fetch from live cross-terminal anti-double booking API
            const res = await fetch(`/api/trips/seats?tripId=${encodeURIComponent(trip.id)}&busNumber=${encodeURIComponent(busNum)}&departureTime=${encodeURIComponent(depTime)}`);
            const data = await res.json();
            if (data?.success && Array.isArray(data.occupied_seats)) {
                setBookedSeats(data.occupied_seats);
            } else {
                // Fallback to direct supabase query
                const { data: seatsData } = await supabase
                    .from('trip_seats')
                    .select('seat_number, is_available')
                    .eq('trip_id', trip.id)
                    .eq('is_available', false);

                if (seatsData) {
                    setBookedSeats(seatsData.map(s => s.seat_number));
                }
            }
        } catch {
            const { data: seatsData } = await supabase
                .from('trip_seats')
                .select('seat_number, is_available')
                .eq('trip_id', trip.id)
                .eq('is_available', false);

            if (seatsData) {
                setBookedSeats(seatsData.map(s => s.seat_number));
            }
        } finally {
            setLoading(false);
        }
    };

    // Multi-seat and Automatic Statutory 20% Discount Calculations
    const seatCount = selectedSeats.length > 0 ? selectedSeats.length : (selectedSeat ? 1 : 0);
    const unitFare = Number(selectedTrip?.fare_amount || 850);
    const totalBaseFare = unitFare * (seatCount || 1);
    const discountRate = 0.20;
    const discountPerPassenger = Math.round(unitFare * discountRate);

    // Number of discounted passengers cannot exceed seats booked
    const maxDiscountAllowed = Math.max(0, seatCount);
    const effectiveDiscountCount = Math.min(discountCount, maxDiscountAllowed);
    const totalDiscountAmount = effectiveDiscountCount * discountPerPassenger;
    const fare = Math.max(0, totalBaseFare - totalDiscountAmount);
    const change = Number(amountTendered) >= fare ? Number(amountTendered) - fare : 0;

    const handleSetDiscountCount = (count: number) => {
        const validCount = Math.min(Math.max(0, count), Math.max(1, seatCount || 1));
        setDiscountCount(validCount);
        setDiscountPersons((prev) => {
            const next = [...prev];
            if (validCount > prev.length) {
                for (let i = prev.length; i < validCount; i++) {
                    next.push({
                        id: `walkin_disc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                        name: i === 0 && passengerName ? passengerName : "",
                        classification: "SENIOR",
                        idNumber: "",
                    });
                }
            } else if (validCount < prev.length) {
                return next.slice(0, validCount);
            }
            return next;
        });
    };

    const handleUpdateDiscountPerson = (index: number, field: keyof DiscountPerson, value: string) => {
        setDiscountPersons((prev) => {
            const next = [...prev];
            if (next[index]) {
                next[index] = { ...next[index], [field]: value };
            }
            return next;
        });
    };

    const handleProcessWalkInPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const activeSeats = selectedSeats.length > 0 ? selectedSeats : (selectedSeat ? [selectedSeat] : []);
        if (!selectedTrip || activeSeats.length === 0 || !passengerName.trim()) {
            setError("Please select at least one seat and provide the passenger name.");
            return;
        }

        // Anti-Double Booking Guard: Verify none of the selected seats are already taken
        const alreadyTaken = activeSeats.filter(s => bookedSeats.includes(s));
        if (alreadyTaken.length > 0) {
            setError(`Double-Booking Prevented: Seat(s) ${alreadyTaken.map(s => `#${s}`).join(', ')} are already booked on this departure. Please select other available seats.`);
            return;
        }

        if (effectiveDiscountCount > 0) {
            for (let i = 0; i < effectiveDiscountCount; i++) {
                const p = discountPersons[i];
                if (!p || !p.name.trim()) {
                    setError(`Please enter the full name for Discounted Beneficiary #${i + 1}.`);
                    return;
                }
                if (!p.idNumber.trim()) {
                    setError(`Please enter the ID Number for Discounted Beneficiary #${i + 1} (${p.classification}).`);
                    return;
                }
            }
        }

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

            const primarySeat = activeSeats[0];
            const bookingQrToken = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Create Master Booking record
            let bookingId: string = `walkin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            let isUsingReservations = false;

            const { data: newBooking, error: bErr } = await supabase
                .from('bookings')
                .insert({
                    trip_id: selectedTrip.id,
                    passenger_id: null,
                    passenger_name: passengerName,
                    passenger_contact: passengerContact || "",
                    seat_number: primarySeat,
                    total_price: fare,
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
                        seat_number: primarySeat,
                        total_price: fare,
                        status: 'CONFIRMED'
                    })
                    .select('id')
                    .single();

                if (newRes && !resErr) {
                    bookingId = newRes.id;
                    isUsingReservations = true;
                }
            }

            // Lock ALL selected seats in trip_seats table
            try {
                for (const seatNum of activeSeats) {
                    await supabase
                        .from('trip_seats')
                        .update({ is_available: false, booked_by_booking_id: bookingId })
                        .eq('trip_id', selectedTrip.id)
                        .eq('seat_number', seatNum);
                }
            } catch (seatErr) {
                console.warn("trip_seats lock notice:", seatErr);
            }

            // Insert paid payment record
            try {
                if (!isUsingReservations) {
                    await supabase
                        .from('payments')
                        .insert({
                            booking_id: bookingId,
                            amount: fare,
                            payment_method: 'CASH_WALKIN',
                            payment_status: 'PAID',
                            transaction_ref: `CASH-${Date.now()}`
                        });
                } else {
                    await supabase
                        .from('payments')
                        .insert({
                            reservation_id: bookingId,
                            amount: fare,
                            payment_method: 'CASH_WALKIN',
                            status: 'PAID',
                            transaction_id: `CASH-${Date.now()}`
                        });
                }
            } catch (payErr) {
                console.warn("payments insert notice:", payErr);
            }

            // Issue official valid tickets for EACH of the selected seats
            for (const seatNum of activeSeats) {
                const seatQr = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-S${seatNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                try {
                    if (!isUsingReservations) {
                        await supabase
                            .from('tickets')
                            .insert({
                                booking_id: bookingId,
                                qr_token: seatQr,
                                ticket_status: 'VALID'
                            });
                    } else {
                        await supabase
                            .from('tickets')
                            .insert({
                                reservation_id: bookingId,
                                qr_code: seatQr,
                            });
                    }
                } catch (tktErr) {
                    console.warn("ticket insert notice:", tktErr);
                }
            }

            // Sync with local booking store for instant cross-terminal anti-double booking protection
            try {
                const bookingToSync = {
                    id: bookingId,
                    created_at: new Date().toISOString(),
                    passenger_name: passengerName,
                    passenger_contact: passengerContact || "",
                    passenger_email: "walkin@superlines.com",
                    passenger_type: effectiveDiscountCount > 0 ? (effectiveDiscountCount === activeSeats.length ? discountPersons[0]?.classification : "MIXED") : "REGULAR",
                    discount_count: effectiveDiscountCount,
                    discount_amount: totalDiscountAmount,
                    discounted_passengers: discountPersons.slice(0, effectiveDiscountCount).map(p => ({
                        name: p.name,
                        classification: p.classification,
                        id_number: p.idNumber
                    })),
                    seat_number: primarySeat,
                    seat_numbers: activeSeats,
                    seat_count: activeSeats.length,
                    total_price: fare,
                    original_price: totalBaseFare,
                    booking_status: "CONFIRMED",
                    payment_status: "PAID",
                    ticket_status: "VALID",
                    payment_method: "CASH_WALKIN",
                    transaction_ref: `CASH-${Date.now()}`,
                    qr_token: bookingQrToken,
                    trip_id: selectedTrip.id,
                    trip: {
                        id: selectedTrip.id,
                        origin: selectedTrip.route?.origin?.name || selectedTrip.origin || "Cubao",
                        destination: selectedTrip.route?.destination?.name || selectedTrip.destination || "Daet",
                        departure_time: selectedTrip.departure_time,
                        bus_number: selectedTrip.bus?.bus_number || selectedTrip.bus_number || "Superlines Express",
                    }
                };

                fetch("/api/admin/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "save_booking", booking: bookingToSync }),
                }).catch(() => {});
            } catch (storeErr) {
                console.warn("Local store sync notice:", storeErr);
            }

            // Complete booking modal display state
            setCompletedBooking({
                id: bookingId,
                booking_id: bookingId,
                qr_token: bookingQrToken,
                seat_number: primarySeat,
                seat_numbers: activeSeats,
                seat_count: activeSeats.length,
                passenger_name: passengerName,
                passenger_contact: passengerContact,
                total_price: fare,
                base_fare: totalBaseFare,
                discount_amount: totalDiscountAmount,
                discount_count: effectiveDiscountCount,
                discounted_passengers: discountPersons.slice(0, effectiveDiscountCount).map(p => ({
                    name: p.name,
                    classification: p.classification,
                    id_number: p.idNumber
                })),
                amount_tendered: Number(amountTendered) || fare,
                change_amount: change,
                trip: selectedTrip,
            });

            // Update local booked seats list
            setBookedSeats((prev) => [...prev, ...activeSeats]);
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
        setSelectedSeats([]);
        setPassengerName("");
        setPassengerContact("");
        setDiscountCount(0);
        setDiscountPersons([]);
        setAmountTendered("");
        setError(null);
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
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
                                <p className="text-xs text-muted-foreground">Passenger / Contact</p>
                                <p className="font-bold text-base">{completedBooking.passenger_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                    {completedBooking.seat_numbers?.length > 1 ? "Seats" : "Seat"}
                                </p>
                                <p className="font-mono text-xl font-black text-blue-600">
                                    {completedBooking.seat_numbers?.length > 1
                                        ? completedBooking.seat_numbers.map((s: number) => `#${s}`).join(', ')
                                        : `#${completedBooking.seat_number}`}
                                </p>
                            </div>
                        </div>

                        <div className="text-xs space-y-1">
                            <p className="text-muted-foreground">Route & Trip</p>
                            <p className="font-bold text-sm">
                                {completedBooking.trip.route?.origin?.name} ➔ {completedBooking.trip.route?.destination?.name}
                            </p>
                            <p className="text-muted-foreground">
                                Bus: {completedBooking.trip.bus?.bus_number} • Schedule: {new Date(completedBooking.trip.departure_time).toLocaleString()}
                            </p>
                        </div>

                        {/* Discounted Beneficiaries List */}
                        {completedBooking.discounted_passengers && completedBooking.discounted_passengers.length > 0 && (
                            <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-lg border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                                <div className="flex justify-between items-center text-purple-700 dark:text-purple-300 font-bold border-b border-purple-200/50 pb-1">
                                    <span>20% Statutory Discount ({completedBooking.discounted_passengers.length} Beneficiary)</span>
                                    <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-black">-₱{completedBooking.discount_amount}.00</span>
                                </div>
                                <div className="space-y-1.5">
                                    {completedBooking.discounted_passengers.map((p: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-[11px] bg-white dark:bg-zinc-900/60 p-1.5 rounded border border-purple-100 dark:border-purple-900/50">
                                            <div>
                                                <span className="font-bold text-foreground">#{idx + 1} {p.name}</span>
                                                <span className="ml-1 text-[10px] text-purple-600 font-semibold">({p.classification})</span>
                                            </div>
                                            <span className="font-mono text-muted-foreground">ID: {p.id_number}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-muted/50 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Base Fare ({completedBooking.seat_numbers?.length || 1} seat/s):</span>
                                <span>₱{completedBooking.base_fare}.00</span>
                            </div>
                            {completedBooking.discount_amount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-semibold">
                                    <span>Total Statutory Discount:</span>
                                    <span>-₱{completedBooking.discount_amount}.00</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-1 font-bold text-sm">
                                <span>Cash Fare Paid:</span>
                                <span className="font-mono text-emerald-600">₱{completedBooking.total_price}.00</span>
                            </div>
                            {completedBooking.amount_tendered > completedBooking.total_price && (
                                <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                                    <span>Tendered: ₱{completedBooking.amount_tendered}.00</span>
                                    <span className="font-semibold text-emerald-600">Change: ₱{completedBooking.change_amount.toFixed(2)}</span>
                                </div>
                            )}
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">2. Select Seat(s)</h2>
                            {selectedSeats.length > 0 && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                    {selectedSeats.length} Seat{selectedSeats.length > 1 ? "s" : ""} Selected
                                </span>
                            )}
                        </div>
                        <SeatPicker
                            busType={selectedTrip?.bus?.bus_type || selectedTrip?.service_class || "REGULAR_AIRCON"}
                            busNumber={selectedTrip?.bus?.bus_number || selectedTrip?.bus_number}
                            totalSeats={selectedTrip?.bus?.seat_capacity || 49}
                            bookedSeats={bookedSeats}
                            selectedSeat={selectedSeat}
                            selectedSeats={selectedSeats}
                            onSelectSeat={(seatNum) => {
                                setSelectedSeat(seatNum);
                            }}
                            onSelectSeats={(seats) => {
                                setSelectedSeats(seats);
                                if (seats.length > 0) setSelectedSeat(seats[seats.length - 1]);
                                else setSelectedSeat(null);
                                if (discountCount > seats.length) {
                                    handleSetDiscountCount(seats.length);
                                }
                            }}
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
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Unit Fare: <strong className="text-foreground">₱{unitFare}</strong></span>
                                        <span>Seats: <strong className="text-blue-600">
                                            {selectedSeats.length > 0
                                                ? selectedSeats.map((s) => `#${s}`).join(', ')
                                                : (selectedSeat ? `#${selectedSeat}` : "None Selected")}
                                        </strong></span>
                                    </div>
                                </div>

                                <form onSubmit={handleProcessWalkInPayment} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="wName">Primary Passenger / Contact Name *</Label>
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

                                    {/* Discount Quantity Selector: "Ilan ang i-didiscount" */}
                                    <div className="space-y-3 pt-2 border-t">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-xs font-bold text-foreground">
                                                    Ilan ang i-didiscount? (Statutory 20% Discount)
                                                </Label>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Select how many passengers qualify for Senior Citizen, Student, or PWD discount.
                                                </p>
                                            </div>
                                            <span className="text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                                                -20% per passenger
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {Array.from({ length: Math.max(1, seatCount || 1) + 1 }).map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSetDiscountCount(idx)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                        effectiveDiscountCount === idx
                                                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                                                    }`}
                                                >
                                                    {idx === 0 ? "0 (All Regular)" : `${idx} Passenger${idx > 1 ? "s" : ""}`}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Per-Passenger Beneficiary Form (Classification, Name, ID Number) */}
                                        {effectiveDiscountCount > 0 && (
                                            <div className="space-y-3 pt-1">
                                                {Array.from({ length: effectiveDiscountCount }).map((_, idx) => {
                                                    const person = discountPersons[idx] || {
                                                        id: `person_${idx}`,
                                                        name: "",
                                                        classification: "SENIOR" as const,
                                                        idNumber: "",
                                                    };

                                                    return (
                                                        <div
                                                            key={person.id || idx}
                                                            className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-3"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                                                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-black">
                                                                        {idx + 1}
                                                                    </span>
                                                                    Discount Beneficiary #{idx + 1}
                                                                </span>
                                                                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded">
                                                                    Deduction: -₱{discountPerPassenger}.00
                                                                </span>
                                                            </div>

                                                            {/* Classification Pills */}
                                                            <div className="space-y-1">
                                                                <Label className="text-[11px] font-semibold text-muted-foreground">
                                                                    Discount Classification *
                                                                </Label>
                                                                <div className="grid grid-cols-3 gap-1.5">
                                                                    {(["SENIOR", "STUDENT", "PWD"] as const).map((cls) => (
                                                                        <button
                                                                            key={cls}
                                                                            type="button"
                                                                            onClick={() => handleUpdateDiscountPerson(idx, "classification", cls)}
                                                                            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                                                                                person.classification === cls
                                                                                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                                                                    : "bg-white dark:bg-zinc-900 border-border text-muted-foreground hover:bg-muted"
                                                                            }`}
                                                                        >
                                                                            {cls === "SENIOR" && "Senior (OSCA)"}
                                                                            {cls === "STUDENT" && "Student"}
                                                                            {cls === "PWD" && "PWD"}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Discount Person Name */}
                                                            <div className="space-y-1">
                                                                <Label className="text-[11px] font-semibold text-muted-foreground">
                                                                    Beneficiary Full Legal Name *
                                                                </Label>
                                                                <Input
                                                                    required
                                                                    placeholder={`Full name matching ${person.classification} ID`}
                                                                    value={person.name}
                                                                    onChange={(e) => handleUpdateDiscountPerson(idx, "name", e.target.value)}
                                                                    className="bg-white dark:bg-zinc-900 text-xs h-8"
                                                                />
                                                            </div>

                                                            {/* ID Number */}
                                                            <div className="space-y-1">
                                                                <Label className="text-[11px] font-semibold text-muted-foreground">
                                                                    {person.classification === "SENIOR" && "OSCA Senior Citizen ID Number *"}
                                                                    {person.classification === "STUDENT" && "Student School ID / Registration No. *"}
                                                                    {person.classification === "PWD" && "PWD Identification Card Number *"}
                                                                </Label>
                                                                <Input
                                                                    required
                                                                    placeholder={
                                                                        person.classification === "SENIOR" ? "e.g. OSCA-2024-12345" :
                                                                        person.classification === "STUDENT" ? "e.g. 2024-ST-99881" : "e.g. PWD-NCR-45678"
                                                                    }
                                                                    value={person.idNumber}
                                                                    onChange={(e) => handleUpdateDiscountPerson(idx, "idNumber", e.target.value)}
                                                                    className="bg-white dark:bg-zinc-900 text-xs font-mono h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Real-time Fare Breakdown */}
                                    <div className="p-3.5 rounded-xl bg-muted/60 border text-xs space-y-2">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-foreground uppercase tracking-wider pb-1 border-b">
                                            <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Automatic Cash Fare Calculation</span>
                                        </div>

                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Base Fare ({seatCount || 1} seat{seatCount > 1 ? "s" : ""} × ₱{unitFare}.00):</span>
                                            <span className="font-mono font-bold text-foreground">₱{totalBaseFare}.00</span>
                                        </div>

                                        {effectiveDiscountCount > 0 ? (
                                            <div className="flex justify-between text-emerald-600 font-semibold">
                                                <span>20% Statutory Discount ({effectiveDiscountCount} pax × ₱{discountPerPassenger}.00):</span>
                                                <span className="font-mono">-₱{totalDiscountAmount}.00</span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-muted-foreground text-[11px] italic">
                                                <span>20% Statutory Discount:</span>
                                                <span className="font-mono">₱0.00</span>
                                            </div>
                                        )}

                                        {/* Formula Callout */}
                                        <div className="p-2.5 rounded-lg bg-background border flex flex-wrap items-center justify-between text-xs font-semibold gap-1">
                                            <span className="text-muted-foreground">Calculation Formula:</span>
                                            <div className="font-mono flex items-center gap-1.5 text-xs">
                                                <span className="text-foreground">₱{totalBaseFare}.00 <span className="text-[10px] text-muted-foreground">(Fare)</span></span>
                                                <span className="text-emerald-600 font-bold">-</span>
                                                <span className="text-emerald-600 font-bold">₱{totalDiscountAmount}.00 <span className="text-[10px] text-emerald-700 dark:text-emerald-300">(Discount)</span></span>
                                                <span className="font-black text-foreground">=</span>
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₱{fare}.00 <span className="text-[10px] text-foreground font-normal">(Total Due)</span></span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between pt-1 border-t font-black text-sm text-foreground">
                                            <span>Total Cash Due to Collect:</span>
                                            <span className="font-mono text-emerald-600 text-base font-black">₱{fare}.00</span>
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
                                        disabled={
                                            submitting ||
                                            (!selectedSeat && selectedSeats.length === 0) ||
                                            !passengerName.trim() ||
                                            (effectiveDiscountCount > 0 &&
                                                discountPersons.some(
                                                    (p, i) => i < effectiveDiscountCount && (!p.name.trim() || !p.idNumber.trim())
                                                ))
                                        }
                                    >
                                        {submitting ? "Processing Walk-in..." : `Confirm & Issue Cash Ticket (₱${fare}.00)`}
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
