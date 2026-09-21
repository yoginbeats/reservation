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

export default function Home() {
    const router = useRouter();
    const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
    const [serviceClass, setServiceClass] = useState<"REGULAR AIRCON" | "DELUXE" | "FIRST CLASS">("REGULAR AIRCON");
    const [origin, setOrigin] = useState("Cubao");
    const [destination, setDestination] = useState("Daet");
    const [departureDate, setDepartureDate] = useState("");
    const [passengers, setPassengers] = useState("1");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/book?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
    };

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-white">
            {/* ANNOUNCEMENT RED BANNER BAR */}
            <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 px-4 py-2.5 text-xs text-white shadow-inner">
                <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-950/80 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white border border-red-400/30">
                            <Megaphone className="h-3.5 w-3.5 text-red-300" />
                            Announcements
                        </span>
                        <p className="truncate text-xs font-semibold text-red-50">
                            <span className="font-extrabold text-amber-300">New Ride, Better Journey:</span> We&apos;re happy to announce that a new bus unit has officially arrived and is now ready to serve our passengers! Enjoy a safer, smoother, and more comfortable trip.
                        </p>
                    </div>
                </div>
            </div>

            {/* HERO SECTION WITH SCENIC HIGHWAY BACKGROUND */}
            <section className="relative min-h-[calc(100vh-120px)] flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat py-12 px-4 sm:px-6"
                style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2000&auto=format&fit=crop')`
                }}
            >
                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />

                <div className="container mx-auto max-w-7xl relative z-10">
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
                                                className={`rounded-xl py-3 px-2 text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
                                                    serviceClass === "REGULAR AIRCON"
                                                        ? "bg-red-600 text-white shadow-red-600/30 shadow-md"
                                                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                                                }`}
                                            >
                                                REGULAR AIRCON
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setServiceClass("DELUXE")}
                                                className={`rounded-xl py-3 px-2 text-xs font-black uppercase tracking-wider transition-all ${
                                                    serviceClass === "DELUXE"
                                                        ? "bg-red-600 text-white shadow-red-600/30 shadow-md"
                                                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                                                }`}
                                            >
                                                DELUXE
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setServiceClass("FIRST CLASS")}
                                                className={`rounded-xl py-3 px-2 text-xs font-black uppercase tracking-wider transition-all ${
                                                    serviceClass === "FIRST CLASS"
                                                        ? "bg-red-600 text-white shadow-red-600/30 shadow-md"
                                                        : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
                                                }`}
                                            >
                                                FIRST CLASS
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
                                                    <option value="EDSA Pasay">EDSA Pasay</option>
                                                    <option value="Daet">Daet Terminal</option>
                                                    <option value="Naga">Naga Terminal</option>
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
                                                    <option value="Naga">Naga Terminal</option>
                                                    <option value="Legazpi">Legazpi City</option>
                                                    <option value="Cubao">Cubao Terminal</option>
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
                                            <div className="relative flex items-center">
                                                <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-red-600" />
                                                <input
                                                    type="date"
                                                    value={departureDate}
                                                    onChange={(e) => setDepartureDate(e.target.value)}
                                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-8 pr-1.5 text-[11px] font-bold text-zinc-800 outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Return */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                                                RETURN
                                            </label>
                                            <div className="relative flex items-center opacity-50">
                                                <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
                                                <input
                                                    type="date"
                                                    disabled
                                                    placeholder="mm/dd/yyyy"
                                                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-3 pl-8 pr-1.5 text-[11px] font-bold text-zinc-400 cursor-not-allowed outline-none"
                                                />
                                            </div>
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
                            <p className="text-xs text-zinc-400">Daily Morning & Evening Departure</p>
                            <Link href="/book?origin=Cubao&destination=Daet" className="inline-flex items-center text-xs font-bold text-red-400 hover:underline pt-2">
                                Book This Trip <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-left space-y-3">
                            <div className="flex justify-between items-center text-xs text-amber-400 font-bold">
                                <span>DELUXE BUS</span>
                                <span className="text-white text-base font-black">₱950</span>
                            </div>
                            <h4 className="font-bold text-lg text-white">Cubao ➔ Naga</h4>
                            <p className="text-xs text-zinc-400">With Restroom / CR on board</p>
                            <Link href="/book?origin=Cubao&destination=Naga" className="inline-flex items-center text-xs font-bold text-red-400 hover:underline pt-2">
                                Book This Trip <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-left space-y-3">
                            <div className="flex justify-between items-center text-xs text-blue-400 font-bold">
                                <span>FIRST CLASS</span>
                                <span className="text-white text-base font-black">₱1,050</span>
                            </div>
                            <h4 className="font-bold text-lg text-white">Pasay ➔ Legazpi</h4>
                            <p className="text-xs text-zinc-400">Reclining Seats & Free Wi-Fi</p>
                            <Link href="/book?origin=Pasay&destination=Legazpi" className="inline-flex items-center text-xs font-bold text-red-400 hover:underline pt-2">
                                Book This Trip <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
