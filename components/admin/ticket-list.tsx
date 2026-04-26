"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Search, Filter } from "lucide-react";
import { TicketViewDialog } from "@/components/admin/ticket-view-dialog";

export function TicketList({ initialTickets }: { initialTickets: any[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTickets = initialTickets.filter(ticket => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        
        const passengerName = (ticket.passenger_name || (ticket.profiles ? (Array.isArray(ticket.profiles) ? ticket.profiles[0]?.full_name : ticket.profiles.full_name) : "Walk-in")).toLowerCase();
        const ticketId = ticket.id.toLowerCase();
        const origin = (ticket.trips?.origin || "").toLowerCase();
        const destination = (ticket.trips?.destination || "").toLowerCase();

        return ticketId.includes(term) || 
               passengerName.includes(term) ||
               origin.includes(term) ||
               destination.includes(term);
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                        placeholder="Search by Ticket ID, Passenger Name, or Route..." 
                        className="pl-10" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                </Button>
            </div>

            {/* Tickets List */}
            <Card>
                <CardHeader>
                    <CardTitle>Issued Tickets</CardTitle>
                    <CardDescription>A list of all valid confirmed tickets in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredTickets && filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket: any) => {
                                const trip = ticket.trips || {};
                                const passengerName = ticket.passenger_name || (ticket.profiles ? (Array.isArray(ticket.profiles) ? ticket.profiles[0]?.full_name : ticket.profiles.full_name) : "Walk-in");
                                
                                return (
                                    <div key={ticket.id} className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                                            <Ticket className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="font-bold uppercase tracking-tight text-sm">Ticket #{ticket.id.slice(0, 8)}</p>
                                                <p className="text-xs text-muted-foreground font-medium mt-0.5">{passengerName}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{trip.origin} → {trip.destination}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Seat: <span className="font-bold">{ticket.seat_number}</span></p>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                    Valid
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <TicketViewDialog ticket={ticket} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-12 text-center text-muted-foreground italic">
                                {searchTerm ? "No tickets match your search." : "No issued tickets found."}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
