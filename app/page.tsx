import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, ShieldCheck, Bus, MapPin, ArrowRight, QrCode, CreditCard, Sparkles, Clock, CheckCircle2 } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-red-950 to-zinc-900 text-white py-20 lg:py-28 px-4 sm:px-6">
                {/* Background Glow Overlay */}
                <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        {/* Hero Text */}
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 backdrop-blur">
                                <Sparkles className="h-3.5 w-3.5 text-red-400" />
                                <span>Official Online Ticketing Portal</span>
                            </div>

                            <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-5xl xl:text-6xl leading-none">
                                Travel Comfortably with <br />
                                <span className="bg-gradient-to-r from-red-500 via-red-400 to-amber-300 bg-clip-text text-transparent">
                                    Superlines Transportation
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg text-zinc-300 max-w-xl mx-auto lg:mx-0 font-medium">
                                Book your bus tickets online for Cubao, Bicol, Daet, Naga, and Legazpi. Instant GCash payment, seat selection, and digital QR ticket issuance.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                                <Link href="/book">
                                    <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 text-base">
                                        <CalendarCheck className="mr-2 h-5 w-5" />
                                        Book a Trip Now
                                    </Button>
                                </Link>

                                <Link href="/my-tickets">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100 font-semibold rounded-xl text-base">
                                        <QrCode className="mr-2 h-5 w-5 text-red-400" />
                                        My Digital Tickets
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-4 text-xs font-semibold text-zinc-400 max-w-lg mx-auto lg:mx-0">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span>Instant GCash</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span>Live Seat Map</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    <span>Conductor QR</span>
                                </div>
                            </div>
                        </div>

                        {/* Search Quick Card */}
                        <div className="lg:col-span-5">
                            <Card className="border-0 shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-6 text-zinc-900 dark:text-zinc-100">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <Bus className="h-5 w-5 text-red-600" />
                                            <h3 className="font-bold text-lg">Search Available Trips</h3>
                                        </div>
                                        <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-full">
                                            Daily Schedule
                                        </span>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Origin Terminal</label>
                                            <div className="flex items-center gap-2 p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
                                                <MapPin className="h-4 w-4 text-red-600" />
                                                <span className="font-semibold">Cubao Terminal, EDSA</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Destination</label>
                                            <div className="flex items-center gap-2 p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700">
                                                <MapPin className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold">Daet / Naga / Bicol</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link href="/book" className="block pt-2">
                                        <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-base shadow-md shadow-red-600/25">
                                            Search Schedules
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* POPULAR ROUTES SHOWCASE */}
            <section className="py-16 px-4 sm:px-6 bg-white dark:bg-zinc-900 border-t border-b border-zinc-200 dark:border-zinc-800">
                <div className="container mx-auto max-w-6xl space-y-10">
                    <div className="text-center space-y-2 max-w-2xl mx-auto">
                        <span className="text-xs font-bold uppercase tracking-widest text-red-600">Featured Destinations</span>
                        <h2 className="text-3xl font-black tracking-tight">Popular Superlines Bus Routes</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            Daily aircon and deluxe trips connecting Metro Manila to Camarines Norte and Camarines Sur.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Route 1 */}
                        <Card className="group overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-3 py-1 rounded-full">
                                        SUPER DELUXE
                                    </span>
                                    <span className="text-xl font-black text-red-600">₱850.00</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        Cubao <ArrowRight className="h-4 w-4 text-zinc-400" /> Daet
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-medium">Approx. 7.5 hrs • Daily Morning & Evening Trips</p>
                                </div>
                                <div className="pt-2 border-t flex items-center justify-between text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 6:00 AM / 9:00 PM</span>
                                    <Link href="/book" className="font-bold text-red-600 hover:underline flex items-center gap-1">
                                        Book <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Route 2 */}
                        <Card className="group overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-3 py-1 rounded-full">
                                        AIRCON EXPRESS
                                    </span>
                                    <span className="text-xl font-black text-red-600">₱750.00</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        Cubao <ArrowRight className="h-4 w-4 text-zinc-400" /> Naga
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-medium">Approx. 8.0 hrs • Daily Afternoon Trips</p>
                                </div>
                                <div className="pt-2 border-t flex items-center justify-between text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 1:00 PM / 8:30 PM</span>
                                    <Link href="/book" className="font-bold text-red-600 hover:underline flex items-center gap-1">
                                        Book <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Route 3 */}
                        <Card className="group overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-3 py-1 rounded-full">
                                        STANDARD BUS
                                    </span>
                                    <span className="text-xl font-black text-red-600">₱650.00</span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        Daet <ArrowRight className="h-4 w-4 text-zinc-400" /> Cubao
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-medium">Return Trips • Daily Schedule</p>
                                </div>
                                <div className="pt-2 border-t flex items-center justify-between text-xs text-zinc-500">
                                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 7:00 AM / 7:30 PM</span>
                                    <Link href="/book" className="font-bold text-red-600 hover:underline flex items-center gap-1">
                                        Book <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* KEY FEATURES SECTION */}
            <section className="py-16 px-4 sm:px-6">
                <div className="container mx-auto max-w-6xl space-y-12">
                    <div className="text-center space-y-2 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-black tracking-tight">Why Book Online with Superlines?</h2>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                            Fast, convenient, and safe online reservation system.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-zinc-900 border shadow-sm space-y-4">
                            <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/50 flex items-center justify-center">
                                <CreditCard className="h-7 w-7" />
                            </div>
                            <h3 className="text-lg font-bold">GCash Online Payment</h3>
                            <p className="text-sm text-zinc-500">
                                Pay seamlessly with GCash via PayMongo integration. Receive your digital ticket right away.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-zinc-900 border shadow-sm space-y-4">
                            <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 flex items-center justify-center">
                                <QrCode className="h-7 w-7" />
                            </div>
                            <h3 className="text-lg font-bold">Digital QR Ticket</h3>
                            <p className="text-sm text-zinc-500">
                                Show your digital QR code on your phone to the bus conductor for instant boarding verification.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-zinc-900 border shadow-sm space-y-4">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 flex items-center justify-center">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <h3 className="text-lg font-bold">Guaranteed Seats</h3>
                            <p className="text-sm text-zinc-500">
                                Pick your preferred seat on our interactive bus seat map. No long lines at terminal ticket booths.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 px-4 text-center text-xs text-zinc-500">
                <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-red-600 uppercase">Superlines</span>
                        <span>© 2026 Superlines Transportation Co. Inc. All rights reserved.</span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/book" className="hover:underline">Book Trip</Link>
                        <Link href="/my-tickets" className="hover:underline">My Tickets</Link>
                        <Link href="/login" className="hover:underline">Sign In</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
