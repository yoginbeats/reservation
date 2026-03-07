"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Search, Users, ArrowRightLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function BookingForm() {
    const router = useRouter();
    const supabase = createClient();

    const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
    const [busType, setBusType] = useState<string>("Regular Aircon");
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [departureDate, setDepartureDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [passengers, setPassengers] = useState(1);

    const locationOptions: Record<string, string[]> = {
        "Regular Aircon": ["CUBAO", "PITX", "DAET", "TURBINA", "ALABANG"],
        "Deluxe": ["CUBAO", "PITX", "DAET"],
        "First Class": ["CUBAO", "PITX", "DAET"]
    };

    const [currentOrigins, setCurrentOrigins] = useState<string[]>([]);
    const [currentDestinations, setCurrentDestinations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch unique origins and destinations from Supabase
    useEffect(() => {
        const fetchLocations = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('trips')
                .select('origin, destination');

            if (data) {
                const origins = Array.from(new Set(data.map(item => item.origin))).sort();
                const destinations = Array.from(new Set(data.map(item => item.destination))).sort();
                setCurrentOrigins(origins);
                setCurrentDestinations(destinations);
            }
            setIsLoading(false);
        };
        fetchLocations();
    }, []);

    // Filter destinations based on selected origin
    const [availableDestinations, setAvailableDestinations] = useState<string[]>([]);
    useEffect(() => {
        const fetchFilteredDestinations = async () => {
            if (!origin) {
                setAvailableDestinations(currentDestinations);
                return;
            }
            const { data } = await supabase
                .from('trips')
                .select('destination')
                .eq('origin', origin);

            if (data) {
                const filtered = Array.from(new Set(data.map(item => item.destination))).sort();
                setAvailableDestinations(filtered);
            }
        };
        fetchFilteredDestinations();
    }, [origin, currentDestinations]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams();
        if (origin) params.append("origin", origin);
        if (destination) params.append("destination", destination);
        if (busType) params.append("busType", busType);
        if (departureDate) params.append("date", departureDate);
        if (tripType === "round-trip" && returnDate) params.append("returnDate", returnDate);
        params.append("passengers", passengers.toString());

        router.push(`/reservations?${params.toString()}`);
    };

    return (
        <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 text-zinc-900 shadow-2xl dark:bg-zinc-900 dark:text-zinc-50 border border-zinc-100 dark:border-zinc-800">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-2xl font-black uppercase tracking-tight">Book Your <span className="text-red-600">Trip</span></h3>

                <div className="flex flex-wrap items-center gap-2">
                    <Tabs value={tripType} onValueChange={(v) => setTripType(v as any)} className="w-fit">
                        <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                            <TabsTrigger value="one-way" className="rounded-lg px-3 py-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-red-600">One-way</TabsTrigger>
                            <TabsTrigger value="round-trip" className="rounded-lg px-3 py-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-red-600">Round-trip</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
                {/* Bus Type Selection */}
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Service Class</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.keys(locationOptions).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setBusType(type)}
                                className={cn(
                                    "px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-tighter transition-all",
                                    busType === type
                                        ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none"
                                        : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-red-200 dark:bg-zinc-800 dark:border-zinc-700"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Origin */}
                    <div className="space-y-2">
                        <Label htmlFor="origin" className="text-xs font-black uppercase tracking-wider text-zinc-500">Origin</Label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600" />
                            <select
                                id="origin"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="w-full pl-12 h-14 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700 appearance-none"
                                required
                            >
                                <option value="" disabled>Select Starting Point</option>
                                {currentOrigins.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Destination */}
                    <div className="space-y-2">
                        <Label htmlFor="destination" className="text-xs font-black uppercase tracking-wider text-zinc-500">Destination</Label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600" />
                            <select
                                id="destination"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full pl-12 h-14 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700 appearance-none"
                                required
                            >
                                <option value="" disabled>Select Destination</option>
                                {availableDestinations.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Departure Date */}
                    <div className="space-y-2">
                        <Label htmlFor="departureDate" className="text-xs font-black uppercase tracking-wider text-zinc-500">Departure</Label>
                        <div className="relative group/field">
                            <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600 transition-transform group-hover/field:scale-110 pointer-events-none" />
                            <Input
                                id="departureDate"
                                type="date"
                                value={departureDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                className="pl-12 h-14 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700 transition-all hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Return Date (Conditional) */}
                    <div className={cn(
                        "space-y-2 transition-all duration-300",
                        tripType === "one-way" ? "opacity-30 scale-95 grayscale pointer-events-none" : "opacity-100 scale-100"
                    )}>
                        <Label htmlFor="returnDate" className="text-xs font-black uppercase tracking-wider text-zinc-500">Return</Label>
                        <div className="relative group/field">
                            <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600 transition-transform group-hover/field:scale-110 pointer-events-none" />
                            <Input
                                id="returnDate"
                                type="date"
                                value={returnDate}
                                min={departureDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setReturnDate(e.target.value)}
                                disabled={tripType === "one-way"}
                                className="pl-12 h-14 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700 transition-all hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                                required={tripType === "round-trip"}
                            />
                        </div>
                    </div>

                    {/* Passengers */}
                    <div className="space-y-2">
                        <Label htmlFor="passengers" className="text-xs font-black uppercase tracking-wider text-zinc-500">Passengers</Label>
                        <div className="relative group/field">
                            <Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600 transition-transform group-hover/field:scale-110" />
                            <Input
                                id="passengers"
                                type="number"
                                min="1"
                                max="10"
                                value={passengers}
                                onChange={(e) => setPassengers(parseInt(e.target.value))}
                                className="pl-12 h-14 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-red-500 dark:bg-zinc-800 dark:border-zinc-700 font-bold transition-all hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                                required
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-16 rounded-2xl bg-red-600 text-white font-black text-xl hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-none transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                    <Search className="h-6 w-6 stroke-[3]" />
                    Check Availability
                </Button>
            </form>

            <p className="mt-6 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Trusted by 50,000+ happy travelers this year
            </p>
        </div>
    );
}
