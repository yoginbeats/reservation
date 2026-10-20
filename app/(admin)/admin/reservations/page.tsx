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
    ArrowRight,
    FileText,
    ArrowLeftRight,
    Link as LinkIcon,
} from "lucide-react";

export default function AdminReservationsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING_VERIFICATION" | "PAID">("ALL");
    const [viewMode, setViewMode] = useState<"STREAM" | "BOUND_FLEET">("STREAM");
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
            b.trip?.bus_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.trip?.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.trip?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    const [terminalFilter, setTerminalFilter] = useState<"ALL" | "CUBAO" | "DAET" | "BOUND_ONLY">("ALL");

    // Group filtered bookings by Bus Unit & Schedule (Cross-Terminal Binding)
    const scheduleGroups = (() => {
        const map = new Map<string, {
            groupKey: string;
            busNumber: string;
            departureDateStr: string;
            departureTimeDisplay: string;
            rawDate: Date;
            cubaoLegBookings: any[];
            daetLegBookings: any[];
            otherBookings: any[];
            totalRevenue: number;
            totalPassengers: number;
            isDualTerminalBound: boolean;
        }>();

        for (const b of filteredBookings) {
            const depTime = b.trip?.departure_time ? new Date(b.trip.departure_time) : new Date(b.created_at);
            const dateKey = depTime.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
            const timeKey = depTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const busNum = b.trip?.bus_number || "Superlines Express";
            
            // Clean bus identifier (e.g. SL-401 or Bus 101 or Superlines Express)
            const busCore = busNum.split(" ")[0].trim();
            const groupKey = `${busCore}__${dateKey}`;

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    groupKey,
                    busNumber: busNum,
                    departureDateStr: dateKey,
                    departureTimeDisplay: timeKey,
                    rawDate: depTime,
                    cubaoLegBookings: [],
                    daetLegBookings: [],
                    otherBookings: [],
                    totalRevenue: 0,
                    totalPassengers: 0,
                    isDualTerminalBound: false,
                });
            }

            const grp = map.get(groupKey)!;
            const fare = Number(b.total_price || 850);
            grp.totalRevenue += fare;
            grp.totalPassengers += b.seat_count || (b.seat_numbers?.length) || 1;

            const origin = (b.trip?.origin || "").toLowerCase();
            const dest = (b.trip?.destination || "").toLowerCase();

            if (origin.includes("cubao") || (dest.includes("daet") && !origin.includes("daet"))) {
                grp.cubaoLegBookings.push(b);
            } else if (origin.includes("daet") || dest.includes("cubao")) {
                grp.daetLegBookings.push(b);
            } else {
                grp.otherBookings.push(b);
            }

            grp.isDualTerminalBound = grp.cubaoLegBookings.length > 0 && grp.daetLegBookings.length > 0;
        }

        let result = Array.from(map.values()).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

        if (terminalFilter === "CUBAO") {
            result = result.filter(g => g.cubaoLegBookings.length > 0);
        } else if (terminalFilter === "DAET") {
            result = result.filter(g => g.daetLegBookings.length > 0);
        } else if (terminalFilter === "BOUND_ONLY") {
            result = result.filter(g => g.isDualTerminalBound);
        }

        return result;
    })();

    const dualBoundCount = scheduleGroups.filter(g => g.isDualTerminalBound).length;

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
                        Monitor incoming GCash payments, audit reference numbers, and review cross-terminal bound bus manifests.
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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
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

                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold tracking-wider">Bound Bus Rotations</CardDescription>
                        <CardTitle className="text-2xl font-black text-purple-600 flex items-center gap-2">
                            {dualBoundCount}
                            <ArrowLeftRight className="h-4 w-4 text-purple-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Cubao ⇄ Daet cross-bound fleet
                    </CardContent>
                </Card>
            </div>

            {/* Search, View Mode, and Status Filters */}
            <div className="space-y-3">
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by Passenger, GCash Ref #, Seat Number, Bus Body #..."
                            className="pl-9 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* View Switcher: Live Stream vs Bound Bus Fleet View */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-muted/40 shadow-sm">
                        <Button
                            type="button"
                            size="sm"
                            variant={viewMode === "STREAM" ? "default" : "ghost"}
                            className={`h-8 text-xs font-bold ${
                                viewMode === "STREAM"
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setViewMode("STREAM")}
                        >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            Live Stream ({filteredBookings.length})
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={viewMode === "BOUND_FLEET" ? "default" : "ghost"}
                            className={`h-8 text-xs font-bold ${
                                viewMode === "BOUND_FLEET"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => setViewMode("BOUND_FLEET")}
                        >
                            <Bus className="h-3.5 w-3.5 mr-1.5 text-amber-300" />
                            Bound Bus Schedules ({scheduleGroups.length})
                            {dualBoundCount > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400 text-emerald-950 font-black">
                                    {dualBoundCount} Bound
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Status Filters */}
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant={filterStatus === "ALL" ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            onClick={() => setFilterStatus("ALL")}
                        >
                            All ({bookings.length})
                        </Button>
                        <Button
                            variant={filterStatus === "PENDING_VERIFICATION" ? "default" : "outline"}
                            size="sm"
                            className={`h-8 text-xs font-semibold ${filterStatus === "PENDING_VERIFICATION" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
                            onClick={() => setFilterStatus("PENDING_VERIFICATION")}
                        >
                            Pending ({stats.pending_count})
                        </Button>
                        <Button
                            variant={filterStatus === "PAID" ? "default" : "outline"}
                            size="sm"
                            className={`h-8 text-xs font-semibold ${filterStatus === "PAID" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                            onClick={() => setFilterStatus("PAID")}
                        >
                            Paid ({stats.confirmed_count})
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={fetchBookings} title="Refresh Table">
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* Terminal Route Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-1">
                        <Filter className="h-3.5 w-3.5" /> Filter Route:
                    </span>
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("ALL")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            terminalFilter === "ALL"
                                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                                : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        All Routes
                    </button>
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("CUBAO")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                            terminalFilter === "CUBAO"
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                        }`}
                    >
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Cubao ➔ Daet Only
                    </button>
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("DAET")}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                            terminalFilter === "DAET"
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100"
                        }`}
                    >
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Daet ➔ Cubao Only
                    </button>
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("BOUND_ONLY")}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                            terminalFilter === "BOUND_ONLY"
                                ? "bg-purple-600 text-white shadow-sm"
                                : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800"
                        }`}
                    >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        🔗 Dual-Terminal Bound Rotations ({dualBoundCount})
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW MODE 1: BOUND BUS SCHEDULES (FLEET & CROSS-TERMINAL MANIFEST VIEW)   */}
            {/* ========================================================================= */}
            {viewMode === "BOUND_FLEET" ? (
                <div className="space-y-6">
                    {scheduleGroups.length === 0 ? (
                        <Card className="p-16 text-center text-muted-foreground space-y-3">
                            <Bus className="h-10 w-10 mx-auto text-muted-foreground/60" />
                            <p className="font-semibold text-base">No bus schedules found matching your filter criteria.</p>
                            <p className="text-xs">Try selecting &quot;All Routes&quot; or clearing your search term.</p>
                        </Card>
                    ) : (
                        scheduleGroups.map((grp) => {
                            const totalCap = 45;
                            const loadPercent = Math.min(100, Math.round((grp.totalPassengers / totalCap) * 100));

                            return (
                                <Card
                                    key={grp.groupKey}
                                    className={`shadow-md border-2 transition-all ${
                                        grp.isDualTerminalBound
                                            ? "border-emerald-500/60 bg-gradient-to-br from-card via-card to-emerald-950/10"
                                            : "border-border hover:border-blue-400"
                                    }`}
                                >
                                    {/* Card Header */}
                                    <CardHeader className="pb-3 border-b bg-muted/20">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="flex items-center gap-1.5 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 px-3 py-1 rounded-lg font-mono font-black text-sm">
                                                        <Bus className="h-4 w-4 text-blue-600" />
                                                        {grp.busNumber}
                                                    </div>
                                                    <span className="font-extrabold text-sm text-foreground">
                                                        📅 {grp.departureDateStr} • {grp.departureTimeDisplay}
                                                    </span>
                                                    {grp.isDualTerminalBound ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400 shadow-sm animate-pulse">
                                                            <ArrowLeftRight className="h-3.5 w-3.5" />
                                                            Cross-Terminal Bound (Cubao ⇄ Daet Active)
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded text-xs text-muted-foreground bg-muted font-medium">
                                                            Single Direction Leg
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Unified rotation manifest binding bookings made from Cubao and Daet terminals under this physical bus departure.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs font-bold">
                                                <div className="text-right">
                                                    <div className="text-muted-foreground uppercase text-[10px]">Total Passengers</div>
                                                    <div className="text-base font-black text-blue-600 font-mono">
                                                        {grp.totalPassengers} Pax
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-muted-foreground uppercase text-[10px]">Rotation Gross</div>
                                                    <div className="text-base font-black text-emerald-600 font-mono">
                                                        ₱{grp.totalRevenue.toLocaleString()}.00
                                                    </div>
                                                </div>
                                                <div className="w-24 hidden sm:block">
                                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                                        <span>Load Factor</span>
                                                        <span className="font-mono font-bold">{loadPercent}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                loadPercent > 80 ? "bg-red-500" : loadPercent > 40 ? "bg-emerald-500" : "bg-blue-500"
                                                            }`}
                                                            style={{ width: `${loadPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {/* Dual Side-by-Side Roster: Cubao Leg (Left) & Daet Leg (Right) */}
                                    <CardContent className="p-4 grid gap-4 lg:grid-cols-2">
                                        {/* ===================================================== */}
                                        {/* LEFT COLUMN: CUBAO TERMINAL ➔ DAET (OUTBOUND)         */}
                                        {/* ===================================================== */}
                                        <div className="rounded-xl border-2 border-emerald-500/30 overflow-hidden bg-card">
                                            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border-b flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                    <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                                                        Origin: Cubao Terminal ➔ Daet
                                                    </span>
                                                </div>
                                                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                                                    {grp.cubaoLegBookings.length} Passenger(s)
                                                </span>
                                            </div>

                                            <div className="p-3">
                                                {grp.cubaoLegBookings.length === 0 ? (
                                                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                                                        No bookings originating from Cubao terminal yet. Ready for counter & online bookings.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {grp.cubaoLegBookings.map((b) => {
                                                            const isPaid = b.payment_status === "PAID" || b.booking_status === "CONFIRMED";
                                                            const isPending = b.payment_status === "PENDING_VERIFICATION" || b.booking_status === "PENDING_VERIFICATION";
                                                            const cleanRef = b.transaction_ref?.replace("GCASH-", "") || "N/A";

                                                            return (
                                                                <div
                                                                    key={b.id}
                                                                    className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                                                >
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 border border-emerald-300">
                                                                            <span className="text-[9px] uppercase text-emerald-700 dark:text-emerald-400">Seat</span>
                                                                            #{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-foreground text-sm">{b.passenger_name}</p>
                                                                            <p className="text-[11px] text-muted-foreground font-mono">
                                                                                {b.passenger_contact || b.passenger_email || "Guest"}
                                                                            </p>
                                                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                                {b.discounted_passengers && b.discounted_passengers.length > 0 ? (
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                                                                                        20% Discount ({b.discounted_passengers[0]?.classification})
                                                                                    </span>
                                                                                ) : b.passenger_type && b.passenger_type !== "REGULAR" ? (
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                                                                        20% {b.passenger_type}
                                                                                    </span>
                                                                                ) : null}
                                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted">
                                                                                    Ref: {cleanRef}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0">
                                                                        <div className="font-mono font-black text-foreground">
                                                                            ₱{b.total_price}.00
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            {isPaid ? (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                                    PAID
                                                                                </span>
                                                                            ) : isPending ? (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                                                                                    PENDING
                                                                                </span>
                                                                            ) : (
                                                                                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-700">
                                                                                    {b.booking_status}
                                                                                </span>
                                                                            )}
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-6 px-1.5 text-[10px]"
                                                                                onClick={() => setSelectedTicket(b)}
                                                                            >
                                                                                <QrCode className="h-3 w-3 mr-1" /> Ticket
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* ===================================================== */}
                                        {/* RIGHT COLUMN: DAET TERMINAL ➔ CUBAO (RETURN/BOUND)     */}
                                        {/* ===================================================== */}
                                        <div className="rounded-xl border-2 border-blue-500/30 overflow-hidden bg-card">
                                            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border-b flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                                    <span className="font-extrabold text-xs text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                                                        Origin: Daet Terminal ➔ Cubao
                                                    </span>
                                                </div>
                                                <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900 px-2 py-0.5 rounded-md border border-blue-300">
                                                    {grp.daetLegBookings.length} Passenger(s)
                                                </span>
                                            </div>

                                            <div className="p-3">
                                                {grp.daetLegBookings.length === 0 ? (
                                                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                                                        No bookings originating from Daet terminal yet. Ready for Daet counter & online bookings.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {grp.daetLegBookings.map((b) => {
                                                            const isPaid = b.payment_status === "PAID" || b.booking_status === "CONFIRMED";
                                                            const isPending = b.payment_status === "PENDING_VERIFICATION" || b.booking_status === "PENDING_VERIFICATION";
                                                            const cleanRef = b.transaction_ref?.replace("GCASH-", "") || "N/A";

                                                            return (
                                                                <div
                                                                    key={b.id}
                                                                    className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                                                >
                                                                    <div className="flex items-start gap-2.5">
                                                                        <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 border border-blue-300">
                                                                            <span className="text-[9px] uppercase text-blue-700 dark:text-blue-400">Seat</span>
                                                                            #{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-foreground text-sm">{b.passenger_name}</p>
                                                                            <p className="text-[11px] text-muted-foreground font-mono">
                                                                                {b.passenger_contact || b.passenger_email || "Guest"}
                                                                            </p>
                                                                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                                {b.discounted_passengers && b.discounted_passengers.length > 0 ? (
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                                                                                        20% Discount ({b.discounted_passengers[0]?.classification})
                                                                                    </span>
                                                                                ) : b.passenger_type && b.passenger_type !== "REGULAR" ? (
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                                                                        20% {b.passenger_type}
                                                                                    </span>
                                                                                ) : null}
                                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted">
                                                                                    Ref: {cleanRef}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0">
                                                                        <div className="font-mono font-black text-foreground">
                                                                            ₱{b.total_price}.00
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            {isPaid ? (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                                    PAID
                                                                                </span>
                                                                            ) : isPending ? (
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                                                                                    PENDING
                                                                                </span>
                                                                            ) : (
                                                                                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-700">
                                                                                    {b.booking_status}
                                                                                </span>
                                                                            )}
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="h-6 px-1.5 text-[10px]"
                                                                                onClick={() => setSelectedTicket(b)}
                                                                            >
                                                                                <QrCode className="h-3 w-3 mr-1" /> Ticket
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            ) : (
                /* ========================================================================= */
                /* VIEW MODE 2: LIVE TRANSACTION STREAM TABLE                                */
                /* ========================================================================= */
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
                                            <th className="py-3 px-4">Trip & Bound Bus</th>
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
                                                        {b.discounted_passengers && b.discounted_passengers.length > 0 ? (
                                                            <div className="mt-1 space-y-0.5">
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                                    {b.discounted_passengers.length}x 20% Discount
                                                                </span>
                                                                {b.discounted_passengers.map((dp: any, idx: number) => (
                                                                    <div key={idx} className="text-[10px] text-muted-foreground font-mono">
                                                                        • {dp.name} ({dp.classification}: {dp.id_number})
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : b.passenger_type && b.passenger_type !== "REGULAR" ? (
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
                                                        ) : null}
                                                    </td>

                                                    {/* Trip & Seat & Bound Bus */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-semibold flex items-center gap-1">
                                                            <span className={b.trip?.origin?.toLowerCase().includes("cubao") ? "text-emerald-700 dark:text-emerald-300 font-bold" : ""}>
                                                                {b.trip?.origin}
                                                            </span>
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            <span className={b.trip?.origin?.toLowerCase().includes("daet") ? "text-blue-700 dark:text-blue-300 font-bold" : ""}>
                                                                {b.trip?.destination}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <span>
                                                                Seat <strong className="font-mono text-foreground">
                                                                    {b.seat_numbers && b.seat_numbers.length > 1
                                                                        ? b.seat_numbers.map((s: number) => `#${s < 10 ? `0${s}` : s}`).join(", ")
                                                                        : `#${b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}`}
                                                                </strong>
                                                            </span>
                                                            <span>•</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSearchTerm(b.trip?.bus_number || "");
                                                                    setViewMode("BOUND_FLEET");
                                                                }}
                                                                className="hover:underline font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                                                                title="Click to view bound bus schedule manifest"
                                                            >
                                                                <Bus className="h-3 w-3" />
                                                                {b.trip?.bus_number}
                                                            </button>
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
            )}

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
                                {selectedTicket.discounted_passengers && selectedTicket.discounted_passengers.length > 0 ? (
                                    <div className="space-y-1.5 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
                                        <div className="flex justify-between font-bold text-purple-700 dark:text-purple-300">
                                            <span>20% Discount Beneficiaries:</span>
                                            <span>{selectedTicket.discounted_passengers.length} Passenger(s)</span>
                                        </div>
                                        {selectedTicket.discounted_passengers.map((dp: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-[11px] border-t border-purple-100 dark:border-purple-900/60 pt-1">
                                                <span className="font-semibold text-foreground">• {dp.name} ({dp.classification})</span>
                                                <span className="font-mono text-purple-700 dark:text-purple-300">ID: {dp.id_number}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : selectedTicket.passenger_type && selectedTicket.passenger_type !== "REGULAR" ? (
                                    <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded text-purple-700 dark:text-purple-300 font-semibold">
                                        <span>Discount Category:</span>
                                        <span className="font-bold">
                                            20% {selectedTicket.passenger_type} {selectedTicket.discount_id ? `(#${selectedTicket.discount_id})` : ""}
                                        </span>
                                    </div>
                                ) : null}
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
