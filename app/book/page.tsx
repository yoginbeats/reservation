"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatPicker } from "@/components/seat-picker";
import {
    Bus,
    MapPin,
    Calendar,
    Clock,
    Wallet,
    ArrowRight,
    Check,
    AlertCircle,
    QrCode,
    Copy,
    CheckCircle2,
    Upload,
    ShieldCheck,
    Image as ImageIcon,
    GraduationCap,
    Accessibility,
    HeartHandshake,
    UserCheck,
    FileText,
    ChevronDown,
    ChevronUp,
    Percent,
    Info,
    Calculator,
    RefreshCw,
    Search,
    AlertTriangle,
    X
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { formatDatePH, formatTimePH, formatDateTimePH, getTodayPH } from "@/lib/date-utils";
import { getBusFare } from "@/lib/constants/bus-layouts";
import { BusClassificationBadge } from "@/components/bus-classification-badge";
import { getPickupPointsForTrip, PickupPoint } from "@/lib/constants/pickup-points";

export interface DiscountPerson {
    id: string;
    name: string;
    classification: "SENIOR" | "STUDENT" | "PWD";
    idNumber: string;
}

function BookTripContent() {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Schedule, 2: Select Seat, 3: Passenger Details & Checkout
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
    const [passengerEmail, setPassengerEmail] = useState("");
    const [discountCount, setDiscountCount] = useState<number>(0);
    const [discountPersons, setDiscountPersons] = useState<DiscountPerson[]>([]);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [gcashRef, setGcashRef] = useState("");
    const [customQrUrl, setCustomQrUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"gcash_qr" | "paymongo">("gcash_qr");
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    const [receiptFileName, setReceiptFileName] = useState<string>("");
    const [holdSeconds, setHoldSeconds] = useState(15 * 60);
    const [pickupLocation, setPickupLocation] = useState<string>(""); // 15-minute hold timer

    // 15-Minute Seat Hold Countdown
    useEffect(() => {
        if (step !== 3) {
            setHoldSeconds(15 * 60);
            return;
        }
        const timer = setInterval(() => {
            setHoldSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    alert("⚠️ Ang inyong 15-minutong reservation hold ay nag-expire na. Pakipili ulit ang inyong upuan.");
                    setStep(2);
                    return 15 * 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [step]);

    const formatHoldTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setReceiptFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
            setReceiptImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tripIdParam = searchParams.get("tripId");
    const originParam = searchParams.get("origin") || "Cubao";
    const destParam = searchParams.get("destination") || "Daet";
    const dateParam = searchParams.get("date") || searchParams.get("departureDate") || getTodayPH();
    const serviceClassParam = searchParams.get("serviceClass") || "ALL";
    const passengersParam = searchParams.get("passengers") || "1";

        // Scheduled Trips from Trip & Schedule Management
    const [allScheduledTrips, setAllScheduledTrips] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(dateParam && dateParam !== getTodayPH() ? dateParam : "ALL");
    const [passengerCount, setPassengerCount] = useState(Number(passengersParam) || 1);

    useEffect(() => {
        fetchTrips();
        fetchCurrentUser();
    }, [tripIdParam]);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setPassengerEmail(user.email || "");
            const { data: profile } = await supabase.from('profiles').select('full_name, phone_number').eq('id', user.id).single();
            if (profile) {
                setPassengerName(profile.full_name || "");
                setPassengerContact(profile.phone_number || "");
            }
        }
    };

    const fetchTrips = async () => {
        setLoading(true);
        setError(null);
        let rawTrips: any[] = [];

        try {
            const res = await fetch("/api/admin/trips");
            const data = await res.json();
            if (data?.success && Array.isArray(data.trips) && data.trips.length > 0) {
                rawTrips = data.trips;
            }
        } catch (e) {
            console.warn("Could not fetch admin scheduled trips:", e);
        }

        if (rawTrips.length === 0) {
            try {
                const { data: dbTrips } = await supabase
                    .from('trips')
                    .select('*, bus:buses(bus_number, bus_type, seat_capacity)')
                    .order('departure_time', { ascending: true });
                if (dbTrips && dbTrips.length > 0) {
                    rawTrips = dbTrips;
                }
            } catch (dbErr) {
                console.warn("Database fallback note:", dbErr);
            }
        }

        const normalized = rawTrips.map((t: any) => {
            const bType = t.bus?.bus_type || t.bus_type || "REGULAR AIRCON";
            return {
                id: t.id,
                origin: t.origin || t.route?.origin?.name || "Cubao",
                destination: t.destination || t.route?.destination?.name || "Daet",
                departure_time: t.departure_time,
                fare_amount: t.fare_amount ?? t.price ?? getBusFare(bType),
                status: t.status || 'SCHEDULED',
                route: {
                    origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
                    destination: { name: t.destination || t.route?.destination?.name || "Daet" }
                },
                bus: {
                    bus_number: t.bus_number || t.bus?.bus_number || "Superlines Express",
                    bus_type: bType,
                    seat_capacity: t.seat_capacity || t.bus?.seat_capacity || 49
                }
            };
        });

        setAllScheduledTrips(normalized);
        setTrips(normalized);

        // If tripIdParam provided in URL, auto-select
        if (tripIdParam) {
            const matched = normalized.find((t: any) => t.id === tripIdParam);
            if (matched) handleSelectTrip(matched);
        }

        setLoading(false);
    };

    // Derived unique scheduled dates for quick filter pills
    const availableDates = Array.from(
        new Set(
            allScheduledTrips
                .map((t) => t.departure_time ? t.departure_time.slice(0, 10) : "")
                .filter(Boolean)
        )
    ).sort();

    // Derived trips filtered strictly by selectedDate
    const displayedTrips = selectedDate === "ALL"
        ? allScheduledTrips
        : allScheduledTrips.filter((t) => t.departure_time && t.departure_time.slice(0, 10) === selectedDate);


    const handleSelectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        const initialPickups = getPickupPointsForTrip(trip.route?.origin?.name || trip.origin, trip.route?.destination?.name || trip.destination);
        if (initialPickups && initialPickups.length > 0) {
            setPickupLocation(initialPickups[0].name);
        }
        setSelectedSeat(null);
        setSelectedSeats([]);
        setDiscountCount(0);
        setDiscountPersons([]);
        setLoading(true);

        const busNum = trip.bus?.bus_number || trip.bus_number || "";
        const depTime = trip.departure_time || "";

        try {
            // Fetch from cross-terminal anti-double booking API
            const res = await fetch(`/api/trips/seats?tripId=${encodeURIComponent(trip.id)}&busNumber=${encodeURIComponent(busNum)}&departureTime=${encodeURIComponent(depTime)}`);
            const data = await res.json();
            if (data?.success && Array.isArray(data.occupied_seats)) {
                setBookedSeats(data.occupied_seats);
            } else {
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
            setStep(2);
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomQrUrl(url);
        }
    };

    // Multi-seat and Automatic Discount Calculations
    const seatCount = selectedSeats.length > 0 ? selectedSeats.length : (selectedSeat ? 1 : 1);
    const unitFare = Number(selectedTrip?.fare_amount || 650);
    const totalBaseFare = unitFare * seatCount;
    const discountRate = 0.20;
    const discountPerPassenger = Math.round(unitFare * discountRate);

    // Number of discounted passengers cannot exceed seats booked
    const effectiveDiscountCount = Math.min(discountCount, seatCount);
    const totalDiscountAmount = effectiveDiscountCount * discountPerPassenger;
    const finalFare = totalBaseFare - totalDiscountAmount;
    const isDiscounted = effectiveDiscountCount > 0;

    const handleSetDiscountCount = (count: number) => {
        const validCount = Math.max(0, count);
        setDiscountCount(validCount);
        setDiscountPersons((prev) => {
            const next = [...prev];
            if (validCount > prev.length) {
                for (let i = prev.length; i < validCount; i++) {
                    next.push({
                        id: `disc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
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

    const handleConfirmDirectGcash = async (e: React.FormEvent) => {
        e.preventDefault();
        const effectiveSeat = selectedSeat || (selectedSeats.length > 0 ? selectedSeats[0] : null);
        if (!selectedTrip || !effectiveSeat) {
            setError("Please select a trip and at least one seat.");
            return;
        }

        if (!passengerName.trim()) {
            setError("Please enter the primary passenger full name.");
            return;
        }

        if (effectiveDiscountCount > 0) {
            for (let i = 0; i < effectiveDiscountCount; i++) {
                const p = discountPersons[i];
                if (!p || !p.name.trim()) {
                    setError(`Please enter the full name for Discounted Passenger #${i + 1}.`);
                    return;
                }
                if (!p.idNumber.trim()) {
                    setError(`Please enter the ID Number for Discounted Passenger #${i + 1} (${p.classification}).`);
                    return;
                }
            }
        }

        if (!termsAccepted) {
            setError("Please agree to the Superlines Passenger Terms & Conditions before confirming your booking.");
            return;
        }

        if (!gcashRef || gcashRef.trim().length < 6) {
            setError("Please enter the GCash Reference Number from your GCash payment confirmation receipt.");
            return;
        }

        setError(null);
        setSubmitting(true);

        const activeDiscountedList = discountPersons.slice(0, effectiveDiscountCount).map((p) => ({
            name: p.name.trim(),
            classification: p.classification,
            id_number: p.idNumber.trim(),
        }));

        const primaryPassengerType =
            effectiveDiscountCount === 0
                ? "REGULAR"
                : effectiveDiscountCount === 1
                ? activeDiscountedList[0].classification
                : "MIXED";

        const discountIdSummary = activeDiscountedList
            .map((p) => `${p.name} (${p.classification}: ${p.id_number})`)
            .join("; ");

        try {
            const response = await fetch('/api/payments/gcash-direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: selectedTrip.id,
                    seatNumber: effectiveSeat,
                    seatNumbers: selectedSeats.length > 0 ? selectedSeats : [effectiveSeat],
                    passengerName,
                    passengerContact,
                    passengerEmail,
                    originalPrice: totalBaseFare,
                    totalPrice: finalFare,
                    passengerType: primaryPassengerType,
                    discountAmount: totalDiscountAmount,
                    discountCount: effectiveDiscountCount,
                    discountedPassengers: activeDiscountedList,
                    discountIdNumber: discountIdSummary,
                    gcashRefNumber: gcashRef.trim(),
                    receiptImageUrl: receiptImage || "",
                    trip: {
                        id: selectedTrip.id,
                        origin: selectedTrip.origin || selectedTrip.route?.origin?.name || "Cubao",
                        destination: selectedTrip.destination || selectedTrip.route?.destination?.name || "Daet",
                        departure_time: selectedTrip.departure_time,
                        bus_number: selectedTrip.bus?.bus_number || selectedTrip.bus_number || "Superlines Express",
                    },
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to confirm GCash booking.');
            }

            // Cache ticket in localStorage
            try {
                const confirmedTicket = {
                    booking_id: result.booking_id,
                    qr_token: result.qr_token,
                    passenger_name: passengerName,
                    passenger_contact: passengerContact,
                    passenger_email: passengerEmail,
                    passenger_type: primaryPassengerType,
                    discount_amount: totalDiscountAmount,
                    discount_count: effectiveDiscountCount,
                    discounted_passengers: activeDiscountedList,
                    discount_id: discountIdSummary,
                    seat_number: effectiveSeat,
                    seat_numbers: selectedSeats.length > 0 ? selectedSeats : [effectiveSeat],
                    seat_count: seatCount,
                    total_price: finalFare,
                    original_price: totalBaseFare,
                    trip: selectedTrip,
                    gcash_ref: gcashRef.trim(),
                    created_at: new Date().toISOString()
                };
                localStorage.setItem(`superlines_booking_${result.booking_id}`, JSON.stringify(confirmedTicket));
            } catch (err) {
                console.warn("Could not save to localStorage:", err);
            }

            router.push(result.redirect_url || `/my-tickets?booking_id=${result.booking_id}&payment=success`);
        } catch (err: any) {
            setError(err.message || 'An error occurred while confirming GCash payment.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleProceedToCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        const effectiveSeat = selectedSeat || (selectedSeats.length > 0 ? selectedSeats[0] : null);
        if (!selectedTrip || !effectiveSeat) return;

        if (effectiveDiscountCount > 0) {
            for (let i = 0; i < effectiveDiscountCount; i++) {
                const p = discountPersons[i];
                if (!p || !p.name.trim()) {
                    setError(`Please enter the full name for Discounted Passenger #${i + 1}.`);
                    return;
                }
                if (!p.idNumber.trim()) {
                    setError(`Please enter the ID Number for Discounted Passenger #${i + 1} (${p.classification}).`);
                    return;
                }
            }
        }

        if (!termsAccepted) {
            setError("Please agree to the Superlines Passenger Terms & Conditions before confirming your booking.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            const response = await fetch('/api/payments/paymongo/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: selectedTrip.id,
                    seatNumber: effectiveSeat,
                    seatNumbers: selectedSeats.length > 0 ? selectedSeats : [effectiveSeat],
                    seatCount,
                    passengerName,
                    passengerContact,
                    passengerEmail,
                    totalPrice: finalFare,
                    originalPrice: totalBaseFare,
                    passengerType: primaryPassengerType,
                    discountAmount: totalDiscountAmount,
                    discountCount: effectiveDiscountCount,
                    discountedPassengers: activeDiscountedList,
                    discountIdNumber: discountIdSummary,
                    pickupLocation: pickupLocation || selectedTrip?.route?.origin?.name || selectedTrip?.origin || "Daet",
                    trip: selectedTrip,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to initiate booking checkout.');
            }

            if (result.checkout_url) {
                try {
                    const pendingTicket = {
                        booking_id: result.booking_id,
                        qr_token: result.qr_token,
                        passenger_name: passengerName,
                        passenger_contact: passengerContact,
                        passenger_email: passengerEmail,
                        passenger_type: primaryPassengerType,
                        discount_amount: totalDiscountAmount,
                        discount_count: effectiveDiscountCount,
                        discounted_passengers: activeDiscountedList,
                        discount_id: discountIdSummary,
                        seat_number: effectiveSeat,
                        seat_numbers: selectedSeats.length > 0 ? selectedSeats : [effectiveSeat],
                        seat_count: seatCount,
                        total_price: finalFare,
                        original_price: totalBaseFare,
                        pickup_location: pickupLocation || selectedTrip?.route?.origin?.name || selectedTrip?.origin || "Daet",
                        trip: selectedTrip,
                        payment_method: "PAYMONGO",
                        created_at: new Date().toISOString()
                    };
                    localStorage.setItem(`superlines_booking_${result.booking_id}`, JSON.stringify(pendingTicket));
                } catch (e) {
                    console.warn("Could not save to localStorage:", e);
                }
                window.location.href = result.checkout_url;
            } else {
                router.push('/my-tickets');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during booking.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Step Progress Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Book Your Bus Ticket</h1>
                    <p className="text-sm text-muted-foreground">Select a schedule, choose your seat, and pay securely online via GCash.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-red-600 text-white' : 'bg-muted'}`}>1. Schedule</span>
                    <span>→</span>
                    <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-red-600 text-white' : 'bg-muted'}`}>2. Seat Map</span>
                    <span>→</span>
                    <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-blue-600 text-white' : 'bg-muted'}`}>3. GCash Payment</span>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* STEP 1: SELECT TRIP SCHEDULE */}
            {step === 1 && (
                <div className="space-y-6">
                    {/* SCHEDULED DEPARTURES HEADER & DATE FILTER BAR */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border-2 shadow-sm">
                        <div>
                            <div className="flex items-center gap-2">
                                <Bus className="h-6 w-6 text-red-600" />
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                                    Official Scheduled Departures
                                </h2>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Real-time trip schedules synchronized directly from Superlines Dispatch Management.
                            </p>
                        </div>

                        {/* Date Filter Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setSelectedDate("ALL")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                    selectedDate === "ALL"
                                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                                        : "bg-muted text-foreground border-border hover:bg-muted/80"
                                }`}
                            >
                                All Dates ({allScheduledTrips.length})
                            </button>

                            {/* Quick Date Pills from Real Scheduled Trips */}
                            {availableDates.map((dStr) => (
                                <button
                                    key={dStr}
                                    type="button"
                                    onClick={() => setSelectedDate(dStr)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                        selectedDate === dStr
                                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                                            : "bg-muted text-foreground border-border hover:bg-muted/80"
                                    }`}
                                >
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDatePH(dStr)}
                                </button>
                            ))}

                            {/* Modern Date Picker */}
                            <div className="w-40">
                                <ModernDatePicker
                                    value={selectedDate === "ALL" ? "" : selectedDate}
                                    onChange={(val) => setSelectedDate(val)}
                                    placeholder="Filter by Date"
                                    className="h-8 text-xs font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* AVAILABLE SCHEDULES LIST */}
                    {loading ? (
                        <div className="py-16 text-center text-muted-foreground space-y-2">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
                            <p className="font-semibold text-sm">Loading verified dispatch schedules...</p>
                        </div>
                    ) : displayedTrips.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {displayedTrips.map((t) => {
                                const origin = t.route?.origin?.name || t.origin || "Origin";
                                const dest = t.route?.destination?.name || t.destination || "Destination";
                                const busNum = t.bus?.bus_number || t.bus_number || "Superlines Express";
                                const busType = t.bus?.bus_type || t.bus_type || "REGULAR AIRCON";
                                const capacity = t.bus?.seat_capacity || t.seat_capacity || 49;

                                return (
                                    <Card
                                        key={t.id}
                                        className="transition-all hover:border-red-500 hover:shadow-xl border-2 flex flex-col justify-between cursor-pointer group"
                                        onClick={() => handleSelectTrip(t)}
                                    >
                                        <CardHeader className="pb-3 border-b bg-muted/20">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <div className="flex items-center gap-1.5 font-bold text-red-600">
                                                    <Bus className="h-4 w-4" />
                                                    <span className="font-mono text-sm">{busNum}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <BusClassificationBadge busType={busType} seatCapacity={capacity} showFeatures />
                                                    <span className="font-mono text-lg font-black text-foreground">
                                                        ₱{t.fare_amount || 850}.00
                                                    </span>
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl flex items-center justify-between mt-2 font-black text-foreground">
                                                <span>{origin}</span>
                                                <ArrowRight className="h-5 w-5 text-red-600 group-hover:translate-x-1 transition-transform" />
                                                <span>{dest}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-4 text-xs text-muted-foreground">
                                            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 border">
                                                <div className="flex items-center gap-2 font-bold text-foreground">
                                                    <Calendar className="h-4 w-4 text-red-600" />
                                                    <span>{formatDatePH(t.departure_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 font-black text-sm text-foreground">
                                                    <Clock className="h-4 w-4 text-red-600" />
                                                    <span>{formatTimePH(t.departure_time)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs px-1">
                                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                    ● Official Superlines Schedule
                                                </span>
                                                <span className="text-muted-foreground font-mono font-semibold">
                                                    Capacity: {capacity} Passenger Seats
                                                </span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-3 border-t bg-muted/30 flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                Tap card to choose seats
                                            </span>
                                            <Button
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectTrip(t);
                                                }}
                                            >
                                                Select Seats &amp; Book &rarr;
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="p-12 text-center text-muted-foreground space-y-4 rounded-2xl border-2">
                            <p className="font-bold text-base text-foreground">
                                No scheduled departures found {selectedDate !== "ALL" ? `for ${formatDatePH(selectedDate)}` : "in the system"}.
                            </p>
                            <p className="text-xs max-w-md mx-auto">
                                Kung nag-schedule ka ng biyahe sa Trip &amp; Schedule Management, pakitsek ang departure date nito o i-click ang &quot;All Dates&quot; sa itaas para makita ang lahat ng aktibong biyahe.
                            </p>
                            <Button
                                variant="outline"
                                className="font-bold text-xs"
                                onClick={() => setSelectedDate("ALL")}
                            >
                                View All Scheduled Departures ({allScheduledTrips.length})
                            </Button>
                        </Card>
                    )}
                </div>
            )}

            {/* STEP 2: SELECT SEAT */}}
            {step === 2 && selectedTrip && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Select Your Seat</h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedTrip.route?.origin?.name || selectedTrip.origin} ➔ {selectedTrip.route?.destination?.name || selectedTrip.destination} • {formatDateTimePH(selectedTrip.departure_time)}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                            Back to Trips
                        </Button>
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

                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                            disabled={!selectedSeat && selectedSeats.length === 0}
                            onClick={() => {
                                const count = selectedSeats.length > 0 ? selectedSeats.length : (selectedSeat ? 1 : 1);
                                if (discountCount > count) {
                                    handleSetDiscountCount(count);
                                }
                                setStep(3);
                            }}
                        >
                            Continue to Passenger Details ({selectedSeats.length > 0 ? selectedSeats.length : 1} Seat{selectedSeats.length > 1 ? "s" : ""})
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: PASSENGER DETAILS & PAYMENT */}
            {step === 3 && selectedTrip && (selectedSeat || selectedSeats.length > 0) && (
                <div className="space-y-6 max-w-xl mx-auto">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Passenger Details & Payment</h2>
                        <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                            Back to Seat Map
                        </Button>
                    </div>

                    {/* 15-MINUTE SEAT HOLD COUNTDOWN BANNER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-950/70 via-zinc-900 to-amber-950/70 border-2 border-amber-500/60 p-4 text-white shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 animate-pulse">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950">
                                        Temporary Hold Active
                                    </span>
                                    <span className="text-xs text-amber-300/80 font-bold">Anti-Double Booking Protected</span>
                                </div>
                                <p className="text-xs text-zinc-300 mt-1">
                                    Your selected seat is temporarily reserved. Complete payment before the timer expires.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center sm:flex-col items-end justify-between border-t sm:border-t-0 sm:border-l border-amber-500/20 pt-2 sm:pt-0 sm:pl-4">
                            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Hold Expires In</span>
                            <span className="font-mono text-2xl font-black text-amber-300 tracking-tight">
                                {formatHoldTime(holdSeconds)}
                            </span>
                        </div>
                    </div>

                    {/* Trip Summary Card */}
                    <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-200">
                        <CardContent className="p-4 space-y-2 text-sm">
                            <div className="flex justify-between font-bold">
                                <span>{selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name}</span>
                                <div className="text-right">
                                    {isDiscounted ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs line-through text-muted-foreground font-mono">₱{totalBaseFare}.00</span>
                                            <span className="text-emerald-600 font-extrabold text-base">₱{finalFare}.00</span>
                                        </div>
                                    ) : (
                                        <span className="text-red-600 font-extrabold">₱{totalBaseFare}.00</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Schedule: {formatDateTimePH(selectedTrip.departure_time)}</span>
                                <span className="font-mono font-bold text-red-600">
                                    {selectedSeats.length > 0
                                        ? `Seats (${selectedSeats.length}): ${selectedSeats.map((s) => `#${s < 10 ? `0${s}` : s}`).join(", ")}`
                                        : `Seat #${selectedSeat}`}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Official PayMongo GCash Gateway Payment Form */}
                    <form onSubmit={handleProceedToCheckout} className="space-y-6">
                        {/* SELECTION NG PICK-UP LOCATION (DESIGNATED BOARDING POINT) */}
                        <div className="space-y-3 rounded-2xl border-2 border-blue-500/50 p-4 bg-gradient-to-br from-blue-50/70 via-background to-blue-50/30 dark:from-blue-950/40 dark:via-background dark:to-blue-950/20 shadow-md">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-blue-600 animate-pulse" />
                                    <h3 className="font-extrabold text-sm text-foreground">
                                        Selection ng Pick-up Location (Designated Boarding Point) *
                                    </h3>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
                                    Official Boarding Stations
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Piliin kung saan ka opisyal na sasakay o susunduin ng bus sa rutang <strong className="text-foreground">{selectedTrip.route?.origin?.name || selectedTrip.origin} ➔ {selectedTrip.route?.destination?.name || selectedTrip.destination}</strong>:
                            </p>

                            <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
                                {getPickupPointsForTrip(
                                    selectedTrip.route?.origin?.name || selectedTrip.origin,
                                    selectedTrip.route?.destination?.name || selectedTrip.destination
                                ).map((point: PickupPoint) => {
                                    const isSelected = pickupLocation === point.name || (!pickupLocation && point.isMainTerminal);
                                    return (
                                        <div
                                            key={point.id}
                                            onClick={() => setPickupLocation(point.name)}
                                            className={`cursor-pointer rounded-xl border-2 p-3 transition-all flex flex-col justify-between ${
                                                isSelected
                                                    ? "border-blue-600 bg-blue-50/90 dark:bg-blue-950/70 shadow-sm ring-2 ring-blue-500/40"
                                                    : "border-border hover:border-blue-300 bg-card hover:bg-muted/40"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        id={point.id}
                                                        name="pickupLocationSelection"
                                                        checked={isSelected}
                                                        onChange={() => setPickupLocation(point.name)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    />
                                                    <label htmlFor={point.id} className="font-extrabold text-xs cursor-pointer text-foreground">
                                                        {point.label}
                                                    </label>
                                                </div>
                                                {point.isMainTerminal && (
                                                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white">
                                                        Main Terminal
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground pl-6 mt-1">
                                                {point.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200 bg-blue-100/70 dark:bg-blue-950/70 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800">
                                <MapPin className="h-4 w-4 shrink-0 text-blue-600" />
                                <span className="text-[11px]">
                                    <strong>Nakatala sa Tiket:</strong> Ikaw ay susunduin sa <strong className="underline text-blue-700 dark:text-blue-300">{pickupLocation || "Main Terminal"}</strong>. Makikita ito sa digital QR pass at sa conductor manifest.
                                </span>
                            </div>
                        </div>
                        {/* 1. Passenger Details */}
                        <div className="space-y-4 rounded-xl border p-4 bg-card">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span>1. Passenger Contact & Ticket Delivery Information</span>
                                </h3>
                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    Required for Boarding Pass
                                </span>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pName">Passenger Full Name (Lead Passenger) *</Label>
                                <Input
                                    id="pName"
                                    required
                                    placeholder="Juan Dela Cruz"
                                    value={passengerName}
                                    onChange={(e) => setPassengerName(e.target.value)}
                                    className="bg-white dark:bg-zinc-800 font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pContact">Mobile Phone Number *</Label>
                                    <Input
                                        id="pContact"
                                        required
                                        placeholder="09171234567"
                                        value={passengerContact}
                                        onChange={(e) => setPassengerContact(e.target.value)}
                                        className="bg-white dark:bg-zinc-800 font-mono"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Used for trip updates and terminal dispatch verification.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pEmail">Email Address (for e-Ticket Delivery) *</Label>
                                    <Input
                                        id="pEmail"
                                        type="email"
                                        required
                                        placeholder="juan@gmail.com"
                                        value={passengerEmail}
                                        onChange={(e) => setPassengerEmail(e.target.value)}
                                        className="bg-white dark:bg-zinc-800 font-medium"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Digital QR Boarding Pass and official receipt will be sent here.</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. 20% Statutory Discount Options (Senior, Student, PWD) */}
                        <div className="space-y-4 rounded-xl border p-4 bg-card">
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-purple-600" />
                                    <h3 className="font-bold text-sm text-foreground">2. Special Statutory Discounts (20% Off)</h3>
                                </div>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                    RA 9994 / RA 10754 / RA 11314
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-bold text-foreground">
                                        Are any of the {seatCount} passenger(s) eligible for 20% discount?
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Applicable to Senior Citizens, Students, and PWDs upon presentation of valid ID.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={isDiscounted ? "default" : "outline"}
                                        onClick={() => handleToggleDiscount(true)}
                                        className={isDiscounted ? "bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs" : "text-xs font-semibold"}
                                    >
                                        Yes, Apply 20%
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={!isDiscounted ? "default" : "outline"}
                                        onClick={() => handleToggleDiscount(false)}
                                        className={!isDiscounted ? "bg-zinc-800 text-white font-bold text-xs" : "text-xs font-semibold"}
                                    >
                                        Regular Fare
                                    </Button>
                                </div>
                            </div>

                            {isDiscounted && (
                                <div className="space-y-4 pt-1">
                                    <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-950/30 p-2.5 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <span className="font-bold text-purple-900 dark:text-purple-200">
                                            Number of Discounted Passenger(s):
                                        </span>
                                        <select
                                            value={effectiveDiscountCount}
                                            onChange={(e) => handleSetDiscountCount(parseInt(e.target.value, 10))}
                                            className="font-bold text-xs bg-white dark:bg-zinc-800 border rounded px-2 py-1"
                                        >
                                            {Array.from({ length: seatCount }, (_, i) => i + 1).map((num) => (
                                                <option key={num} value={num}>
                                                    {num} Passenger{num > 1 ? "s" : ""} (20% Off)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {discountPersons.slice(0, effectiveDiscountCount).map((p, idx) => (
                                        <div key={p.id || idx} className="rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 p-3.5 space-y-3">
                                            <div className="flex items-center justify-between font-bold text-xs text-purple-900 dark:text-purple-200">
                                                <span>Discount Details for Passenger #{idx + 1}</span>
                                                <span className="text-emerald-600 font-extrabold">-₱{discountPerPassenger}.00 (20%)</span>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[11px] font-semibold text-muted-foreground">Classification Type *</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { id: "SENIOR", label: "Senior Citizen", sub: "RA 9994", icon: User },
                                                        { id: "STUDENT", label: "Student", sub: "RA 11314", icon: GraduationCap },
                                                        { id: "PWD", label: "PWD", sub: "RA 10754", icon: Accessibility },
                                                    ].map((item) => {
                                                        const isSelected = p.classification === item.id;
                                                        const IconComp = item.icon;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => handleUpdateDiscountPerson(idx, "classification", item.id as any)}
                                                                className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center text-center ${
                                                                    isSelected
                                                                        ? "border-purple-600 bg-purple-600 text-white font-bold shadow-sm"
                                                                        : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                                                                }`}
                                                            >
                                                                <IconComp className="h-4 w-4 mb-1" />
                                                                <span className="text-xs font-extrabold leading-tight">{item.label}</span>
                                                                <span className={`text-[10px] ${isSelected ? "text-purple-100" : "text-muted-foreground"}`}>{item.sub}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-foreground">Discounted Passenger Full Legal Name *</Label>
                                                <Input
                                                    required
                                                    placeholder="e.g. Maria Clara Santos"
                                                    value={p.name}
                                                    onChange={(e) => handleUpdateDiscountPerson(idx, "name", e.target.value)}
                                                    className="bg-white dark:bg-zinc-800 text-xs"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-foreground">Official ID Number *</Label>
                                                <Input
                                                    required
                                                    placeholder="e.g. OSCA-2024-5544 or School ID"
                                                    value={p.idNumber}
                                                    onChange={(e) => handleUpdateDiscountPerson(idx, "idNumber", e.target.value)}
                                                    className="bg-white dark:bg-zinc-800 font-mono text-xs uppercase"
                                                />
                                                <p className="text-[10px] text-muted-foreground">* Valid physical ID must be presented upon boarding.</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Realtime Fare Breakdown */}
                            <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/60 pb-2">
                                    <div className="flex items-center gap-1.5 font-black text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                        <Calculator className="h-4 w-4" />
                                        <span>Automatic Fare Calculation</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                                        Auto-Computed
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Fare ({seatCount} seat{seatCount > 1 ? "s" : ""} × ₱{unitFare}.00):</span>
                                        <span className="font-mono font-bold text-foreground">₱{totalBaseFare}.00</span>
                                    </div>
                                    {effectiveDiscountCount > 0 && (
                                        <div className="flex justify-between items-center font-bold text-emerald-600 dark:text-emerald-400">
                                            <span>20% Statutory Discount ({effectiveDiscountCount} passenger{effectiveDiscountCount > 1 ? "s" : ""}):</span>
                                            <span className="font-mono">-₱{totalDiscountAmount}.00</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center font-black text-sm pt-2 border-t text-foreground">
                                        <span>Total Amount to Pay via GCash:</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xl font-black">₱{finalFare}.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Official PayMongo GCash Payment Card (No Personal QR Required) */}
                        <div className="rounded-2xl border-2 border-blue-500/50 bg-gradient-to-b from-blue-50/70 via-white to-blue-50/30 dark:from-blue-950/40 dark:via-zinc-900 dark:to-zinc-950 p-5 space-y-4 shadow-md">
                            <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-900/60 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                                        G
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-blue-950 dark:text-blue-100 text-base leading-tight">
                                            3. GCash Online Payment (via PayMongo Gateway)
                                        </h3>
                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                            Official BSP-Supervised Automated Payment Gateway
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1.5 shadow-sm">
                                    <ShieldCheck className="h-4 w-4" />
                                    100% Automated &amp; Instant
                                </span>
                            </div>

                            {/* Gateway Information Banner */}
                            <div className="rounded-xl bg-blue-100/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-4 space-y-2 text-xs">
                                <p className="font-bold text-blue-950 dark:text-blue-100 flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                                    <span>Zero Manual Reference Verification:</span>
                                </p>
                                <p className="text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
                                    Hindi mo na kailangang mag-type ng Reference Number o mag-upload ng screenshot ng resibo. Pag-click ng <strong>&ldquo;Proceed to GCash Payment&rdquo;</strong>, ididirekta ka sa opisyal na PayMongo portal kung saan automatic na magbubukas ang iyong GCash app o opisyal na Dynamic QR code.
                                </p>
                                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                                    <span>• Instant QR Boarding Pass</span>
                                    <span>• Automatic Audit &amp; Direct Admin Report</span>
                                    <span>• PCI-DSS Level 1 Encrypted</span>
                                </div>
                            </div>

                            {/* Official Terms & Conditions */}
                            <div className="rounded-xl border p-4 bg-card space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <h4 className="font-bold text-xs uppercase tracking-wide">
                                            Passenger Terms &amp; Conditions
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowTermsModal(!showTermsModal)}
                                        className="text-xs text-blue-600 hover:text-blue-700 underline font-semibold flex items-center gap-1"
                                    >
                                        {showTermsModal ? "Hide Details" : "View Full Terms"}
                                        {showTermsModal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    </button>
                                </div>

                                {showTermsModal && (
                                    <div className="space-y-3 text-xs bg-muted/40 p-4 rounded-xl border max-h-72 overflow-y-auto leading-relaxed text-muted-foreground">
                                        <div className="text-center font-bold text-foreground border-b pb-2">
                                            SUPERLINES TRANSPORTATION CO., INC. and DAET AUTO EXPRESS TRANSIT, INC.
                                            <p className="text-[11px] font-normal text-muted-foreground">PASSENGER TERMS &amp; CONDITIONS</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground">1. Ticketing, Rebooking, and Cancellations</p>
                                            <p>• <strong>Reservation Policy:</strong> Tickets are valid only for the specific date and trip indicated.</p>
                                            <p>• <strong>Arrival Time:</strong> Passengers must be at the terminal at least one (1) hour before departure.</p>
                                            <p>• <strong>Penalty Fees:</strong> 20% penalty fee of the ticket price will be charged for rebooking.</p>
                                        </div>
                                        <div className="space-y-1 pt-1 border-t">
                                            <p className="font-bold text-foreground">2. Safety and Code of Conduct</p>
                                            <p>• In compliance with LTFRB Safe Spaces Act (Bawal ang Bastos), disrespectful behavior is strictly prohibited.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-2.5 pt-1">
                                    <input
                                        id="termsCheckbox"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="termsCheckbox" className="text-xs text-foreground cursor-pointer select-none leading-normal">
                                        I have read and agree to the <strong>Superlines Passenger Terms &amp; Conditions</strong> regarding Travel, Safety, and Conduct.
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/25 py-6 rounded-xl"
                                disabled={submitting}
                            >
                                {submitting ? "Redirecting to PayMongo GCash Gateway..." : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Wallet className="h-5 w-5" />
                                        Proceed to Pay with GCash (₱{finalFare}.00) &rarr;
                                    </span>
                                )}
                            </Button>
                            <p className="text-[11px] text-center text-muted-foreground">
                                ✉️ Official Confirmation: Once paid via GCash, your verified QR Boarding Pass will be issued automatically and synced immediately to Superlines Admin Reports.
                            </p>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function BookTripPage() {
    return (
        <Suspense fallback={<div className="container mx-auto py-12 text-center text-muted-foreground">Loading booking page...</div>}>
            <BookTripContent />
        </Suspense>
    );
}
