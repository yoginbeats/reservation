"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatPicker } from "@/components/seat-picker";
import { Bus, MapPin, Calendar, Clock, CreditCard, ArrowRight, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BookTripPage() {
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

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchTrips();
        fetchCurrentUser();
    }, []);

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
        const { data, error } = await supabase
            .from('trips')
            .select(`
                id,
                departure_time,
                fare_amount,
                bus:buses(bus_number, bus_type),
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
        }
        setLoading(false);
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
                    <p className="text-sm text-muted-foreground">Select a schedule, choose your seat, and pay securely online.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-muted'}`}>1. Schedule</span>
                    <span>→</span>
                    <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-muted'}`}>2. Seat Map</span>
                    <span>→</span>
                    <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-blue-600 text-white' : 'bg-muted'}`}>3. Checkout</span>
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
                                    <Card key={t.id} className="transition-all hover:border-blue-500 hover:shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between text-xs font-semibold uppercase text-blue-600">
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
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleSelectTrip(t)}>
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
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!selectedSeat}
                            onClick={() => setStep(3)}
                        >
                            Continue to Passenger Details
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: PASSENGER DETAILS & PAYMONGO CHECKOUT */}
            {step === 3 && selectedTrip && selectedSeat && (
                <div className="space-y-6 max-w-xl mx-auto">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Passenger Details & Payment</h2>
                        <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                            Back to Seat Map
                        </Button>
                    </div>

                    {/* Trip Summary Card */}
                    <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
                        <CardContent className="p-4 space-y-2 text-sm">
                            <div className="flex justify-between font-bold">
                                <span>{selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name}</span>
                                <span>₱{selectedTrip.fare_amount || 850}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Schedule: {new Date(selectedTrip.departure_time).toLocaleString()}</span>
                                <span className="font-mono font-bold text-blue-600">Seat #{selectedSeat < 10 ? `0${selectedSeat}` : selectedSeat}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <form onSubmit={handleProceedToCheckout} className="space-y-4">
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
                            <Label htmlFor="pEmail">Email Address (for Digital Ticket receipt) *</Label>
                            <Input
                                id="pEmail"
                                type="email"
                                required
                                placeholder="juan@gmail.com"
                                value={passengerEmail}
                                onChange={(e) => setPassengerEmail(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            disabled={submitting}
                        >
                            {submitting ? "Initiating PayMongo Checkout..." : (
                                <span className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Pay Online via PayMongo (₱{selectedTrip.fare_amount || 850})
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
