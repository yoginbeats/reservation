"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, User, Armchair, Bus, Printer, Download, Share2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface BoardingPassProps {
    reservation: {
        id: string;
        passenger_name: string;
        seat_number: string;
        passenger_type: string;
        trips: {
            origin: string;
            destination: string;
            departure_time: string;
            bus_number?: string;
        } | null;
    };
}

export function BoardingPass({ reservation }: BoardingPassProps) {
    const ticketRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const trip = reservation.trips;
    if (!trip) return null;

    const departureDate = new Date(trip.departure_time);
    const qrValue = JSON.stringify({
        resId: reservation.id,
        name: reservation.passenger_name,
        seat: reservation.seat_number,
        trip: `${trip.origin}-${trip.destination}`
    });

    const handleShare = async () => {
        if (!ticketRef.current) return;
        
        try {
            setIsSharing(true);
            // Small delay to ensure the UI is fully painted before capturing
            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(ticketRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null, // Transparent background so border-radius works
                logging: false,
            });
            
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("Could not generate image");

            const file = new File([blob], `ticket-${reservation.id.slice(0, 8)}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Boarding Pass',
                    text: `Here is my boarding pass for my trip from ${trip.origin} to ${trip.destination}!`,
                    files: [file]
                });
                toast.success("Ticket shared successfully!");
            } else {
                const link = document.createElement('a');
                link.download = `ticket-${reservation.id.slice(0, 8)}.png`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
                toast.success("Ticket downloaded as image!");
            }
        } catch (error) {
            console.error("Error sharing ticket:", error);
            toast.error("Failed to share ticket.");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 print:p-0">
            {/* Header / Actions (Hidden on Print) */}
            <div className="flex items-center justify-between print:hidden">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Your <span className="text-red-600">Boarding Pass</span></h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-full gap-2">
                        <Printer className="h-4 w-4" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare} disabled={isSharing} className="rounded-full gap-2">
                        {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                        {isSharing ? "Generating..." : "Share Image"}
                    </Button>
                </div>
            </div>

            {/* The Ticket UI */}
            <div ref={ticketRef} className="rounded-[2.5rem] bg-transparent">
                <Card className="overflow-hidden border-0 shadow-2xl rounded-[2.5rem] bg-white text-zinc-950 relative">
                {/* Perforated Edge Effect */}
                <div className="absolute top-[65%] left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-zinc-50 dark:bg-zinc-950 z-20" />
                <div className="absolute top-[65%] right-0 translate-x-1/2 w-6 h-6 rounded-full bg-zinc-50 dark:bg-zinc-950 z-20" />
                <div className="absolute top-[65%] left-6 right-6 border-b-2 border-dashed border-zinc-100 dark:border-zinc-800 z-10" />

                <CardContent className="p-0">
                    {/* Top Section: Branding & Main Info */}
                    <div className="bg-zinc-950 p-8 text-white relative">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Superlines Premium</p>
                                <h2 className="text-3xl font-black tracking-tighter">BOARDING PASS</h2>
                            </div>
                            <Bus className="h-10 w-10 text-white opacity-20" />
                        </div>

                        <div className="grid grid-cols-2 gap-8 relative">
                            {/* Decorative Line */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-zinc-800 hidden sm:block" />

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Origin</p>
                                <p className="text-2xl font-black">{trip.origin}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Destination</p>
                                <p className="text-2xl font-black">{trip.destination}</p>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Passenger & Trip Details */}
                    <div className="p-8 pb-12 grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                <User className="h-3 w-3" /> Passenger
                            </p>
                            <p className="font-bold text-sm truncate">{reservation.passenger_name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                <Armchair className="h-3 w-3" /> Seat Number
                            </p>
                            <p className="font-black text-lg text-red-600">#{reservation.seat_number}</p>
                        </div>
                        <div className="space-y-1 hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                <Bus className="h-3 w-3" /> Bus Number
                            </p>
                            <p className="font-bold text-sm">{trip.bus_number || 'TBA'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> Date
                            </p>
                            <p className="font-bold text-sm">{departureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> Departure
                            </p>
                            <p className="font-bold text-sm">{departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Class</p>
                            <p className="font-bold text-sm uppercase">Standard</p>
                        </div>
                    </div>

                    {/* Bottom Section: QR Code */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 flex flex-col items-center justify-center space-y-4">
                        <div className="bg-white p-4 rounded-3xl shadow-xl border border-zinc-100">
                            <QRCodeSVG value={qrValue} size={160} level="H" />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scan for Verification</p>
                            <p className="text-[11px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">RES: {reservation.id.slice(0, 18)}...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            </div>

            {/* Footer Instructions (Hidden on Print) */}
            <div className="rounded-[2rem] bg-zinc-100 dark:bg-zinc-900/50 p-6 flex gap-4 items-start print:hidden">
                <div className="bg-white dark:bg-zinc-800 p-2 rounded-xl shadow-sm">
                    <MapPin className="h-5 w-5 text-red-600" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-sm">Arrive 30 minutes before departure</p>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">Please present this digital boarding pass and a valid ID to the conductor upon boarding. We look forward to seeing you!</p>
                </div>
            </div>
        </div>
    );
}
