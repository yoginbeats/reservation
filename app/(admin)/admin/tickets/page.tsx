"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Search, Filter, Plus, RefreshCw, QrCode, ArrowRight, User } from "lucide-react";
import { AdminNewReservationDialog } from "@/components/admin-new-reservation-dialog";

export default function TicketsPage() {
    const [openNewTicket, setOpenNewTicket] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "VALID" | "USED" | "CANCELLED">("ALL");

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/payments");
            const data = await res.json();
            if (data.success && Array.isArray(data.bookings)) {
                setTickets(data.bookings);
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.error("Failed to fetch tickets:", err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter((t) => {
        const matchesQuery =
            !searchQuery.trim() ||
            (t.passenger_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.qr_token || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.transaction_ref || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(t.seat_number || "").includes(searchQuery);

        if (!matchesQuery) return false;

        const status = (t.ticket_status || (t.payment_status === "PAID" ? "VALID" : "PENDING")).toUpperCase();
        if (filterStatus === "ALL") return true;
        if (filterStatus === "VALID") return status === "VALID" || status === "CONFIRMED";
        if (filterStatus === "USED") return status === "USED" || status === "BOARDED";
        if (filterStatus === "CANCELLED") return status === "CANCELLED" || status === "VOIDED";
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                    <p className="text-muted-foreground">Issue, reserve multiple seats, and validate Superlines tickets seamlessly.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setOpenNewTicket(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        <Plus className="mr-2 h-4 w-4" />
                        New Ticket
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by passenger, ticket QR, seat #..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {(["ALL", "VALID", "USED", "CANCELLED"] as const).map((s) => (
                        <Button
                            key={s}
                            variant={filterStatus === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus(s)}
                            className={filterStatus === s ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        >
                            {s === "ALL" ? "All Tickets" : s.charAt(0) + s.slice(1).toLowerCase()}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>All Tickets</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
                        </span>
                    </CardTitle>
                    <CardDescription>Official verified Superlines bus boarding passes and tickets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                            Loading tickets...
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground space-y-3">
                            <Ticket className="h-12 w-12 mx-auto text-muted-foreground/40" />
                            <p className="font-semibold text-base text-foreground">No tickets issued yet</p>
                            <p className="text-xs max-w-md mx-auto">
                                When passengers reserve online or purchase tickets at teller counters, tickets with live QR codes and seat numbers will appear here.
                            </p>
                            <Button
                                onClick={() => setOpenNewTicket(true)}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Issue First Ticket
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredTickets.map((t) => {
                                const status = (t.ticket_status || (t.payment_status === "PAID" ? "VALID" : "PENDING")).toUpperCase();
                                const seats = t.seat_numbers && t.seat_numbers.length > 0 ? t.seat_numbers.join(", ") : t.seat_number || "—";
                                const routeStr = `${t.trip?.origin || "Cubao"} ➔ ${t.trip?.destination || "Daet"}`;

                                return (
                                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                                                <QrCode className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-foreground">{t.qr_token || `TKT-${t.id.slice(0, 8).toUpperCase()}`}</p>
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                                        status === "CANCELLED" || status === "VOIDED"
                                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                            : status === "USED" || status === "BOARDED"
                                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    }`}>
                                                        {status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                    <User className="h-3.5 w-3.5" />
                                                    <span className="font-semibold text-foreground">{t.passenger_name || "Valued Passenger"}</span>
                                                    <span>• Seat: {seats}</span>
                                                    <span>• {routeStr}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0">
                                            <div className="text-right">
                                                <div className="text-sm font-mono font-bold text-foreground">
                                                    ₱{Number(t.total_price || 0).toLocaleString()}.00
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase">
                                                    {t.booking_source || "ONLINE"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Multi-Seat & Statutory Discount Reservation Modal */}
            <AdminNewReservationDialog
                isOpen={openNewTicket}
                onClose={() => {
                    setOpenNewTicket(false);
                    fetchTickets();
                }}
            />
        </div>
    );
}
