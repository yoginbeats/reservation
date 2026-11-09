"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
    MapPin, 
    Calendar, 
    Users, 
    Search, 
    ShieldCheck, 
    Clock, 
    Star, 
    ArrowRight,
    RefreshCw
} from "lucide-react";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { getTodayPH, formatDatePH, formatTimePH } from "@/lib/date-utils";
import { AcademicDisclaimerCard, AcademicDisclaimerModal } from "@/components/academic-disclaimer";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
    const [serviceClass, setServiceClass] = useState<"REGULAR AIRCON" | "SUPER DELUXE" | "FIRST CLASS">("REGULAR AIRCON");
    const [origin, setOrigin] = useState("Cubao");
    const [destination, setDestination] = useState("Daet");
    const [departureDate, setDepartureDate] = useState(() => getTodayPH());
    const [returnDate, setReturnDate] = useState("");
    const [passengers, setPassengers] = useState("1");
    const [adminTrips, setAdminTrips] = useState<any[]>([]);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [homepageDate, setHomepageDate] = useState<string>("ALL");
    const supabase = createClient();

    const fetchAdminTrips = async () => {
        try {
            setLoadingTrips(true);
            const res = await fetch(`/api/admin/trips?_t=${Date.now()}`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" }
            });
            const data = await res.json();
            if (data?.success && Array.isArray(data.trips)) {
                setAdminTrips(data.trips);
            }
        } catch (e) {
            console.warn("Could not load admin scheduled trips:", e);
        } finally {
            setLoadingTrips(false);
        }
    };

    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const res = await fetch("/api/auth/session");
                const data = await res.json();
                if (data?.authenticated && data?.user) {
                    setUser(data.user);
                    return;
                }
            } catch {}

            try {
                const { data } = await supabase.auth.getUser();
                if (data?.user) setUser(data.user);
            } catch {}
        };
        checkUserSession();
        fetchAdminTrips();

        const onFocus = () => fetchAdminTrips();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, []);

    // Unique dates from active admin-dispatched trips
    const availableDates = Array.from(
        new Set(
            adminTrips
                .map((t) => (t.departure_time ? t.departure_time.slice(0, 10) : ""))
                .filter(Boolean)
        )
    ).sort();

    // Check trips available on currently selected departureDate in hero
    const heroDateTrips = adminTrips.filter(
        (t) => t.departure_time && t.departure_time.slice(0, 10) === departureDate
    );

    // Trips displayed in the live departures section
    const displayedHomepageTrips = homepageDate === "ALL"
        ? adminTrips
        : adminTrips.filter((t) => t.departure_time && t.departure_time.slice(0, 10) === homepageDate);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const effectiveDate = departureDate || "";
        const params = new URLSearchParams();
        if (effectiveDate) params.set("date", effectiveDate);
        if (origin) params.set("origin", origin);
        if (destination) params.set("destination", destination);
        if (serviceClass) params.set("serviceClass", serviceClass);
        if (passengers) params.set("passengers", passengers);

        const targetUrl = `/book?${params.toString()}`;

        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(targetUrl)}&notice=login_required`);
            return;
        }

        router.push(targetUrl);
    };

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-white">
            {/* ACADEMIC DISCLAIMER MODAL (AUTO-OPENS ON FIRST ARRIVAL) */}
            <AcademicDisclaimerModal />

            {/* HERO SECTION WITH SCENIC HIGHWAY BACKGROUND */}
            <section className="relative min-h-[calc(100vh-120px)] flex items-center justify-center overflow-visible bg-cover bg-center bg-no-repeat py-12 px-4 sm:px-6 z-20"
                style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.35), rgba(9, 9, 11, 0.8)), url('/scenic_highway_bg.jpg')`
                }}
            >
                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

                <div className="container mx-auto max-w-7xl relative z-10">
                    {/* PERMANENT ACADEMIC DISCLAIMER CARD ON FIRST PAGE */}
                    <AcademicDisclaimerCard className="mb-8" />

                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        
                        {/* LEFT COLUMN: HERO TEXT & BADGES */}
                        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                            {/* Premium Travel Service Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-zinc-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 backdrop-blur shadow-lg">
                                <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                                <span>Premium Travel Service</span>
                            </div>

                            {/* Headline */}
                            <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-5xl xl:text-6xl leading-[1.1] text-white drop-shadow-md">
                                Travel with <br />
                                <span className="text-white">Comfort & Style</span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-base sm:text-lg text-zinc-200 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed drop-shadow">
                                Experience the best bus transportation from Bicol to Manila. Reliable schedules, premium fleets, and seamless booking.
                            </p>

                            {/* Trust Badge Bar */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs font-bold text-zinc-300">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-red-400" />
                                    <span>Safe & Secured</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-red-400" />
                                    <span>On-time Departure</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: REPLICATED BOOKING CARD */}
                        <div className="lg:col-span-6 relative z-30">
                            <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 sm:p-8 text-zinc-900 shadow-2xl backdrop-blur-lg relative z-30">
                                <form onSubmit={handleSearch} className="space-y-5">
                                    
                                    {/* Card Header & Trip Type Toggle */}
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h2 className="text-xl font-black tracking-tight text-zinc-900 uppercase">
                                            BOOK YOUR <span className="text-red-600">TRIP</span>
                                        </h2>

                                        {/* One-way vs Round-trip */}
                                        <div className="flex rounded-full bg-zinc-100 p-1 text-xs font-bold">
                                            <button
                                                type="button"
                                                onClick={() => setTripType("one-way")}
                                                className={`rounded-full px-3 py-1 transition-all ${
                                                    tripType === "one-way"
                                                        ? "bg-white text-red-600 shadow-sm border border-zinc-200 font-extrabold"
                                                        : "text-zinc-500 hover:text-zinc-900"
                                                }`}
                                            >
                                                One-way
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTripType("round-trip")}
                                                className={`rounded-full px-3 py-1 transition-all ${
                                                    tripType === "round-trip"
                                                        ? "bg-white text-red-600 shadow-sm border border-zinc-200 font-extrabold"
                                                        : "text-zinc-500 hover:text-zinc-900"
                                                }`}
                                            >
                                                Round-trip
                                            </button>
                                        </div>
                                    </div>

                                    {/* SERVICE CLASS TABS */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                                            SERVICE CLASS
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setServiceClass("REGULAR AIRCON")}
                                                className={`rounded-xl py-2.5 px-2 flex flex-col items-center justify-center transition-all shadow-sm ${
                                                    serviceClass === "REGULAR AIRCON"
                                                        ? "bg-red-600 text-white shadow-red-600/30 shadow-md ring-2 ring-red-600"
                                                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                                                }`}
                                            >
                                                <span className="text-[11px] font-black uppercase tracking-wider">REGULAR AIRCON</span>
                                                <span className={`text-xs font-black mt-0.5 ${serviceClass === "REGULAR AIRCON" ? "text-red-100" : "text-red-600"}`}>₱850</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setServiceClass("SUPER DELUXE")}
                                                className={`rounded-xl py-2.5 px-2 flex flex-col items-center justify-center transition-all shadow-sm ${
                                                    serviceClass === "SUPER DELUXE"
                                                        ? "bg-red-600 text-white shadow-red-600/30 shadow-md ring-2 ring-red-600"
                                                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                                                }`}
                                            >
                                                <span className="text-[11px] font-black uppercase tracking-wider">SUPER DELUXE</span>
                                                <span className={`text-xs font-black mt-0.5 ${serviceClass === "SUPER DELUXE" ? "text-red-100" : "text-amber-600"}`}>₱950</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setServiceClass("FIRST CLASS")}
                                                className={`rounded-xl py-2.5 px-2 flex flex-col items-center justify-center transition-all shadow-sm ${
                                                    serviceClass === "FIRST CLASS"
                                                        ? "bg-red-600 text-white shadow-red-600/30 shadow-md ring-2 ring-red-600"
                                                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                                                }`}
                                            >
                                                <span className="text-[11px] font-black uppercase tracking-wider">FIRST CLASS</span>
                                                <span className={`text-xs font-black mt-0.5 ${serviceClass === "FIRST CLASS" ? "text-red-100" : "text-purple-600"}`}>₱1,100</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* ORIGIN & DESTINATION FIELDS */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {/* Origin */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                                                ORIGIN
                                            </label>
                                            <div className="relative flex items-center">
                                                <MapPin className="absolute left-3 h-4 w-4 text-red-600" />
                                                <select
                                                    value={origin}
                                                    onChange={(e) => setOrigin(e.target.value)}
                                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-9 pr-3 text-xs font-bold text-zinc-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                                                >
                                                    <option value="Cubao">Cubao Terminal</option>
                                                    <option value="PITX">PITX Terminal</option>
                                                    <option value="Daet">Daet Terminal</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Destination */}
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                                                DESTINATION
                                            </label>
                                            <div className="relative flex items-center">
                                                <MapPin className="absolute left-3 h-4 w-4 text-red-600" />
                                                <select
                                                    value={destination}
                                                    onChange={(e) => setDestination(e.target.value)}
                                                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-9 pr-3 text-xs font-bold text-zinc-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                                                >
                                                    <option value="Daet">Daet Terminal</option>
                                                    <option value="Cubao">Cubao Terminal</option>
                                                    <option value="PITX">PITX Terminal</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DEPARTURE, RETURN, PASSENGERS */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* Departure */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                                                DEPARTURE
                                            </label>
                                            <ModernDatePicker
                                                value={departureDate}
                                                onChange={(val) => {
                                                    setDepartureDate(val);
                                                    setHomepageDate(val);
                                                }}
                                                minDate={getTodayPH()}
                                                placeholder="Pick departure"
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Return */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                                                RETURN
                                            </label>
                                            <ModernDatePicker
                                                value={returnDate}
                                                onChange={(val) => setReturnDate(val)}
                                                minDate={departureDate || getTodayPH()}
                                                disabled={tripType === "one-way"}
                                                placeholder={tripType === "one-way" ? "One-way only" : "Pick return"}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Passengers */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                                                PASSENGERS
                                            </label>
                                            <div className="relative flex items-center">
                                                <Users className="absolute left-2.5 h-3.5 w-3.5 text-red-600" />
                                                <select
                                                    value={passengers}
                                                    onChange={(e) => setPassengers(e.target.value)}
                                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-8 pr-2 text-xs font-bold text-zinc-800 outline-none"
                                                >
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CHECK AVAILABILITY BUTTON */}
                                    <div className="pt-1">
                                        <Button
                                            type="submit"
                                            className="w-full h-14 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:brightness-110 text-white font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-red-600/30 text-base flex items-center justify-center gap-2"
                                        >
                                            <Search className="h-5 w-5 stroke-[2.5]" />
                                            <span>CHECK AVAILABILITY</span>
                                        </Button>
                                    </div>

                                    {/* CARD FOOTER NOTE */}
                                    <div className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 pt-1">
                                        TRUSTED BY 50,000+ HAPPY TRAVELERS THIS YEAR
                                    </div>

                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* REAL DISPATCHED SCHEDULES SECTION */}
            <section className="py-16 px-4 bg-zinc-900 border-t border-zinc-800 relative z-10">
                <div className="container mx-auto max-w-6xl text-center space-y-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <span className="text-xs font-bold uppercase tracking-widest text-red-500">Official Schedules</span>
                            <h3 className="text-2xl font-black text-white mt-1">Live Superlines Bus Departures</h3>
                            <p className="text-xs text-zinc-400 max-w-lg mt-1">
                                Synchronized in real-time with Superlines Dispatch Management. Select a departure to book seats directly.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchAdminTrips()}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 hover:text-white transition-all"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-red-500 ${loadingTrips ? 'animate-spin' : ''}`} />
                            <span>Refresh Schedules</span>
                        </button>
                    </div>

                    {/* Dynamic Date Filter Bar for Departures */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800">
                        <span className="text-xs font-bold text-zinc-400 mr-1">Filter by Date:</span>
                        <button
                            type="button"
                            onClick={() => setHomepageDate("ALL")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                homepageDate === "ALL"
                                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
                            }`}
                        >
                            All Dates ({adminTrips.length})
                        </button>
                        {availableDates.map((dStr) => {
                            const count = adminTrips.filter(t => t.departure_time?.slice(0, 10) === dStr).length;
                            return (
                                <button
                                    key={dStr}
                                    type="button"
                                    onClick={() => setHomepageDate(dStr)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                        homepageDate === dStr
                                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                                            : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
                                    }`}
                                >
                                    <Calendar className="h-3.5 w-3.5 text-red-500" />
                                    <span>{formatDatePH(dStr)}</span>
                                    <span className="opacity-75 font-mono">({count})</span>
                                </button>
                            );
                        })}
                        <div className="w-40 ml-auto">
                            <ModernDatePicker
                                value={homepageDate === "ALL" ? "" : homepageDate}
                                onChange={(val) => setHomepageDate(val)}
                                placeholder="Pick a date"
                                className="h-8 text-xs font-bold"
                            />
                        </div>
                    </div>

                    {displayedHomepageTrips.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 p-10 text-center space-y-4">
                            <p className="font-bold text-sm text-zinc-300">
                                Walang nakatakdang biyahe sa {homepageDate !== "ALL" ? formatDatePH(homepageDate) : "napiling criteria"}.
                            </p>
                            <p className="text-xs text-zinc-500 max-w-md mx-auto">
                                Narito ang mga petsang may aktibong biyahe na inilagay ng Admin sa Trip Schedule:
                            </p>
                            <div className="flex justify-center items-center gap-2 flex-wrap pt-2">
                                {availableDates.map(dStr => (
                                    <Button
                                        key={dStr}
                                        size="sm"
                                        variant="outline"
                                        className="font-bold text-xs border-red-600/40 text-red-400 hover:bg-red-950/50"
                                        onClick={() => setHomepageDate(dStr)}
                                    >
                                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                        {formatDatePH(dStr)}
                                    </Button>
                                ))}
                                <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                                    onClick={() => setHomepageDate("ALL")}
                                >
                                    Tingnan Lahat ng Biyahe ({adminTrips.length})
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {displayedHomepageTrips.map((t) => {
                                const tDate = t.departure_time ? t.departure_time.slice(0, 10) : "";
                                const depTimeStr = formatTimePH(t.departure_time);
                                const depDateStr = formatDatePH(t.departure_time);
                                const bType = t.bus_type || t.bus?.bus_type || "REGULAR AIRCON";

                                return (
                                    <div key={t.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-left space-y-3 hover:border-red-500/60 transition-all flex flex-col justify-between shadow-xl">
                                        <div>
                                            <div className="flex justify-between items-center text-xs font-bold mb-2">
                                                <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-600/30 text-[10px]">
                                                    {bType}
                                                </span>
                                                <span className="text-white text-base font-black">
                                                    ₱{t.fare_amount || t.price || 850}
                                                </span>
                                            </div>
                                            <h4 className="font-black text-lg text-white flex items-center justify-between">
                                                <span>{t.origin}</span>
                                                <ArrowRight className="h-4 w-4 text-red-500" />
                                                <span>{t.destination}</span>
                                            </h4>
                                            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 font-mono">
                                                <span>📅 {depDateStr}</span>
                                                <span>⏰ {depTimeStr}</span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 font-mono mt-1">
                                                Bus: {t.bus_number} • {t.seat_capacity || 49} Passenger Seats
                                            </p>
                                        </div>

                                        <Link 
                                            href={`/book?tripId=${encodeURIComponent(t.id)}&date=${encodeURIComponent(tDate)}&origin=${encodeURIComponent(t.origin)}&destination=${encodeURIComponent(t.destination)}`} 
                                            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/20 mt-3"
                                        >
                                            Book This Departure <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
