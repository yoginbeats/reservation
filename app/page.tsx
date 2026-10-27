"use client";

import { useState } from "react";
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
    Megaphone,
    ArrowRight
} from "lucide-react";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import { getTodayPH } from "@/lib/date-utils";
import { AcademicDisclaimerCard, AcademicDisclaimerModal } from "@/components/academic-disclaimer";

export default function Home() {
    const router = useRouter();
    const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
    const [serviceClass, setServiceClass] = useState<"REGULAR AIRCON" | "SUPER DELUXE" | "FIRST CLASS">("REGULAR AIRCON");
    const [origin, setOrigin] = useState("Cubao");
    const [destination, setDestination] = useState("Daet");
    const [departureDate, setDepartureDate] = useState(() => getTodayPH());
    const [returnDate, setReturnDate] = useState("");
    const [passengers, setPassengers] = useState("1");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const effectiveDate = departureDate || getTodayPH();
        const params = new URLSearchParams({
            origin,
            destination,
            date: effectiveDate,
            departureDate: effectiveDate,
            tripType,
            serviceClass,
            passengers,
        });
        if (returnDate && tripType === "round-trip") {
            params.set("returnDate", returnDate);
        }
        router.push(`/book?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-white">
            {/* ACADEMIC DISCLAIMER MODAL (AUTO-OPENS ON FIRST ARRIVAL) */}
            <AcademicDisclaimerModal />

            {/* HERO SECTION WITH SCENIC HIGHWAY BACKGROUND */}
            <section className="relative min-h-[calc(100vh-120px)] flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat py-12 px-4 sm:px-6"
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
                        <div className="lg:col-span-6">
                            <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 sm:p-8 text-zinc-900 shadow-2xl backdrop-blur-lg">
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
                                                onChange={(val) => setDepartureDate(val)}
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
                                    <div className="pt-2">
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

            {/* QUICK ROUTE SECTION */}
            <section className="py-16 px-4 bg-zinc-900 border-t border-zinc-800">
                <div className="container mx-auto max-w-6xl text-center space-y-8">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-red-500">Popular Schedules</span>
                        <h3 className="text-2xl font-black text-white mt-1">Daily Superlines Bus Routes</h3>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-left space-y-3">
                            <div className="flex justify-between items-center text-xs text-red-400 font-bold">
                                <span>REGULAR AIRCON</span>
                                <span className="text-white text-base font-black">₱850</span>
                            </div>
                            <h4 className="font-bold text-lg text-white">Cubao ➔ Daet</h4>
                            <p className="text-xs text-zinc-400">49 Seats • Daily Standard Express</p>
                            <Link href={`/book?origin=Cubao&destination=Daet&date=${getTodayPH()}&serviceClass=REGULAR+AIRCON`} className="inline-flex items-center text-xs font-bold text-red-400 hover:underline pt-2">
                                Book This Trip <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-left space-y-3">
                            <div className="flex justify-between items-center text-xs text-amber-400 font-bold">
                                <span>SUPER DELUXE</span>
                                <span className="text-white text-base font-black">₱950</span>
                            </div>
                            <h4 className="font-bold text-lg text-white">PITX ➔ Daet</h4>
                            <p className="text-xs text-zinc-400">43 Seats • Onboard Restroom & Direct SLEX Route</p>
                            <Link href={`/book?origin=PITX&destination=Daet&date=${getTodayPH()}&serviceClass=SUPER+DELUXE`} className="inline-flex items-center text-xs font-bold text-amber-400 hover:underline pt-2">
                                Book This Trip <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-left space-y-3">
                            <div className="flex justify-between items-center text-xs text-purple-400 font-bold">
                                <span>FIRST CLASS</span>
                                <span className="text-white text-base font-black">₱1,100</span>
                            </div>
                            <h4 className="font-bold text-lg text-white">Cubao ➔ Daet</h4>
                            <p className="text-xs text-zinc-400">41 Seats • Premier Sleeper Recliner with Restroom</p>
                            <Link href={`/book?origin=Cubao&destination=Daet&date=${getTodayPH()}&serviceClass=FIRST+CLASS`} className="inline-flex items-center text-xs font-bold text-purple-400 hover:underline pt-2">
                                Book This Trip <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
