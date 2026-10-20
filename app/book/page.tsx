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
    Calculator
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tripIdParam = searchParams.get("tripId");

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
        let rawData: any[] = [];
        
        // 1. Try fetching with bus relation
        const { data, error } = await supabase
            .from('trips')
            .select('*, bus:buses(bus_number, bus_type)')
            .order('departure_time', { ascending: true });

        if (error) {
            console.warn("Retrying simple trip fetch:", error.message || error);
            // 2. Fallback to basic trips query
            const { data: fallbackData } = await supabase
                .from('trips')
                .select('*')
                .order('departure_time', { ascending: true });
            if (fallbackData) rawData = fallbackData;
        } else if (data) {
            rawData = data;
        }

        // Normalize trip schema to support both legacy and direct columns
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
        setLoading(false);

        if (tripIdParam) {
            const matched = normalizedTrips.find((t: any) => t.id === tripIdParam);
            if (matched) {
                handleSelectTrip(matched);
            }
        }
    };

    const handleSelectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        setSelectedSeat(null);
        setSelectedSeats([]);
        setDiscountCount(0);
        setDiscountPersons([]);
        setLoading(true);

        // Fetch booked seats for this trip from trip_seats table
        const { data: seatsData } = await supabase
            .from('trip_seats')
            .select('seat_number, is_available')
            .eq('trip_id', trip.id)
            .eq('is_available', false);

        if (seatsData) {
            setBookedSeats(seatsData.map(s => s.seat_number));
        }

        setLoading(false);
        setStep(2);
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
                    passengerName,
                    passengerContact,
                    passengerEmail,
                    totalPrice: finalFare,
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
                        seat_number: selectedSeat,
                        total_price: selectedTrip.fare_amount || 850,
                        trip: selectedTrip,
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
        <div className="container mx-auto max-w-4xl py-8 space-y-8">
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
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Available Trip Schedules</h2>
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">Loading available schedules...</div>
                    ) : trips.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {trips.map((t) => {
                                const origin = t.route?.origin?.name || "Origin";
                                const dest = t.route?.destination?.name || "Destination";
                                const busNum = t.bus?.bus_number || "Superlines Express";
                                const depTime = new Date(t.departure_time);

                                return (
                                    <Card key={t.id} className="transition-all hover:border-red-500 hover:shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between text-xs font-semibold uppercase text-red-600">
                                                <span>{busNum}</span>
                                                <span className="font-mono text-base font-extrabold text-foreground">
                                                    ₱{t.fare_amount || 850}
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg flex items-center justify-between mt-1">
                                                <span>{origin}</span>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                <span>{dest}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-zinc-500" />
                                                <span>{depTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-zinc-500" />
                                                <span>{depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleSelectTrip(t)}>
                                                Select Schedule & Choose Seat
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="p-8 text-center text-muted-foreground">
                            No active trips found. Please check back later or contact admin.
                        </Card>
                    )}
                </div>
            )}

            {/* STEP 2: SELECT SEAT */}
            {step === 2 && selectedTrip && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Select Your Seat</h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name} • {new Date(selectedTrip.departure_time).toLocaleString()}
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
                            if (selectedSeats.length === 0) setSelectedSeats([seatNum]);
                        }}
                        onSelectSeats={(seats) => {
                            setSelectedSeats(seats);
                            if (seats.length > 0) setSelectedSeat(seats[0]);
                            else setSelectedSeat(null);
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
                                <span>Schedule: {new Date(selectedTrip.departure_time).toLocaleString()}</span>
                                <span className="font-mono font-bold text-red-600">
                                    {selectedSeats.length > 0
                                        ? `Seats (${selectedSeats.length}): ${selectedSeats.map((s) => `#${s < 10 ? `0${s}` : s}`).join(", ")}`
                                        : `Seat #${selectedSeat}`}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Mode Selector Tabs */}
                    <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("gcash_qr")}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                                paymentMethod === "gcash_qr"
                                    ? "bg-blue-600 text-white shadow"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <QrCode className="h-4 w-4" />
                            Direct GCash QR (Instant)
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod("paymongo")}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                                paymentMethod === "paymongo"
                                    ? "bg-blue-600 text-white shadow"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Wallet className="h-4 w-4" />
                            PayMongo Checkout Link
                        </button>
                    </div>

                    {paymentMethod === "gcash_qr" ? (
                        <form onSubmit={handleConfirmDirectGcash} className="space-y-6">
                            {/* Passenger Details */}
                            <div className="space-y-4 rounded-xl border p-4 bg-card">
                                <h3 className="font-bold text-sm text-foreground">1. Passenger Information</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="pName">Passenger Full Name *</Label>
                                    <Input
                                        id="pName"
                                        required
                                        placeholder="Juan Dela Cruz"
                                        value={passengerName}
                                        onChange={(e) => setPassengerName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="pContact">Mobile Number *</Label>
                                        <Input
                                            id="pContact"
                                            required
                                            placeholder="09171234567"
                                            value={passengerContact}
                                            onChange={(e) => setPassengerContact(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pEmail">Email Address (for receipt) *</Label>
                                        <Input
                                            id="pEmail"
                                            type="email"
                                            required
                                            placeholder="juan@gmail.com"
                                            value={passengerEmail}
                                            onChange={(e) => setPassengerEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Passenger Classification & Automatic Discount */}
                            <div className="space-y-4 rounded-xl border p-4 bg-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                            <Percent className="h-4 w-4 text-emerald-600" />
                                            2. Passenger Classification & Automatic Discount
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Statutory 20% discount for Senior Citizens (RA 9994), Students (RA 11314), and PWDs (RA 10754).
                                        </p>
                                    </div>
                                    {isDiscounted ? (
                                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            {effectiveDiscountCount}x 20% DISCOUNT APPLIED
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                            Regular Fares
                                        </span>
                                    )}
                                </div>

                                {/* Option: Ilan ang i-didiscount (Number of Discounted Passengers) */}
                                <div className="space-y-2 pt-1 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-foreground">
                                            How many passengers to discount? (Ilan ang i-didiscount):
                                        </Label>
                                        <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                                            {effectiveDiscountCount} of {seatCount} Seat{seatCount > 1 ? "s" : ""} Discounted
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from({ length: seatCount + 1 }).map((_, count) => (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => handleSetDiscountCount(count)}
                                                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                                                    discountCount === count
                                                        ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20"
                                                        : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                                                }`}
                                            >
                                                {count === 0 ? "0 (All Regular)" : `${count} Discounted (-20%)`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Form per Discounted Person */}
                                {effectiveDiscountCount === 0 ? (
                                    <div className="p-3 rounded-xl bg-muted/30 border border-dashed text-xs text-muted-foreground text-center">
                                        No discount selected. Standard regular fare (₱{unitFare}.00 per seat) applies.
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-1">
                                        {discountPersons.slice(0, effectiveDiscountCount).map((p, idx) => (
                                            <div
                                                key={p.id || idx}
                                                className="rounded-xl border-2 border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 p-4 space-y-3"
                                            >
                                                <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-5 w-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                                                            {idx + 1}
                                                        </span>
                                                        <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                                                            Discounted Passenger #{idx + 1}
                                                        </h4>
                                                    </div>
                                                    <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full">
                                                        -20% Fare Deduction
                                                    </span>
                                                </div>

                                                {/* Classification Discount */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-foreground">
                                                        Discount Classification *
                                                    </Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { id: "SENIOR", label: "Senior Citizen", sub: "RA 9994", icon: HeartHandshake },
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

                                                {/* Name ng Discount Person */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-foreground">
                                                        Name ng Discount Person (Full Legal Name) *
                                                    </Label>
                                                    <Input
                                                        required
                                                        placeholder={
                                                            p.classification === "SENIOR"
                                                                ? "e.g. Juan Dela Cruz Sr."
                                                                : p.classification === "STUDENT"
                                                                ? "e.g. Maria Clara Santos"
                                                                : "e.g. Pedro Reyes"
                                                        }
                                                        value={p.name}
                                                        onChange={(e) => handleUpdateDiscountPerson(idx, "name", e.target.value)}
                                                        className="bg-white dark:bg-zinc-800 text-xs"
                                                    />
                                                </div>

                                                {/* ID No. */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-foreground">
                                                        {p.classification === "SENIOR"
                                                            ? "OSCA Senior Citizen ID Number *"
                                                            : p.classification === "STUDENT"
                                                            ? "Student School ID Number / Registration Ref *"
                                                            : "PWD ID Card Number *"}
                                                    </Label>
                                                    <Input
                                                        required
                                                        placeholder={
                                                            p.classification === "SENIOR"
                                                                ? "e.g. OSCA-2024-5544"
                                                                : p.classification === "STUDENT"
                                                                ? "e.g. 2024-ST-99881"
                                                                : "e.g. PWD-05-16-0023"
                                                        }
                                                        value={p.idNumber}
                                                        onChange={(e) => handleUpdateDiscountPerson(idx, "idNumber", e.target.value)}
                                                        className="bg-white dark:bg-zinc-800 font-mono text-xs uppercase"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">
                                                        * Valid physical {p.classification} ID must be presented upon boarding per Superlines terms.
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Realtime Fare & Discount Calculation Breakdown */}
                                <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                                    <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/60 pb-2">
                                        <div className="flex items-center gap-1.5 font-black text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                            <Calculator className="h-4 w-4" />
                                            <span>Automatic Fare & Discount Calculation</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                                            Auto-Calculated
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center text-muted-foreground">
                                            <span>Fare ({seatCount} seat{seatCount > 1 ? "s" : ""} × ₱{unitFare}.00):</span>
                                            <span className="font-mono font-bold text-foreground">₱{totalBaseFare}.00</span>
                                        </div>

                                        {effectiveDiscountCount > 0 ? (
                                            <div className="space-y-1 pt-1 border-t border-dashed border-emerald-200 dark:border-emerald-900">
                                                <div className="flex justify-between items-center font-bold text-emerald-600 dark:text-emerald-400">
                                                    <span>20% Statutory Discount ({effectiveDiscountCount} passenger{effectiveDiscountCount > 1 ? "s" : ""} × ₱{discountPerPassenger}.00):</span>
                                                    <span className="font-mono">-₱{totalDiscountAmount}.00</span>
                                                </div>
                                                {discountPersons.slice(0, effectiveDiscountCount).map((p, idx) => (
                                                    <div key={p.id || idx} className="flex justify-between text-[11px] text-muted-foreground pl-3">
                                                        <span>• #{idx + 1} {p.name || `Passenger ${idx + 1}`} ({p.classification} 20%):</span>
                                                        <span className="font-mono">-₱{discountPerPassenger}.00</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-muted-foreground text-[11px] italic">
                                                <span>20% Statutory Discount:</span>
                                                <span className="font-mono">₱0.00 (No discount applied)</span>
                                            </div>
                                        )}

                                        {/* Formula Callout Example */}
                                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between text-xs font-semibold gap-1 mt-2">
                                            <span className="text-muted-foreground">Calculation Formula:</span>
                                            <div className="font-mono flex items-center gap-1.5 text-xs">
                                                <span className="text-foreground">₱{totalBaseFare}.00 <span className="text-[10px] text-muted-foreground">(Fare)</span></span>
                                                <span className="text-emerald-600 font-bold">-</span>
                                                <span className="text-emerald-600 font-bold">₱{totalDiscountAmount}.00 <span className="text-[10px] text-emerald-700 dark:text-emerald-300">(Discount)</span></span>
                                                <span className="font-black text-foreground">=</span>
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₱{finalFare}.00 <span className="text-[10px] text-foreground font-normal">(Total)</span></span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center font-black text-sm pt-2 border-t text-foreground">
                                            <div className="flex flex-col">
                                                <span>Total Amount to Pay via GCash:</span>
                                                <span className="text-[10px] font-normal text-muted-foreground">Exact amount to be transferred to merchant</span>
                                            </div>
                                            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xl font-black">₱{finalFare}.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Direct GCash QR Card */}
                            <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-b from-blue-50/60 to-white dark:from-blue-950/30 dark:to-zinc-900 p-5 space-y-5 shadow-sm">
                                <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                                            G
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-blue-950 dark:text-blue-100 text-base leading-tight">3. GCash Scan to Pay</h3>
                                            <p className="text-xs text-blue-700 dark:text-blue-300">Official Merchant / Ticket Payment</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Verified
                                    </span>
                                </div>

                                {/* Calculation Summary Highlight Bar */}
                                <div className="rounded-xl bg-blue-100/70 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-3.5 text-xs space-y-1.5">
                                    <div className="flex justify-between items-center text-blue-900 dark:text-blue-200">
                                        <span className="font-bold">Trip Base Fare:</span>
                                        <span className="font-mono font-bold">₱{totalBaseFare}.00</span>
                                    </div>
                                    {totalDiscountAmount > 0 && (
                                        <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-300 font-bold">
                                            <span>20% Statutory Discount ({effectiveDiscountCount} passenger{effectiveDiscountCount > 1 ? "s" : ""}):</span>
                                            <span className="font-mono">-₱{totalDiscountAmount}.00</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-1.5 border-t border-blue-200 dark:border-blue-800">
                                        <div className="font-black text-sm text-blue-950 dark:text-blue-100 flex items-center gap-1">
                                            <span>Total to Send via GCash:</span>
                                        </div>
                                        <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                                            ₱{finalFare}.00
                                        </span>
                                    </div>
                                </div>

                                {/* QR Code Display */}
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="relative group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={customQrUrl || process.env.NEXT_PUBLIC_GCASH_QR_URL || "/gcash-qr.jpg"}
                                            alt="GCash QR Code"
                                            className="max-h-80 w-auto rounded-xl border-2 border-blue-400 shadow-md bg-white p-1 object-contain"
                                        />
                                    </div>

                                    {/* Action links */}
                                    <div className="flex items-center gap-4 text-xs font-semibold">
                                        <a
                                            href={customQrUrl || process.env.NEXT_PUBLIC_GCASH_QR_URL || "/gcash-qr.jpg"}
                                            download="gcash-qr-superlines.jpg"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 underline"
                                        >
                                            Save / Download QR
                                        </a>
                                        <span>•</span>
                                        <label htmlFor="qrUploadInput" className="cursor-pointer inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 underline">
                                            <Upload className="h-3.5 w-3.5" />
                                            {customQrUrl ? "Change QR Image" : "Upload QR Image"}
                                        </label>
                                        <input
                                            id="qrUploadInput"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleQrUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                {/* Account Details Card */}
                                <div className="rounded-xl bg-white dark:bg-zinc-800 p-4 border space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b">
                                        <span className="text-muted-foreground">Account Name:</span>
                                        <span className="font-extrabold text-foreground tracking-wide">
                                            {process.env.NEXT_PUBLIC_GCASH_NAME || "PHOEBE MARGARET MAGO"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b">
                                        <span className="text-muted-foreground">GCash Mobile:</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-black text-sm text-blue-600">
                                                {process.env.NEXT_PUBLIC_GCASH_NUMBER || "0993 317 6559"}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleCopy(process.env.NEXT_PUBLIC_GCASH_NUMBER || "09933176559", "number")}
                                                title="Copy GCash Number"
                                            >
                                                {copied === "number" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground font-bold">Total Amount to Send via GCash:</span>
                                            {totalDiscountAmount > 0 && (
                                                <span className="text-[10px] text-emerald-600 font-medium">
                                                    (Fare ₱{totalBaseFare}.00 - Discount ₱{totalDiscountAmount}.00)
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-black text-lg text-emerald-600 font-mono">
                                                ₱{finalFare}.00
                                            </span>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 px-2 text-xs font-bold text-blue-600 hover:text-blue-700"
                                                onClick={() => handleCopy(String(finalFare), "amount")}
                                                title="Copy Exact Amount"
                                            >
                                                {copied === "amount" ? (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <Check className="h-3 w-3" /> Copied
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <Copy className="h-3 w-3" /> Copy ₱{finalFare}
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Step Instructions */}
                                <div className="space-y-1.5 text-xs text-blue-900 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-950/40 p-3.5 rounded-lg border border-blue-200">
                                    <p className="font-bold text-sm">How to Pay via GCash:</p>
                                    <p>1. Open your GCash app and select <strong>QR (Scan)</strong> to scan the code above, or tap <strong>Send Money</strong> to <strong>{process.env.NEXT_PUBLIC_GCASH_NUMBER || "0993 317 6559"}</strong>.</p>
                                    <p>
                                        2. Enter the exact calculated total of <strong>₱{finalFare}.00</strong>
                                        {totalDiscountAmount > 0 ? ` (Base Fare ₱${totalBaseFare}.00 minus Statutory Discount ₱${totalDiscountAmount}.00)` : ""}.
                                    </p>
                                    <p>3. Copy the <strong>13-digit Reference Number</strong> from your GCash confirmation receipt or SMS and enter it below.</p>
                                </div>

                                {/* Reference Number Input */}
                                <div className="space-y-2 pt-1">
                                    <Label htmlFor="refNumber" className="font-bold text-sm flex items-center justify-between">
                                        <span>GCash Reference Number *</span>
                                        <span className="text-xs font-normal text-muted-foreground">Found on GCash receipt / SMS</span>
                                    </Label>
                                    <Input
                                        id="refNumber"
                                        required
                                        placeholder="e.g. 1002 9845 2311 (13-digit Reference No.)"
                                        value={gcashRef}
                                        onChange={(e) => setGcashRef(e.target.value)}
                                        className="font-mono text-base tracking-wider bg-white dark:bg-zinc-800 border-2 focus-visible:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* 4. Superlines Official Passenger Terms & Conditions */}
                            <div className="rounded-xl border p-4 bg-card space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <h4 className="font-bold text-xs uppercase tracking-wide">
                                            Passenger Terms & Conditions
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
                                            <p className="text-[11px] font-normal text-muted-foreground">PASSENGER TERMS & CONDITIONS</p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground">1. Ticketing, Rebooking, and Cancellations</p>
                                            <p>• <strong>Reservation Policy:</strong> Tickets are valid only for the specific date and trip indicated.</p>
                                            <p>• <strong>Arrival Time:</strong> Passengers must be at the terminal at least one (1) hour before the scheduled departure.</p>
                                            <p>• <strong>Penalty Fees:</strong> Effective November 03, 2023, a 20% penalty fee of the total ticket price will be charged for Re-scheduling/Rebooking and advance reservation.</p>
                                            <p>• <strong>Cancellations/Refunds:</strong> To process a rebooking or cancellation, the passenger must present the physical ticket at the terminal office.</p>
                                        </div>

                                        <div className="space-y-1 pt-1 border-t">
                                            <p className="font-bold text-foreground">2. Pet Policy (Pet-Friendly Bus)</p>
                                            <p>Small pets are allowed on designated trips (9:30 AM, 8:00 PM, and 9:30 PM) subject to:</p>
                                            <p>• <strong>Containment:</strong> Pets must be kept inside a cage or pet bag.</p>
                                            <p>• <strong>Hygiene:</strong> Pets must wear a diaper at all times.</p>
                                            <p>• <strong>Fare:</strong> A full regular fare must be paid for the pet as it occupies one (1) seat.</p>
                                            <p>• <strong>Size Restriction:</strong> Large dogs/animals are strictly prohibited.</p>
                                        </div>

                                        <div className="space-y-1 pt-1 border-t">
                                            <p className="font-bold text-foreground">3. Discounts and Baggage</p>
                                            <p>• <strong>Eligibility:</strong> To avail of discounted fares, valid identification must be presented.</p>
                                            <p>• <strong>Senior Citizen / PWD:</strong> Government-issued ID required.</p>
                                            <p>• <strong>Student:</strong> Validated School ID for the current school year or Certificate of Enrollment/Registration.</p>
                                            <p>• <strong>Baggage:</strong> Hand-carry items are free and remain the responsibility of the passenger. Excess baggage will be subject to additional charges.</p>
                                        </div>

                                        <div className="space-y-1 pt-1 border-t">
                                            <p className="font-bold text-foreground">4. Safety and Code of Conduct</p>
                                            <p>• <strong>Bawal ang Bastos:</strong> In compliance with LTFRB Memorandum Circular No. 016 (Safe Spaces Act), any form of sexual harassment or disrespectful behavior toward passengers or staff is strictly prohibited.</p>
                                            <p>• <strong>Reporting:</strong> Violations can be reported to the LTFRB via Hotline (1342) or email (complaints@ltfrb.gov.ph).</p>
                                        </div>
                                    </div>
                                )}

                                {/* Terms Acceptance Checkbox */}
                                <div className="flex items-start gap-2.5 pt-1">
                                    <input
                                        id="termsCheckbox"
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="termsCheckbox" className="text-xs text-foreground cursor-pointer select-none leading-normal">
                                        I have read and agree to the <strong>Superlines Passenger Terms & Conditions</strong> regarding Travel, Safety, and Conduct.
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/20 py-6"
                                disabled={submitting}
                            >
                                {submitting ? "Verifying GCash Payment..." : (
                                    <span className="flex items-center justify-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Confirm GCash Payment & Issue Ticket (₱{finalFare}.00)
                                    </span>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleProceedToCheckout} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pName2">Passenger Full Name *</Label>
                                <Input
                                    id="pName2"
                                    required
                                    placeholder="Juan Dela Cruz"
                                    value={passengerName}
                                    onChange={(e) => setPassengerName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pContact2">Mobile Number *</Label>
                                <Input
                                    id="pContact2"
                                    required
                                    placeholder="09171234567"
                                    value={passengerContact}
                                    onChange={(e) => setPassengerContact(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pEmail2">Email Address *</Label>
                                <Input
                                    id="pEmail2"
                                    type="email"
                                    required
                                    placeholder="juan@gmail.com"
                                    value={passengerEmail}
                                    onChange={(e) => setPassengerEmail(e.target.value)}
                                />
                            </div>

                            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-xs text-muted-foreground space-y-1">
                                <p className="font-semibold text-foreground">PayMongo Hosted Gateway:</p>
                                <p>• Requires an approved & active PayMongo merchant account with enabled GCash.</p>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                disabled={submitting}
                            >
                                {submitting ? "Redirecting to PayMongo..." : (
                                    <span className="flex items-center gap-2">
                                        <Wallet className="h-5 w-5" />
                                        Pay via PayMongo Hosted Link (₱{finalFare}.00)
                                    </span>
                                )}
                            </Button>
                        </form>
                    )}
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
