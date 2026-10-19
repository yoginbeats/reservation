"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatPicker } from "@/components/seat-picker";
import { Bus, MapPin, Calendar, Clock, Wallet, ArrowRight, Check, AlertCircle, QrCode, Copy, CheckCircle2, Upload, ShieldCheck, Image as ImageIcon } from "lucide-react";
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

    const handleConfirmDirectGcash = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip || !selectedSeat) return;

        if (!passengerName.trim()) {
            setError("Please enter the passenger full name.");
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
                    totalPrice: selectedTrip.fare_amount || 850,
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
                    seat_number: selectedSeat,
                    total_price: selectedTrip.fare_amount || 850,
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
                    totalPrice: selectedTrip.fare_amount || 850,
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
                                <span className="text-red-600 font-extrabold">₱{selectedTrip.fare_amount || 850}</span>
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

                            {/* Direct GCash QR Card */}
                            <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-b from-blue-50/60 to-white dark:from-blue-950/30 dark:to-zinc-900 p-5 space-y-5 shadow-sm">
                                <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                                            G
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-blue-950 dark:text-blue-100 text-base leading-tight">GCash Scan to Pay</h3>
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
                                            <span className="font-black text-base text-red-600">
                                                ₱{selectedTrip.fare_amount || 850}.00
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => handleCopy(String(selectedTrip.fare_amount || 850), "amount")}
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
                                    <p>2. Send the exact fare amount of <strong>₱{selectedTrip.fare_amount || 850}.00</strong>.</p>
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

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/20 py-6"
                                disabled={submitting}
                            >
                                {submitting ? "Verifying GCash Payment..." : (
                                    <span className="flex items-center justify-center gap-2">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Confirm GCash Payment & Issue Ticket (₱{selectedTrip.fare_amount || 850})
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
                                        Pay via PayMongo Hosted Link (₱{selectedTrip.fare_amount || 850})
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
