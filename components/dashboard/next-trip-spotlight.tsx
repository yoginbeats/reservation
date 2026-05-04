"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Ticket, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NextTripSpotlightProps {
    reservation: {
        id: string;
        seat_number: string;
        trips: {
            origin: string;
            destination: string;
            departure_time: string;
            bus_number?: string;
        } | null;
    };
}

export function NextTripSpotlight({ reservation }: NextTripSpotlightProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    const trip = reservation.trips;

    useEffect(() => {
        if (!trip?.departure_time) return;
        
        const departureDate = new Date(trip.departure_time);
        
        const timer = setInterval(() => {
            const now = new Date();
            const difference = departureDate.getTime() - now.getTime();

            if (difference <= 0) {
                clearInterval(timer);
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / (1000 * 60)) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [trip?.departure_time]);

    if (!trip) return null;
    const departureDate = new Date(trip.departure_time);

    return (
        <Card className="relative overflow-hidden border-0 bg-zinc-950 text-white shadow-2xl rounded-[2.5rem]">
            {/* Animated Background Glow */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 h-64 w-64 bg-red-600/20 blur-[100px] animate-pulse rounded-full" />
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 h-64 w-64 bg-blue-600/10 blur-[100px] animate-pulse rounded-full" />

            <CardContent className="relative z-10 p-8 sm:p-10">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                    {/* Left: Journey Info */}
                    <div className="space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Next Upcoming Trip
                            </div>
                            <h2 className="text-4xl font-black tracking-tighter sm:text-5xl leading-none">
                                Ready for your <br />
                                <span className="text-zinc-400">next adventure?</span>
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">From</p>
                                <p className="text-2xl font-black">{trip.origin}</p>
                            </div>
                            <div className="flex-1 h-px bg-zinc-800 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 px-2">
                                    <ArrowRight className="h-4 w-4 text-red-600" />
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">To</p>
                                <p className="text-2xl font-black">{trip.destination}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" /> Departure
                                </p>
                                <p className="font-bold text-zinc-200">
                                    {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {departureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                                    <Ticket className="h-3 w-3" /> Seat Assigned
                                </p>
                                <p className="font-bold text-zinc-200">{reservation.seat_number}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Countdown & CTA */}
                    <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8">Departure In</p>

                        {timeLeft ? (
                            <div className="flex gap-4 sm:gap-6 mb-10">
                                {[
                                    { val: timeLeft.days, label: "Days" },
                                    { val: timeLeft.hours, label: "Hrs" },
                                    { val: timeLeft.minutes, label: "Mins" },
                                    { val: timeLeft.seconds, label: "Secs" }
                                ].map((unit, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden relative group">
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-3xl sm:text-4xl font-black tracking-tight">{unit.val.toString().padStart(2, '0')}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">{unit.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-10 text-center py-6">
                                <p className="text-2xl font-black text-emerald-500 animate-bounce">BOARDING SOON</p>
                                <p className="text-xs text-zinc-500 mt-2">Get ready at the terminal!</p>
                            </div>
                        )}

                        <Button
                            asChild
                            className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg gap-3 shadow-xl shadow-red-900/20 active:scale-95 transition-all uppercase tracking-tight"
                        >
                            <Link href={`/my-tickets/${reservation.id}`}>
                                <Ticket className="h-6 w-6" />
                                View Boarding Pass
                                <ArrowRight className="h-5 w-5 ml-auto" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
