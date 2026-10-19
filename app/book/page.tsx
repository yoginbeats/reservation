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
    Info
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function BookTripContent() {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Schedule, 2: Select Seat, 3: Passenger Details & Checkout
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
    const [passengerEmail, setPassengerEmail] = useState("");
    const [passengerType, setPassengerType] = useState<"REGULAR" | "SENIOR" | "STUDENT" | "PWD">("REGULAR");
    const [discountId, setDiscountId] = useState("");
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

    const baseFare = Number(selectedTrip?.fare_amount || 650);
    const isDiscounted = passengerType !== "REGULAR";
    const discountRate = isDiscounted ? 0.20 : 0.0;
    const discountAmount = isDiscounted ? Math.round(baseFare * discountRate) : 0;
    const finalFare = baseFare - discountAmount;

    const handleConfirmDirectGcash = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip || !selectedSeat) return;

        if (!passengerName.trim()) {
            setError("Please enter the passenger full name.");
            return;
        }

        if (isDiscounted && !discountId.trim()) {
            setError(`Please enter your valid ${passengerType === "SENIOR" ? "Senior Citizen OSCA" : passengerType === "STUDENT" ? "Student" : "PWD"} ID Number.`);
            return;
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

        try {
            const response = await fetch('/api/payments/gcash-direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId: selectedTrip.id,
                    seatNumber: selectedSeat,
                    passengerName,
                    passengerContact,
                    passengerEmail,
                    originalPrice: baseFare,
                    totalPrice: finalFare,
                    passengerType,
                    discountAmount,
                    discountIdNumber: discountId.trim(),
                    gcashRefNumber: gcashRef.trim(),
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
                    passenger_type: passengerType,
                    discount_amount: discountAmount,
                    discount_id: discountId.trim(),
                    seat_number: selectedSeat,
                    total_price: finalFare,
                    original_price: baseFare,
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
        if (!selectedTrip || !selectedSeat) return;

        if (isDiscounted && !discountId.trim()) {
            setError(`Please enter your valid ${passengerType === "SENIOR" ? "Senior Citizen OSCA" : passengerType === "STUDENT" ? "Student" : "PWD"} ID Number.`);
            return;
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
                    seatNumber: selectedSeat,
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
                        totalSeats={45}
                        bookedSeats={bookedSeats}
                        selectedSeat={selectedSeat}
                        onSelectSeat={(seatNum) => setSelectedSeat(seatNum)}
                    />

                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                            disabled={!selectedSeat}
                            onClick={() => setStep(3)}
                        >
                            Continue to Passenger Details & Payment
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: PASSENGER DETAILS & PAYMONGO CHECKOUT */}
            {step === 3 && selectedTrip && selectedSeat && (
                <div className="space-y-6 max-w-xl mx-auto">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Passenger Details & PayMongo Payment</h2>
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
                                            <span className="text-xs line-through text-muted-foreground font-mono">₱{baseFare}</span>
                                            <span className="text-emerald-600 font-extrabold text-base">₱{finalFare}</span>
                                        </div>
                                    ) : (
                                        <span className="text-red-600 font-extrabold">₱{baseFare}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Schedule: {new Date(selectedTrip.departure_time).toLocaleString()}</span>
                                <span className="font-mono font-bold text-red-600">Seat #{selectedSeat < 10 ? `0${selectedSeat}` : selectedSeat}</span>
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
                                            2. Passenger Classification & Discount
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Select your category to automatically apply your 20% statutory discount.
                                        </p>
                                    </div>
                                    {isDiscounted && (
                                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            20% OFF APPLIED
                                        </span>
                                    )}
                                </div>

                                {/* Classification Selector Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {[
                                        { id: "REGULAR", label: "Regular", sub: "Standard Fare", icon: UserCheck },
                                        { id: "SENIOR", label: "Senior Citizen", sub: "20% Off (RA 9994)", icon: HeartHandshake },
                                        { id: "STUDENT", label: "Student", sub: "20% Off (RA 11314)", icon: GraduationCap },
                                        { id: "PWD", label: "PWD", sub: "20% Off (RA 10754)", icon: Accessibility },
                                    ].map((item) => {
                                        const isSelected = passengerType === item.id;
                                        const IconComponent = item.icon;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setPassengerType(item.id as any);
                                                    if (item.id === "REGULAR") setDiscountId("");
                                                }}
                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                                                    isSelected
                                                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-sm font-bold"
                                                        : "border-border hover:border-zinc-300 dark:hover:border-zinc-700 bg-background text-muted-foreground"
                                                }`}
                                            >
                                                <IconComponent className={`h-5 w-5 mb-1.5 ${isSelected ? "text-emerald-600" : "text-muted-foreground"}`} />
                                                <span className="text-xs font-extrabold">{item.label}</span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Required ID Input for Discount */}
                                {isDiscounted && (
                                    <div className="space-y-2 pt-2 border-t">
                                        <Label htmlFor="discId" className="font-bold text-xs flex items-center justify-between">
                                            <span>
                                                {passengerType === "SENIOR"
                                                    ? "Senior Citizen OSCA ID Number *"
                                                    : passengerType === "STUDENT"
                                                    ? "Student School ID Number / School Name *"
                                                    : "PWD ID Card Number *"}
                                            </span>
                                            <span className="text-[11px] font-normal text-muted-foreground">Required for 20% discount validation</span>
                                        </Label>
                                        <Input
                                            id="discId"
                                            required
                                            placeholder={
                                                passengerType === "SENIOR"
                                                    ? "e.g. OSCA-2024-998811"
                                                    : passengerType === "STUDENT"
                                                    ? "e.g. 2024-10892 (Bicol University)"
                                                    : "e.g. PWD-05-16-0023"
                                            }
                                            value={discountId}
                                            onChange={(e) => setDiscountId(e.target.value)}
                                            className="font-mono text-sm uppercase bg-white dark:bg-zinc-800"
                                        />
                                        <div className="flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200">
                                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Superlines Policy:</strong> Valid physical identification ({passengerType === "SENIOR" ? "Government-issued Senior ID" : passengerType === "STUDENT" ? "Validated School ID for current school year or Certificate of Enrollment" : "Government-issued PWD ID"}) must be presented upon boarding.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Realtime Fare Calculation Breakdown */}
                                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-3 border text-xs space-y-1.5">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Base Regular Fare:</span>
                                        <span className="font-mono">₱{baseFare}.00</span>
                                    </div>
                                    {isDiscounted && (
                                        <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                            <span>Statutory Discount (20% - {passengerType}):</span>
                                            <span className="font-mono">-₱{discountAmount}.00</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-black text-sm pt-1.5 border-t text-foreground">
                                        <span>Total Amount Due:</span>
                                        <span className="font-mono text-red-600 text-base">₱{finalFare}.00</span>
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
                                        <span className="text-muted-foreground">Amount to Send:</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-black text-base text-red-600 font-mono">
                                                ₱{finalFare}.00
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleCopy(String(finalFare), "amount")}
                                                title="Copy Amount"
                                            >
                                                {copied === "amount" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Step Instructions */}
                                <div className="space-y-1.5 text-xs text-blue-900 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-950/40 p-3.5 rounded-lg border border-blue-200">
                                    <p className="font-bold text-sm">How to Pay via GCash:</p>
                                    <p>1. Open your GCash app and select <strong>QR (Scan)</strong> to scan the code above, or tap <strong>Send Money</strong> to the mobile number listed.</p>
                                    <p>2. Send the exact fare amount of <strong>₱{finalFare}.00</strong>.</p>
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
