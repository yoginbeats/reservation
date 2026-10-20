"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { SeatPicker } from "@/components/seat-picker";
import {
    Bus,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    Plus,
    CheckCircle,
    CheckCircle2,
    AlertCircle,
    Printer,
    RefreshCw,
    X,
    ArrowRight,
    Percent,
    HeartHandshake,
    GraduationCap,
    Accessibility,
    Wallet,
    ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface DiscountPerson {
    id: string;
    name: string;
    classification: "SENIOR" | "STUDENT" | "PWD";
    idNumber: string;
}

interface AdminNewReservationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AdminNewReservationDialog({
    isOpen,
    onClose,
    onSuccess,
}: AdminNewReservationDialogProps) {
    const supabase = createClient();

    // Data State
    const [trips, setTrips] = useState<any[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
    const [bookedSeats, setBookedSeats] = useState<number[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

    // Form inputs
    const [passengerName, setPassengerName] = useState("");
    const [passengerContact, setPassengerContact] = useState("");
    const [passengerEmail, setPassengerEmail] = useState("");
    const [discountCount, setDiscountCount] = useState<number>(0);
    const [discountPersons, setDiscountPersons] = useState<DiscountPerson[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH_DIRECT" | "CONFIRMED">("CASH");
    const [gcashRef, setGcashRef] = useState("");
    const [amountTendered, setAmountTendered] = useState("");

    // Submission & UI State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedBooking, setCompletedBooking] = useState<any | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTrips();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setSelectedTrip(null);
        setSelectedSeat(null);
        setSelectedSeats([]);
        setBookedSeats([]);
        setPassengerName("");
        setPassengerContact("");
        setPassengerEmail("");
        setDiscountCount(0);
        setDiscountPersons([]);
        setPaymentMethod("CASH");
        setGcashRef("");
        setAmountTendered("");
        setError(null);
        setCompletedBooking(null);
    };

    const fetchTrips = async () => {
        setLoadingTrips(true);
        try {
            // First attempt: API with real-time occupancy
            const res = await fetch("/api/trips/available");
            const data = await res.json();
            if (data?.success && Array.isArray(data.trips) && data.trips.length > 0) {
                const normalized = data.trips.map((t: any) => ({
                    ...t,
                    fare_amount: t.fare_amount ?? t.price ?? 850,
                    route: {
                        origin: { name: t.origin || "Cubao" },
                        destination: { name: t.destination || "Daet" },
                    },
                    bus: {
                        bus_number: t.bus_number || "Superlines Express",
                        bus_type: t.bus_type || "REGULAR AIRCON",
                        seat_capacity: t.seat_capacity || 45,
                    },
                }));
                setTrips(normalized);
                setLoadingTrips(false);
                return;
            }
        } catch (apiErr) {
            console.warn("Could not fetch trips via API, using direct db fallback:", apiErr);
        }

        // Fallback: Direct Supabase query
        try {
            const { data, error } = await supabase
                .from("trips")
                .select(`
                    *,
                    route:routes(origin:terminals!routes_origin_id_fkey(name), destination:terminals!routes_destination_id_fkey(name)),
                    bus:buses(bus_number, bus_type, seat_capacity)
                `)
                .order("departure_time", { ascending: true });

            if (!error && data) {
                const normalizedTrips = data.map((t: any) => ({
                    ...t,
                    fare_amount: t.fare_amount ?? 850,
                    route: {
                        origin: { name: t.route?.origin?.name || t.origin || "Cubao" },
                        destination: { name: t.route?.destination?.name || t.destination || "Daet" },
                    },
                    bus: t.bus || {
                        bus_number: t.bus_number || "Superlines Express",
                        bus_type: "REGULAR AIRCON",
                        seat_capacity: 45,
                    },
                }));
                setTrips(normalizedTrips);
            }
        } catch (dbErr) {
            console.error("Direct trips query failed:", dbErr);
        } finally {
            setLoadingTrips(false);
        }
    };

    const handleSelectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        setSelectedSeat(null);
        setSelectedSeats([]);
        setDiscountCount(0);
        setDiscountPersons([]);
        setError(null);

        const busNum = trip.bus?.bus_number || trip.bus_number || "";
        const depTime = trip.departure_time || "";

        try {
            const res = await fetch(`/api/trips/seats?tripId=${encodeURIComponent(trip.id)}&busNumber=${encodeURIComponent(busNum)}&departureTime=${encodeURIComponent(depTime)}`);
            const data = await res.json();
            if (data?.success && Array.isArray(data.occupied_seats)) {
                setBookedSeats(data.occupied_seats);
            } else {
                const { data: seatsData } = await supabase
                    .from("trip_seats")
                    .select("seat_number, is_available")
                    .eq("trip_id", trip.id)
                    .eq("is_available", false);

                if (seatsData) {
                    setBookedSeats(seatsData.map((s) => s.seat_number));
                }
            }
        } catch {
            const { data: seatsData } = await supabase
                .from("trip_seats")
                .select("seat_number, is_available")
                .eq("trip_id", trip.id)
                .eq("is_available", false);

            if (seatsData) {
                setBookedSeats(seatsData.map((s) => s.seat_number));
            }
        }
    };

    // Multi-seat and Statutory 20% Discount Calculations
    const seatCount = selectedSeats.length > 0 ? selectedSeats.length : (selectedSeat ? 1 : 0);
    const unitFare = Number(selectedTrip?.fare_amount || 850);
    const totalBaseFare = unitFare * (seatCount || 1);
    const discountRate = 0.20;
    const discountPerPassenger = Math.round(unitFare * discountRate);

    // Number of discounted passengers cannot exceed seats booked
    const maxDiscountAllowed = Math.max(0, seatCount);
    const effectiveDiscountCount = Math.min(discountCount, maxDiscountAllowed);
    const totalDiscountAmount = effectiveDiscountCount * discountPerPassenger;
    const netFare = Math.max(0, totalBaseFare - totalDiscountAmount);
    const changeAmount = Number(amountTendered) >= netFare ? Number(amountTendered) - netFare : 0;

    const handleSetDiscountCount = (count: number) => {
        const validCount = Math.min(Math.max(0, count), Math.max(1, seatCount || 1));
        setDiscountCount(validCount);
        setDiscountPersons((prev) => {
            const next = [...prev];
            if (validCount > prev.length) {
                for (let i = prev.length; i < validCount; i++) {
                    next.push({
                        id: `adm_disc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
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

    const handleCreateBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        const activeSeats = selectedSeats.length > 0 ? selectedSeats : (selectedSeat ? [selectedSeat] : []);

        if (!selectedTrip || activeSeats.length === 0) {
            setError("Please select a trip and at least one seat.");
            return;
        }

        if (!passengerName.trim()) {
            setError("Please provide the primary passenger full name.");
            return;
        }

        // Anti-Double Booking Guard
        const alreadyTaken = activeSeats.filter((s) => bookedSeats.includes(s));
        if (alreadyTaken.length > 0) {
            setError(`Anti-Double Booking Alert: Seat(s) ${alreadyTaken.map((s) => `#${s}`).join(", ")} are already booked on this departure. Please select other open seats.`);
            return;
        }

        if (paymentMethod === "GCASH_DIRECT" && (!gcashRef || gcashRef.trim().length < 6)) {
            setError("Please enter a valid GCash Reference Number from payment receipt.");
            return;
        }

        if (effectiveDiscountCount > 0) {
            for (let i = 0; i < effectiveDiscountCount; i++) {
                const p = discountPersons[i];
                if (!p || !p.name.trim()) {
                    setError(`Please enter the legal name for Discounted Beneficiary #${i + 1}.`);
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
            const primarySeat = activeSeats[0];
            const bookingQrToken = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const bookingId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            const activeDiscountedList = discountPersons.slice(0, effectiveDiscountCount).map((p) => ({
                name: p.name.trim(),
                classification: p.classification,
                id_number: p.idNumber.trim(),
            }));

            const primaryPassengerType = effectiveDiscountCount === 0
                ? "REGULAR"
                : effectiveDiscountCount === 1
                    ? activeDiscountedList[0].classification
                    : "MIXED";

            const discountIdSummary = activeDiscountedList
                .map((p) => `${p.name} (${p.classification}: ${p.id_number})`)
                .join("; ");

            const txnRef = paymentMethod === "GCASH_DIRECT"
                ? `GCASH-${gcashRef.trim()}`
                : `ADMIN-${Date.now()}`;

            // 1. Try atomic booking procedure with GCASH or CASH
            let atomicSuccess = false;
            try {
                const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                    "book_seat_atomic",
                    {
                        p_trip_id: selectedTrip.id,
                        p_seat_number: primarySeat,
                        p_passenger_id: null,
                        p_passenger_name: passengerName.trim(),
                        p_passenger_contact: passengerContact.trim() || "",
                        p_total_price: Number(netFare),
                        p_booking_source: "ADMIN_DIRECT",
                        p_booking_terminal_id: null,
                        p_created_by: user?.id || null,
                        p_payment_method: paymentMethod,
                        p_transaction_ref: txnRef,
                    }
                );

                if (!rpcErr && rpcRes?.booking_id) {
                    atomicSuccess = true;
                }
            } catch {}

            if (!atomicSuccess) {
                let isUsingReservations = false;
                try {
                    const { error: bErr } = await supabase.from("bookings").insert({
                        id: bookingId,
                        trip_id: selectedTrip.id,
                        passenger_name: passengerName.trim(),
                        passenger_contact: passengerContact.trim() || "",
                        passenger_email: passengerEmail.trim() || "",
                        seat_number: primarySeat,
                        total_price: Number(netFare),
                        booking_source: "ADMIN_DIRECT",
                        booking_status: "CONFIRMED",
                        created_by: user?.id || null,
                    });

                    if (bErr) {
                        await supabase.from("reservations").insert({
                            id: bookingId,
                            trip_id: selectedTrip.id,
                            passenger_name: passengerName.trim(),
                            seat_number: primarySeat,
                            total_price: Number(netFare),
                            status: "CONFIRMED",
                        });
                        isUsingReservations = true;
                    }
                } catch {
                    isUsingReservations = true;
                }

                // 2. Lock all selected seats in trip_seats
                for (const s of activeSeats) {
                    try {
                        await supabase.from("trip_seats").upsert({
                            trip_id: selectedTrip.id,
                            seat_number: s,
                            is_available: false,
                            booked_by_booking_id: bookingId,
                        }, { onConflict: "trip_id,seat_number" });
                    } catch {}
                }

                // 3. Create payment record
                try {
                    await supabase.from("payments").insert({
                        [isUsingReservations ? "reservation_id" : "booking_id"]: bookingId,
                        amount: Number(netFare),
                        payment_method: paymentMethod,
                        payment_status: "PAID",
                        transaction_ref: txnRef,
                    });
                } catch {}

                // 4. Create tickets for each selected seat
                for (let i = 0; i < activeSeats.length; i++) {
                    const s = activeSeats[i];
                    const token = i === 0 ? bookingQrToken : `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                    try {
                        await supabase.from("tickets").insert({
                            [isUsingReservations ? "reservation_id" : "booking_id"]: bookingId,
                            qr_token: token,
                            ticket_status: "VALID",
                            seat_number: s,
                        });
                    } catch {}
                }
            }

            // 5. Save to local resilient store for cross-terminal anti-double booking sync
            const bookingToSync = {
                id: bookingId,
                created_at: new Date().toISOString(),
                passenger_name: passengerName.trim(),
                passenger_contact: passengerContact.trim() || "",
                passenger_email: passengerEmail.trim() || "",
                passenger_type: primaryPassengerType as any,
                discount_amount: totalDiscountAmount,
                discount_id: discountIdSummary,
                discount_count: effectiveDiscountCount,
                discounted_passengers: activeDiscountedList,
                seat_number: primarySeat,
                seat_numbers: activeSeats,
                seat_count: activeSeats.length,
                total_price: netFare,
                original_price: totalBaseFare,
                booking_status: "CONFIRMED",
                payment_status: "PAID",
                ticket_status: "VALID",
                payment_method: paymentMethod,
                transaction_ref: txnRef,
                qr_token: bookingQrToken,
                trip_id: selectedTrip.id,
                trip: {
                    id: selectedTrip.id,
                    origin: selectedTrip.origin || selectedTrip.route?.origin?.name || "Cubao",
                    destination: selectedTrip.destination || selectedTrip.route?.destination?.name || "Daet",
                    departure_time: selectedTrip.departure_time,
                    bus_number: selectedTrip.bus?.bus_number || selectedTrip.bus_number || "Superlines Express",
                },
            };

            fetch("/api/admin/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "save_booking", booking: bookingToSync }),
            }).catch(() => {});

            // Set completed state
            setCompletedBooking({
                id: bookingId,
                qr_token: bookingQrToken,
                passenger_name: passengerName.trim(),
                passenger_contact: passengerContact.trim(),
                passenger_email: passengerEmail.trim(),
                seat_number: primarySeat,
                seat_numbers: activeSeats,
                seat_count: activeSeats.length,
                total_price: netFare,
                base_fare: totalBaseFare,
                discount_amount: totalDiscountAmount,
                discount_count: effectiveDiscountCount,
                discounted_passengers: activeDiscountedList,
                payment_method: paymentMethod,
                transaction_ref: txnRef,
                amount_tendered: Number(amountTendered) || netFare,
                change_amount: changeAmount,
                trip: selectedTrip,
            });

            // Update local booked seats list
            setBookedSeats((prev) => [...prev, ...activeSeats]);

            // Notify parent to refresh reservations list
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Admin reservation error:", err);
            setError(err.message || "Failed to create reservation.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-card border-2 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight">
                                New Reservation & Direct Booking
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Multi-seat selection, statutory discounts, and real-time anti-double booking sync across terminals.
                            </DialogDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* COMPLETED BOOKING SUCCESS VIEW */}
                    {completedBooking ? (
                        <Card className="border-2 border-emerald-500 shadow-xl">
                            <CardHeader className="bg-emerald-600 text-white text-center rounded-t-xl py-4">
                                <CheckCircle className="mx-auto h-10 w-10 mb-1" />
                                <CardTitle className="text-lg">RESERVATION CONFIRMED & SEATS LOCKED</CardTitle>
                                <CardDescription className="text-emerald-100 text-xs">
                                    Official Superlines Reservation Voucher & Ticket Reference
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center border-b pb-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Primary Passenger</p>
                                        <p className="font-bold text-base text-foreground">{completedBooking.passenger_name}</p>
                                        {completedBooking.passenger_contact && (
                                            <p className="text-xs text-muted-foreground font-mono">{completedBooking.passenger_contact}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                            {completedBooking.seat_numbers?.length > 1 ? "Selected Seats" : "Seat"}
                                        </p>
                                        <p className="font-mono text-xl font-black text-blue-600">
                                            {completedBooking.seat_numbers?.length > 1
                                                ? completedBooking.seat_numbers.map((s: number) => `#${s < 10 ? `0${s}` : s}`).join(", ")
                                                : `#${completedBooking.seat_number < 10 ? `0${completedBooking.seat_number}` : completedBooking.seat_number}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-xs space-y-1 bg-muted/40 p-3 rounded-xl">
                                    <p className="text-muted-foreground font-semibold">Route & Departure Schedule</p>
                                    <p className="font-bold text-sm text-foreground">
                                        {completedBooking.trip.route?.origin?.name || completedBooking.trip.origin} ➔ {completedBooking.trip.route?.destination?.name || completedBooking.trip.destination}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Bus: <strong className="text-foreground">{completedBooking.trip.bus?.bus_number || completedBooking.trip.bus_number}</strong> • Departure: {new Date(completedBooking.trip.departure_time).toLocaleString()}
                                    </p>
                                </div>

                                {/* Discounted Beneficiaries List */}
                                {completedBooking.discounted_passengers && completedBooking.discounted_passengers.length > 0 && (
                                    <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                                        <div className="flex justify-between items-center text-purple-700 dark:text-purple-300 font-bold border-b border-purple-200/50 pb-1">
                                            <span>20% Statutory Discount ({completedBooking.discounted_passengers.length} Beneficiary)</span>
                                            <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-black">
                                                -₱{completedBooking.discount_amount}.00
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {completedBooking.discounted_passengers.map((p: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-[11px] bg-white dark:bg-zinc-900/60 p-2 rounded-lg border border-purple-100 dark:border-purple-900/50">
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

                                {/* Fare & Payment Summary */}
                                <div className="bg-muted/50 p-3 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Base Fare ({completedBooking.seat_numbers?.length || 1} seat/s):</span>
                                        <span>₱{completedBooking.base_fare}.00</span>
                                    </div>
                                    {completedBooking.discount_amount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-semibold">
                                            <span>Statutory 20% Discount Deduction:</span>
                                            <span>-₱{completedBooking.discount_amount}.00</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t pt-1.5 font-bold text-sm">
                                        <span>Total Amount Collected:</span>
                                        <span className="font-mono text-emerald-600 text-base">₱{completedBooking.total_price}.00</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                                        <span>Payment Method: {completedBooking.payment_method}</span>
                                        <span className="font-mono">Ref: {completedBooking.transaction_ref}</span>
                                    </div>
                                </div>

                                {/* QR Token Preview */}
                                <div className="flex flex-col items-center justify-center rounded-xl bg-muted p-4 border border-dashed">
                                    <p className="text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Boarding QR Pass Token</p>
                                    <p className="font-mono text-sm font-black text-foreground bg-white dark:bg-zinc-900 px-3 py-1 rounded-md border shadow-sm">
                                        {completedBooking.qr_token}
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-3">
                                <Button className="flex-1" variant="outline" onClick={() => window.print()}>
                                    <Printer className="mr-2 h-4 w-4" /> Print Manifest Voucher
                                </Button>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={resetForm}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Book Another Reservation
                                </Button>
                            </CardFooter>
                        </Card>
                    ) : !selectedTrip ? (
                        /* STEP 1: SELECT TRIP SCHEDULE */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-foreground">1. Select Bus Trip Schedule</h3>
                                <span className="text-xs text-muted-foreground">
                                    {trips.length} active departure{trips.length === 1 ? "" : "s"} found
                                </span>
                            </div>

                            {loadingTrips ? (
                                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2">
                                    <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                                    <p className="text-xs">Loading trips and terminal schedules...</p>
                                </div>
                            ) : trips.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground text-xs">
                                    No active trips scheduled. Create a new trip under Trips & Schedules first.
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {trips.map((t) => {
                                        const origin = t.route?.origin?.name || t.origin || "Cubao";
                                        const dest = t.route?.destination?.name || t.destination || "Daet";
                                        const busNum = t.bus?.bus_number || t.bus_number || "Bus TBD";
                                        const depTime = new Date(t.departure_time);

                                        return (
                                            <Card
                                                key={t.id}
                                                className="cursor-pointer transition-all hover:border-emerald-500 hover:shadow-md border"
                                                onClick={() => handleSelectTrip(t)}
                                            >
                                                <CardHeader className="pb-2">
                                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                                                        <span className="flex items-center gap-1.5">
                                                            <Bus className="h-3.5 w-3.5" />
                                                            {busNum}
                                                        </span>
                                                        <span className="text-base font-black text-foreground">₱{t.fare_amount || 850}.00</span>
                                                    </div>
                                                    <CardTitle className="text-sm flex items-center justify-between mt-1">
                                                        <span>{origin}</span>
                                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{dest}</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="text-[11px] text-muted-foreground flex justify-between items-center">
                                                    <span>Departure: {depTime.toLocaleDateString()} {depTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Select ➔</span>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* STEP 2: MULTI-SEAT PICKER & PASSENGER DETAILS */
                        <div className="space-y-6">
                            {/* Trip Selection Summary Bar */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/60 border text-xs">
                                <div className="space-y-0.5">
                                    <div className="font-extrabold text-sm text-foreground flex items-center gap-2">
                                        <Bus className="h-4 w-4 text-emerald-600" />
                                        <span>{selectedTrip.route?.origin?.name || selectedTrip.origin} ➔ {selectedTrip.route?.destination?.name || selectedTrip.destination}</span>
                                        <span className="text-xs font-mono font-bold text-muted-foreground">({selectedTrip.bus?.bus_number || selectedTrip.bus_number})</span>
                                    </div>
                                    <p className="text-muted-foreground">
                                        Schedule: {new Date(selectedTrip.departure_time).toLocaleString()} • Base Fare: ₱{unitFare}.00 per seat
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedTrip(null)} className="text-xs">
                                    Change Trip
                                </Button>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left Column: Seat Picker with Multi-Seat Selection */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                            2. Select Seat(s)
                                        </h3>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                            selectedSeats.length > 0
                                                ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                                : "bg-muted text-muted-foreground"
                                        }`}>
                                            {selectedSeats.length > 0
                                                ? `${selectedSeats.length} Seat${selectedSeats.length > 1 ? "s" : ""} Selected`
                                                : "Click seats to select"}
                                        </span>
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

                                {/* Right Column: Passenger Info, Discount Count Selector, and Payment */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-sm text-foreground">
                                        3. Passenger Details & Statutory Discount
                                    </h3>

                                    <div className="p-4 rounded-xl border bg-card space-y-4 shadow-sm">
                                        {/* Primary Passenger Name */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="admPName" className="text-xs font-bold text-foreground">
                                                Primary Passenger Full Name *
                                            </Label>
                                            <Input
                                                id="admPName"
                                                required
                                                placeholder="Juan Dela Cruz"
                                                value={passengerName}
                                                onChange={(e) => setPassengerName(e.target.value)}
                                            />
                                        </div>

                                        {/* Contact & Email */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="admPContact" className="text-xs font-bold text-foreground">
                                                    Mobile Number
                                                </Label>
                                                <Input
                                                    id="admPContact"
                                                    placeholder="09171234567"
                                                    value={passengerContact}
                                                    onChange={(e) => setPassengerContact(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="admPEmail" className="text-xs font-bold text-foreground">
                                                    Email Address (Optional)
                                                </Label>
                                                <Input
                                                    id="admPEmail"
                                                    type="email"
                                                    placeholder="passenger@gmail.com"
                                                    value={passengerEmail}
                                                    onChange={(e) => setPassengerEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* DISCOUNT QUANTITY SELECTOR ("Ilan ang i-didiscount") */}
                                        <div className="space-y-2.5 pt-3 border-t">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                        <Percent className="h-3.5 w-3.5 text-purple-600" />
                                                        Ilan ang i-didiscount? (Statutory 20% Discount)
                                                    </Label>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Senior Citizen (RA 9994), Student (RA 11314), and PWD (RA 10754).
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                                                    -20% per passenger
                                                </span>
                                            </div>

                                            {/* Quantity Pill Buttons */}
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from({ length: Math.max(1, seatCount || 1) + 1 }).map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleSetDiscountCount(idx)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                            effectiveDiscountCount === idx
                                                                ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/20"
                                                                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                                                        }`}
                                                    >
                                                        {idx === 0 ? "0 (All Regular)" : `${idx} Passenger${idx > 1 ? "s" : ""}`}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Beneficiary Forms per Discounted Passenger */}
                                            {effectiveDiscountCount > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    {Array.from({ length: effectiveDiscountCount }).map((_, idx) => {
                                                        const person = discountPersons[idx] || {
                                                            id: `adm_person_${idx}`,
                                                            name: "",
                                                            classification: "SENIOR" as const,
                                                            idNumber: "",
                                                        };

                                                        return (
                                                            <div
                                                                key={person.id || idx}
                                                                className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-2.5"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                                                        <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-black">
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
                                                                                className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition-all ${
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

                                                                {/* Name and ID */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] text-muted-foreground">Beneficiary Name *</Label>
                                                                        <Input
                                                                            required
                                                                            className="h-8 text-xs"
                                                                            placeholder="Full name as in ID"
                                                                            value={person.name}
                                                                            onChange={(e) => handleUpdateDiscountPerson(idx, "name", e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] text-muted-foreground">Official ID Number *</Label>
                                                                        <Input
                                                                            required
                                                                            className="h-8 text-xs font-mono"
                                                                            placeholder="OSCA / Student / PWD ID #"
                                                                            value={person.idNumber}
                                                                            onChange={(e) => handleUpdateDiscountPerson(idx, "idNumber", e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Method Selector */}
                                        <div className="space-y-2 pt-3 border-t">
                                            <Label className="text-xs font-bold text-foreground">
                                                Payment Method & Channel
                                            </Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { id: "CASH", label: "Cash / Walk-in" },
                                                    { id: "GCASH_DIRECT", label: "GCash Direct" },
                                                    { id: "CONFIRMED", label: "Admin Courtesy" },
                                                ].map((pm) => (
                                                    <button
                                                        key={pm.id}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(pm.id as any)}
                                                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                                                            paymentMethod === pm.id
                                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                                                        }`}
                                                    >
                                                        {pm.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {paymentMethod === "GCASH_DIRECT" && (
                                                <div className="pt-2 space-y-1">
                                                    <Label htmlFor="admGcashRef" className="text-xs font-semibold text-muted-foreground">
                                                        GCash Reference Number *
                                                    </Label>
                                                    <Input
                                                        id="admGcashRef"
                                                        required
                                                        placeholder="e.g. 100234567891"
                                                        className="font-mono text-xs"
                                                        value={gcashRef}
                                                        onChange={(e) => setGcashRef(e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            {paymentMethod === "CASH" && (
                                                <div className="pt-2 space-y-1">
                                                    <Label htmlFor="admCashTendered" className="text-xs font-semibold text-muted-foreground">
                                                        Cash Amount Tendered (Optional)
                                                    </Label>
                                                    <Input
                                                        id="admCashTendered"
                                                        type="number"
                                                        placeholder={`Exact fare: ₱${netFare}`}
                                                        className="font-mono text-xs"
                                                        value={amountTendered}
                                                        onChange={(e) => setAmountTendered(e.target.value)}
                                                    />
                                                    {Number(amountTendered) > netFare && (
                                                        <p className="text-[11px] font-bold text-emerald-600">
                                                            Change to return: ₱{changeAmount.toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Fare Breakdown Summary */}
                                        <div className="rounded-xl bg-muted/60 p-3 space-y-1.5 text-xs border">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Unit Fare:</span>
                                                <span className="font-mono font-bold">₱{unitFare}.00</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Selected Seats ({seatCount}):</span>
                                                <span className="font-mono font-bold text-blue-600">
                                                    {selectedSeats.length > 0
                                                        ? selectedSeats.map((s) => `#${s < 10 ? `0${s}` : s}`).join(", ")
                                                        : (selectedSeat ? `#${selectedSeat}` : "None")}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Base Subtotal:</span>
                                                <span className="font-mono">₱{totalBaseFare}.00</span>
                                            </div>
                                            {effectiveDiscountCount > 0 && (
                                                <div className="flex justify-between text-purple-600 dark:text-purple-400 font-bold">
                                                    <span>Statutory 20% Discount ({effectiveDiscountCount}x):</span>
                                                    <span className="font-mono">-₱{totalDiscountAmount}.00</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t pt-1.5 text-sm font-black text-foreground">
                                                <span>Net Total Payable:</span>
                                                <span className="font-mono text-emerald-600 text-base">₱{netFare}.00</span>
                                            </div>
                                        </div>

                                        {/* Confirm & Issue Button */}
                                        <Button
                                            type="button"
                                            onClick={handleCreateBooking}
                                            disabled={submitting || (!selectedSeat && selectedSeats.length === 0)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-11 shadow-md text-sm"
                                        >
                                            {submitting ? "Confirming & Locking Seats..." : `Confirm Reservation & Lock Seats (₱${netFare}.00)`}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
