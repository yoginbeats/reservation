"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TicketBoardingPass } from "@/components/admin/ticket-boarding-pass";

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

export function TicketViewDialog({ ticket, trigger }: { ticket: TicketData, trigger?: React.ReactNode }) {
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
                {trigger ? trigger : <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">View</Button>}
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

                <div className="mt-4 flex justify-center">
                    <TicketBoardingPass ticket={ticket as any} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
