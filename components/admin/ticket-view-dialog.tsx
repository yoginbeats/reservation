"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Ticket, MapPin, Calendar, Clock, User, Armchair, CheckCircle2, QrCode } from "lucide-react";

interface TicketData {
    id: string;
    seat_number: string;
    passenger_name: string;
    status: string;
    created_at: string;
    trips: {
        origin: string;
        destination: string;
        departure_time: string;
        buses?: {
            bus_type: string;
            bus_number: string;
        }
    };
    profiles?: {
        full_name: string;
        email: string;
    } | null;
}

export function TicketViewDialog({ ticket }: { ticket: TicketData }) {
    const [isOpen, setIsOpen] = useState(false);

    const isCancelled = ticket.status === 'cancelled';
    const isValid = ticket.status === 'confirmed';
    
    // In a real app, "used" could be another status or a separate field `is_used`
    // We'll treat 'confirmed' as Valid for now.
    
    const tripDate = new Date(ticket.trips?.departure_time || new Date());
    const bookDate = new Date(ticket.created_at);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">View</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-50 dark:bg-zinc-950">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center pr-6">
                        <span className="text-sm font-black uppercase tracking-widest text-zinc-500">Ticket Details</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            isCancelled ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        }`}>
                            {ticket.status}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="relative mt-2 overflow-hidden rounded-2xl bg-white shadow-xl border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
                    {/* Ticket Header */}
                    <div className="bg-red-600 p-6 text-white flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Ticket className="h-5 w-5 opacity-80" />
                                <span className="font-black text-xl tracking-tight">SUPERLINES</span>
                            </div>
                            <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">Boarding Pass</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black">{ticket.seat_number}</p>
                            <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">Seat No.</p>
                        </div>
                    </div>

                    {/* Route Details */}
                    <div className="p-6 pb-4 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Origin</p>
                                <p className="font-bold text-xl">{ticket.trips?.origin}</p>
                            </div>
                            <div className="flex-1 px-4 flex items-center justify-center relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-[2px] bg-zinc-200 border-dashed dark:bg-zinc-800" />
                                </div>
                                <MapPin className="h-4 w-4 text-zinc-300 relative bg-white dark:bg-zinc-900 px-0.5 z-10" />
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Destination</p>
                                <p className="font-bold text-xl">{ticket.trips?.destination}</p>
                            </div>
                        </div>

                        {/* Travel Info Grid */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 bg-zinc-50 rounded-xl p-4 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Calendar className="h-3 w-3"/> Date</p>
                                <p className="font-bold text-sm">{tripDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Clock className="h-3 w-3"/> Time</p>
                                <p className="font-bold text-sm">{tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><User className="h-3 w-3"/> Passenger</p>
                                <p className="font-bold text-sm truncate" title={ticket.passenger_name || ticket.profiles?.full_name || 'Walk-in Guest'}>
                                    {ticket.passenger_name || ticket.profiles?.full_name || 'Walk-in Guest'}
                                </p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Armchair className="h-3 w-3"/> Bus Class</p>
                                <p className="font-bold text-sm truncate">{ticket.trips?.buses?.bus_type || 'Standard'}</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Section (Mockup) */}
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Booking Ref</p>
                            <p className="font-mono font-bold text-sm">{ticket.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-[10px] text-zinc-400 mt-2">Issued: {bookDate.toLocaleDateString()}</p>
                        </div>
                        <div className="h-20 w-20 bg-white p-2 border rounded-xl flex items-center justify-center shadow-sm">
                            <QrCode className="h-full w-full text-zinc-800" />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
