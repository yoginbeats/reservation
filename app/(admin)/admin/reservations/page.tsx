"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    CalendarCheck,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    RefreshCw,
    ShieldCheck,
    QrCode,
    Copy,
    Check,
    XCircle,
    Zap,
    TrendingUp,
    Users,
    Bus,
    ArrowRight
} from "lucide-react";

export default function AdminReservationsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING_VERIFICATION" | "PAID">("ALL");
    const [verificationMode, setVerificationMode] = useState<"AUTO" | "MANUAL">("AUTO");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [copiedRef, setCopiedRef] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [stats, setStats] = useState({
        total_collected: 0,
        pending_count: 0,
        confirmed_count: 0,
    });

    useEffect(() => {
        fetchBookings();
        const interval = setInterval(fetchBookings, 4000); // 4-second live poll for presentations
        return () => clearInterval(interval);
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/admin/payments");
            const data = await res.json();
            if (data.success) {
                setBookings(data.bookings || []);
                setVerificationMode(data.verification_mode || "AUTO");
                if (data.stats) setStats(data.stats);
            }
        } catch (err) {
            console.error("Failed to load admin reservations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleMode = async (newMode: "AUTO" | "MANUAL") => {
        try {
            setVerificationMode(newMode);
            await fetch("/api/admin/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: newMode }),
            });
        } catch (err) {
            console.error("Failed to switch verification mode:", err);
        }
    };

    const handleAction = async (bookingId: string, action: "approve" | "reject") => {
        setProcessingId(bookingId);
        try {
            const res = await fetch("/api/admin/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, action }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchBookings();
            }
        } catch (err) {
            console.error(`Failed to ${action} booking:`, err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedRef(id);
        setTimeout(() => setCopiedRef(null), 2000);
    };

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.transaction_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.qr_token?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.discount_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.passenger_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(b.seat_number).includes(searchTerm);

        if (!matchesSearch) return false;

        if (filterStatus === "PENDING_VERIFICATION") {
            return b.payment_status === "PENDING_VERIFICATION" || b.booking_status === "PENDING_VERIFICATION";
        }
        if (filterStatus === "PAID") {
            return b.payment_status === "PAID" || b.booking_status === "CONFIRMED";
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Page Header with Mode Selector */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-extrabold tracking-tight">GCash Payments & Reservations</h1>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Sync Active
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitor incoming GCash payments, audit reference numbers, and approve live tickets.
                    </p>
                </div>

                {/* Dual Mode Switcher for Presentations */}
                <div className="flex items-center gap-2 rounded-xl border bg-card p-1.5 shadow-sm">
                    <span className="text-xs font-semibold px-2 text-muted-foreground">Mode:</span>
                    <button
                        type="button"
                        onClick={() => handleToggleMode("AUTO")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            verificationMode === "AUTO"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Tickets are automatically approved upon GCash reference submission"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        Auto-Approve (Instant)
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToggleMode("MANUAL")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            verificationMode === "MANUAL"
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="Cashier must click Approve before ticket becomes valid"
                    >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Cashier Audit (Manual)
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Total GCash Revenue</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-600">
                            ₱{Number(stats.total_collected || 0).toLocaleString()}.00
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Verified and collected funds
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Pending Cashier Review</CardDescription>
                        <CardTitle className="text-2xl font-black text-amber-600 flex items-center gap-2">
                            {stats.pending_count}
                            {stats.pending_count > 0 && (
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Requires SMS / Reference validation
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Confirmed Bookings</CardDescription>
                        <CardTitle className="text-2xl font-black text-blue-600">
                            {stats.confirmed_count}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Valid boarding QR tickets released
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by Passenger, GCash Ref #, Seat Number, or Ticket ID..."
                        className="pl-9 bg-card"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterStatus === "ALL" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("ALL")}
                    >
                        All ({bookings.length})
                    </Button>
                    <Button
                        variant={filterStatus === "PENDING_VERIFICATION" ? "default" : "outline"}
                        size="sm"
                        className={filterStatus === "PENDING_VERIFICATION" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                        onClick={() => setFilterStatus("PENDING_VERIFICATION")}
                    >
                        Pending ({stats.pending_count})
                    </Button>
                    <Button
                        variant={filterStatus === "PAID" ? "default" : "outline"}
                        size="sm"
                        className={filterStatus === "PAID" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                        onClick={() => setFilterStatus("PAID")}
                    >
                        Paid ({stats.confirmed_count})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={fetchBookings} title="Refresh Table">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            {/* Bookings & Payments Table */}
            <Card className="shadow-sm border">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                        <span>Live Transaction Stream</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            Showing {filteredBookings.length} entries
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && bookings.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">Loading transactions...</div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">No bookings found matching filter.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-y text-muted-foreground uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="py-3 px-4">Date / Time</th>
                                        <th className="py-3 px-4">Passenger</th>
                                        <th className="py-3 px-4">Trip & Seat</th>
                                        <th className="py-3 px-4">GCash Ref No.</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredBookings.map((b) => {
                                        const isPaid = b.payment_status === "PAID" || b.booking_status === "CONFIRMED";
                                        const isPending = b.payment_status === "PENDING_VERIFICATION" || b.booking_status === "PENDING_VERIFICATION";
                                        const cleanRef = b.transaction_ref?.replace("GCASH-", "") || "N/A";
                                        const createdDate = new Date(b.created_at);

                                        return (
                                            <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                                {/* Date & Time */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-semibold text-foreground">
                                                        {createdDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {createdDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                                    </div>
                                                </td>

                                                {/* Passenger Details */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-foreground">{b.passenger_name}</div>
                                                    <div className="text-[11px] text-muted-foreground font-mono">
                                                        {b.passenger_contact || b.passenger_email}
                                                    </div>
                                                    {b.passenger_type && b.passenger_type !== "REGULAR" && (
                                                        <div className="flex flex-wrap items-center gap-1 mt-1">
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                                20% {b.passenger_type}
                                                            </span>
                                                            {b.discount_id && (
                                                                <span className="text-[10px] font-mono text-muted-foreground" title="Discount ID">
                                                                    ID: {b.discount_id}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Trip & Seat */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold flex items-center gap-1">
                                                        <span>{b.trip?.origin}</span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        <span>{b.trip?.destination}</span>
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        Seat <span className="font-mono font-bold text-foreground">#{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}</span> • {b.trip?.bus_number}
                                                    </div>
                                                </td>

                                                {/* GCash Reference Number */}
                                                <td className="py-3.5 px-4">
                                                    <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-2 py-1 rounded-md">
                                                        <span className="font-mono font-bold text-blue-700 dark:text-blue-300 tracking-wider">
                                                            {cleanRef}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(cleanRef, b.id)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="Copy Ref Number"
                                                        >
                                                            {copiedRef === b.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="font-mono font-extrabold text-foreground text-sm">
                                                        ₱{b.total_price}.00
                                                    </div>
                                                    {b.discount_amount && b.discount_amount > 0 ? (
                                                        <div className="text-[10px] text-emerald-600 font-semibold">
                                                            Saved ₱{b.discount_amount} (20% Off)
                                                        </div>
                                                    ) : null}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            PAID / VALID
                                                        </span>
                                                    ) : isPending ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            PENDING REVIEW
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                                            {b.booking_status}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                                                    {isPending && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2.5 text-xs"
                                                            disabled={processingId === b.id}
                                                            onClick={() => handleAction(b.id, "approve")}
                                                        >
                                                            <Check className="h-3.5 w-3.5 mr-1" />
                                                            {processingId === b.id ? "Approving..." : "Approve Ticket"}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => setSelectedTicket(b)}
                                                    >
                                                        <QrCode className="h-3.5 w-3.5 mr-1" />
                                                        View Ticket
                                                    </Button>
                                                    {isPending && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50 h-7 px-1.5"
                                                            disabled={processingId === b.id}
                                                            onClick={() => handleAction(b.id, "reject")}
                                                            title="Reject Booking"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Preview Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-card rounded-2xl border-2 border-primary shadow-2xl p-6 space-y-5">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <Bus className="h-5 w-5 text-red-600" />
                                <h3 className="font-extrabold text-base">Superlines Digital Ticket</h3>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedTicket(null)}>
                                ✕
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg text-xs">
                                <div>
                                    <p className="text-muted-foreground">Passenger</p>
                                    <p className="font-bold text-sm text-foreground">{selectedTicket.passenger_name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Seat Number</p>
                                    <p className="font-mono font-black text-xl text-red-600">
                                        #{selectedTicket.seat_number < 10 ? `0${selectedTicket.seat_number}` : selectedTicket.seat_number}
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs space-y-1.5 bg-card border p-3 rounded-lg">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Route:</span>
                                    <span className="font-bold">{selectedTicket.trip?.origin} ➔ {selectedTicket.trip?.destination}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Bus:</span>
                                    <span className="font-semibold">{selectedTicket.trip?.bus_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">GCash Reference:</span>
                                    <span className="font-mono font-bold text-blue-600">{selectedTicket.transaction_ref}</span>
                                </div>
                                {selectedTicket.passenger_type && selectedTicket.passenger_type !== "REGULAR" && (
                                    <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded text-purple-700 dark:text-purple-300 font-semibold">
                                        <span>Discount Category:</span>
                                        <span className="font-bold">
                                            20% {selectedTicket.passenger_type} {selectedTicket.discount_id ? `(#${selectedTicket.discount_id})` : ""}
                                        </span>
                                    </div>
                                )}
                                {selectedTicket.original_price && selectedTicket.original_price > selectedTicket.total_price && (
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Regular Fare:</span>
                                        <span className="line-through">₱{selectedTicket.original_price}.00</span>
                                    </div>
                                )}
                                {selectedTicket.discount_amount && selectedTicket.discount_amount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-semibold">
                                        <span>20% Statutory Discount:</span>
                                        <span>-₱{selectedTicket.discount_amount}.00</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-1 border-t">
                                    <span className="font-bold text-foreground">Total Fare Paid:</span>
                                    <span className="font-mono font-extrabold text-emerald-600 text-sm">₱{selectedTicket.total_price}.00</span>
                                </div>
                            </div>

                            {selectedTicket.passenger_type && selectedTicket.passenger_type !== "REGULAR" && (
                                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                                    <span>
                                        <strong>Terminal Boarding Note:</strong> Passenger must present their valid physical {selectedTicket.passenger_type} ID upon terminal check-in.
                                    </span>
                                </div>
                            )}

                            {/* Digital Ticket QR */}
                            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl border border-dashed">
                                <div className="h-36 w-36 bg-white p-2 rounded-lg border shadow-sm flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedTicket.qr_token || selectedTicket.id)}`}
                                        alt="Ticket QR Code"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <p className="font-mono font-bold text-xs mt-2 text-foreground tracking-wider">{selectedTicket.qr_token}</p>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Scannable by conductor terminal</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button className="w-full" onClick={() => window.print()}>
                                Print Ticket
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => setSelectedTicket(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
