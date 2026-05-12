import Link from "next/link";
import { Calendar, MapPin, Search, Star, Shield, Clock, Coffee, Wifi } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { AnnouncementPanel } from "@/components/announcement-panel";

export default function Home() {
    return (
        <div className="flex flex-col">
            <AnnouncementPanel />
            {/* Hero Section */}
            <section className="relative flex min-h-[85vh] items-center justify-center px-6 py-20 text-white overflow-hidden">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
                    style={{
                        backgroundImage: 'url("/hero-bg.jpg")',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="container relative z-10 mx-auto max-w-6xl">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        {/* Text Content */}
                        <div className="space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-bold tracking-wide uppercase">Premium Travel Service</span>
                            </div>
                            <h1 className="text-5xl font-black leading-[1.1] tracking-tight sm:text-7xl">
                                Travel with <br />
                                <span className="text-white">Comfort & Style</span>
                            </h1>
                            <p className="max-w-xl text-lg text-white/80 sm:text-xl">
                                Experience the best bus transportation from Bicol to Manila. Reliable schedules, premium fleets, and seamless booking.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-red-300" />
                                    <span className="font-medium">Safe & Secured</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-red-300" />
                                    <span className="font-medium">On-time Departure</span>
                                </div>
                            </div>
                        </div>

                        {/* Booking Widget */}
                        <BookingForm />
                    </div>
                </div>
            </section>

            {/* Features/Fleet Section */}
            <section className="bg-zinc-50 px-6 py-24 dark:bg-zinc-950">
                <div className="container mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl text-zinc-900 dark:text-zinc-50">
                            Our <span className="text-red-600">Premium</span> Fleet
                        </h2>
                        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Experience a high-end bus travel experience with our specialized classes.</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                        {/* Regular Aircon */}
                        <div className="group rounded-3xl border bg-white p-8 transition-all hover:border-red-500 hover:shadow-xl dark:bg-zinc-900">
                            <div className="mb-6 inline-flex rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20">
                                <Wifi className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold">Regular Aircon</h3>
                            <p className="mb-6 text-sm text-zinc-500">Standard 2x2 configuration, fully air-conditioned for a comfortable and secure journey.</p>
                            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-2">✓ Comfortable Seats</li>
                                <li className="flex items-center gap-2">✓ Full Air-conditioning</li>
                                <li className="flex items-center gap-2">✓ Audio/Video Entertainment</li>
                                <li className="flex items-center gap-2">✓ Gadget Charging Ports</li>
                                <li className="flex items-center gap-2">✓ 24/7 CCTV Monitoring</li>
                            </ul>
                        </div>

                        {/* First Class & Deluxe */}
                        <div className="group rounded-3xl border bg-white p-8 transition-all hover:border-red-500 hover:shadow-xl dark:bg-zinc-900">
                            <div className="mb-6 inline-flex rounded-2xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20">
                                <Coffee className="h-6 w-6" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold">Deluxe / First Class</h3>
                            <p className="mb-6 text-sm text-zinc-500">Premium seating options featuring a spacious configuration and upgraded amenities for a superior travel experience.</p>
                            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-2">✓ Limited Stops for faster travel</li>
                                <li className="flex items-center gap-2">✓ Upgraded Seats with dedicated Leg Rest</li>
                                <li className="flex items-center gap-2">✓ On-board Toilet Facility</li>
                                <li className="flex items-center gap-2">✓ USB/Gadget Charging Ports</li>
                                <li className="flex items-center gap-2">✓ Personalized Audio/Video System</li>
                                <li className="flex items-center gap-2">✓ 24/7 CCTV Monitoring</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="px-6 py-20 bg-white dark:bg-zinc-900">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="flex flex-col items-center gap-4 text-zinc-400">
                        <Shield className="h-12 w-12 text-zinc-300" />
                        <h4 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">Secured & Trusted Booking</h4>
                        <p className="max-w-md mx-auto">Your payments and personal information are protected with industry-standard security encryption.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
