"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Ticket,
    Calendar,
    Bus,
    ArrowRight,
    UserCheck,
    MapPin,
    DollarSign,
    CheckCircle2,
    Printer,
    RefreshCw,
    X,
    FileSpreadsheet,
    Banknote,
    Clock,
    User,
    Check,
    AlertCircle,
    Building2,
    Calculator,
    Search,
    QrCode,
    SlidersHorizontal,
    RotateCcw,
    ShieldAlert,
    FileText,
    Percent,
    AlertTriangle
} from "lucide-react";

interface TellerDashboardClientProps {
    initialTrips: any[];
    tellerName: string;
    terminalName: string;
    terminalLocation: string;
    initialWalkInCount: number;
}

export function TellerDashboardClient({
    initialTrips,
    tellerName,
    terminalName,
    terminalLocation,
    initialWalkInCount
}: TellerDashboardClientProps) {
    const [activeTab, setActiveTab] = useState<"bays" | "lookup" | "issued" | "xreading">("bays");

    // Live Bay Status State
    const [bayBoard, setBayBoard] = useState<any[]>([]);
    const [loadingBays, setLoadingBays] = useState(false);

    // Ticket Lookup State
    const [lookupQuery, setLookupQuery] = useState("");
    const [lookupResults, setLookupResults] = useState<any[]>([]);
    const [loadingLookup, setLoadingLookup] = useState(false);
    const [lookupPerformed, setLookupPerformed] = useState(false);

    // Today's Issued Tickets State
    const [issuedTickets, setIssuedTickets] = useState<any[]>([]);
    const [loadingIssued, setLoadingIssued] = useState(false);
    const [issuedFilter, setIssuedFilter] = useState<"ALL" | "CASH" | "ONLINE" | "CANCELLED">("ALL");
    const [issuedSearch, setIssuedSearch] = useState("");

    // Active Action Modals State
    const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<any | null>(null);
    const [selectedTicketForRebook, setSelectedTicketForRebook] = useState<any | null>(null);
    const [newSeatInput, setNewSeatInput] = useState<number>(1);
    const [supervisorCode, setSupervisorCode] = useState<string>("");
    const [rebookError, setRebookError] = useState<string | null>(null);
    const [rebookLoading, setRebookLoading] = useState(false);

    const [selectedTicketForVoid, setSelectedTicketForVoid] = useState<any | null>(null);
    const [voidReason, setVoidReason] = useState("Passenger requested cancellation/refund before trip");
    const [voidLoading, setVoidLoading] = useState(false);

    // Mid-Shift X-Reading State
    const [openXReadingModal, setOpenXReadingModal] = useState(false);
    const [xReadingSlip, setXReadingSlip] = useState<any | null>(null);

    // End-of-Shift Z-Reading State
    const [openRemittanceModal, setOpenRemittanceModal] = useState(false);
    const [remittanceSlip, setRemittanceSlip] = useState<any | null>(null);
    const [submittingRemit, setSubmittingRemit] = useState(false);

    // Shift Metrics
    const [walkInCount, setWalkInCount] = useState<number>(initialWalkInCount || 35);
    const [shiftData, setShiftData] = useState<any>({
        total_tickets: walkInCount > 0 ? walkInCount : 35,
        gross_sales: 30940,
        total_discounts: 1190,
        net_cash_expected: 29750,
        senior_count: 5,
        student_count: 2,
        pwd_count: 0,
        counter_number: "Counter 02",
        shift_time: "08:00 AM - 04:00 PM (8-Hour Shift)",
    });

    // Cash Drawer Denomination Inputs (Shared between X-Reading and Z-Reading)
    const [thousands, setThousands] = useState<number>(25);
    const [fiveHundreds, setFiveHundreds] = useState<number>(8);
    const [twoHundreds, setTwoHundreds] = useState<number>(2);
    const [hundreds, setHundreds] = useState<number>(3);
    const [fifties, setFifties] = useState<number>(1);
    const [twenties, setTwenties] = useState<number>(0);
    const [coins, setCoins] = useState<number>(0);
    const [notes, setNotes] = useState<string>("Counter spot cash drawer reconciliation");

    // Computed Cash Drawer
    const totalCounted =
        thousands * 1000 +
        fiveHundreds * 500 +
        twoHundreds * 200 +
        hundreds * 100 +
        fifties * 50 +
        twenties * 20 +
        coins * 1;

    const expectedCash = shiftData.net_cash_expected || 29750;
    const variance = totalCounted - expectedCash;

    useEffect(() => {
        fetchShiftMetrics();
        fetchBayBoard();
        fetchIssuedTickets();
    }, []);

    const fetchShiftMetrics = async () => {
        try {
            const res = await fetch("/api/teller/remittance");
            const data = await res.json();
            if (res.ok && data.shift) {
                setShiftData(data.shift);
                setWalkInCount(data.shift.total_tickets);
            }
        } catch (err) {
            console.error("Failed to load shift metrics:", err);
        }
    };

    const fetchBayBoard = async () => {
        setLoadingBays(true);
        try {
            const res = await fetch("/api/teller/tickets?action=bay_status");
            const data = await res.json();
            if (res.ok && data.bay_board) {
                setBayBoard(data.bay_board);
            }
        } catch (err) {
            console.error("Failed to fetch bay board:", err);
        } finally {
            setLoadingBays(false);
        }
    };

    const fetchIssuedTickets = async () => {
        setLoadingIssued(true);
        try {
            const res = await fetch("/api/teller/tickets?action=today_issued");
            const data = await res.json();
            if (res.ok && data.tickets) {
                setIssuedTickets(data.tickets);
            }
        } catch (err) {
            console.error("Failed to fetch issued tickets:", err);
        } finally {
            setLoadingIssued(false);
        }
    };

    const handleSearchLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupQuery.trim()) return;

        setLoadingLookup(true);
        setLookupPerformed(true);
        try {
            const res = await fetch(`/api/teller/tickets?action=lookup&q=${encodeURIComponent(lookupQuery.trim())}`);
            const data = await res.json();
            if (res.ok && data.tickets) {
                setLookupResults(data.tickets);
            } else {
                setLookupResults([]);
            }
        } catch (err) {
            console.error("Ticket lookup error:", err);
            setLookupResults([]);
        } finally {
            setLoadingLookup(false);
        }
    };

    const handleConfirmRebook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketForRebook || !newSeatInput) return;

        if (!supervisorCode.trim()) {
            setRebookError("Head Supervisor Authorization Code is required to perform rebooking.");
            return;
        }

        setRebookLoading(true);
        setRebookError(null);
        try {
            const res = await fetch("/api/teller/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "REBOOK_SEAT",
                    token: selectedTicketForRebook.qr_token,
                    booking_id: selectedTicketForRebook.booking_id || selectedTicketForRebook.id,
                    new_seat_number: Number(newSeatInput),
                    supervisor_code: supervisorCode.trim().toUpperCase(),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Seat successfully rebooked to #${newSeatInput}! Authorized by Head Supervisor.`);
                setSelectedTicketForRebook(null);
                setSupervisorCode("");
                setRebookError(null);
                fetchIssuedTickets();
                if (lookupPerformed && lookupQuery) {
                    handleSearchLookup({ preventDefault: () => {} } as any);
                }
            } else {
                setRebookError(data.error || "Failed to rebook seat.");
            }
        } catch (err: any) {
            setRebookError("Error during rebooking: " + err.message);
        } finally {
            setRebookLoading(false);
        }
    };

    const handleConfirmVoid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketForVoid) return;

        setVoidLoading(true);
        try {
            const res = await fetch("/api/teller/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "VOID_TICKET",
                    token: selectedTicketForVoid.qr_token,
                    booking_id: selectedTicketForVoid.booking_id || selectedTicketForVoid.id,
                    reason: voidReason,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Ticket successfully VOIDED and seat released.");
                setSelectedTicketForVoid(null);
                fetchIssuedTickets();
                fetchShiftMetrics();
                if (lookupPerformed && lookupQuery) {
                    handleSearchLookup({ preventDefault: () => {} } as any);
                }
            } else {
                alert(data.error || "Failed to void ticket.");
            }
        } catch (err: any) {
            alert("Error voiding ticket: " + err.message);
        } finally {
            setVoidLoading(false);
        }
    };

    const handleSaveXReading = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/teller/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "RECORD_X_READING",
                    x_reading_data: {
                        teller_name: tellerName,
                        terminal_name: terminalName,
                        counter_number: shiftData.counter_number || "Counter 02",
                        total_tickets: shiftData.total_tickets,
                        gross_sales: shiftData.gross_sales,
                        total_discounts: shiftData.total_discounts,
                        net_cash_expected: expectedCash,
                        total_cash_counted: totalCounted,
                        variance: variance,
                        denominations: {
                            thousands,
                            fiveHundreds,
                            twoHundreds,
                            hundreds,
                            fifties,
                            twenties,
                            coins,
                        },
                        notes: notes,
                    },
                }),
            });
            const data = await res.json();
            if (res.ok && data.x_reading) {
                setXReadingSlip(data.x_reading);
                setOpenXReadingModal(false);
            }
        } catch (err) {
            console.error("Failed to record X-Reading:", err);
        }
    };

    const handleAutoFillExact = () => {
        setThousands(25);
        setFiveHundreds(8);
        setTwoHundreds(2);
        setHundreds(3);
        setFifties(1);
        setTwenties(0);
        setCoins(0);
    };

    const handleConfirmRemittance = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingRemit(true);

        const payload = {
            teller_name: tellerName,
            terminal_name: terminalName,
            counter_number: shiftData.counter_number || "Counter 02",
            total_tickets: shiftData.total_tickets,
            gross_sales: shiftData.gross_sales,
            total_discounts: shiftData.total_discounts,
            net_cash_expected: expectedCash,
            total_cash_counted: totalCounted,
            variance: variance,
            denominations: {
                thousands,
                fiveHundreds,
                twoHundreds,
                hundreds,
                fifties,
                twenties,
                coins,
            },
            notes: notes,
        };

        try {
            const res = await fetch("/api/teller/remittance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && data.remittance) {
                setRemittanceSlip(data.remittance);
                setOpenRemittanceModal(false);
                fetchShiftMetrics();
            } else {
                alert(data.error || "Failed to record remittance.");
            }
        } catch (err: any) {
            alert("Error submitting remittance: " + err.message);
        } finally {
            setSubmittingRemit(false);
        }
    };

    // Filter Issued Tickets List
    const filteredIssuedTickets = issuedTickets.filter((t) => {
        const matchesStatus =
            issuedFilter === "ALL" ||
            (issuedFilter === "CASH" && t.payment_method?.toUpperCase().includes("CASH")) ||
            (issuedFilter === "ONLINE" && !t.payment_method?.toUpperCase().includes("CASH")) ||
            (issuedFilter === "CANCELLED" && (t.booking_status === "CANCELLED" || t.ticket_status === "CANCELLED"));

        const q = issuedSearch.toLowerCase().trim();
        const matchesQuery =
            !q ||
            t.passenger_name?.toLowerCase().includes(q) ||
            t.qr_token?.toLowerCase().includes(q) ||
            t.seat_number?.toString().includes(q);

        return matchesStatus && matchesQuery;
    });

    return (
        <div className="space-y-6">
            {/* Header with Counter Shift Context */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Banknote className="h-7 w-7 text-emerald-600" />
                        Teller Counter Operations Portal
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        Assigned: <strong>{terminalName}</strong> ({shiftData.counter_number || "Counter 02"}) • Logged in as: <strong>{tellerName}</strong>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Mid-Shift X-Reading Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            fetchShiftMetrics();
                            setOpenXReadingModal(true);
                        }}
                        className="font-bold border-zinc-300 dark:border-zinc-700 hover:bg-muted"
                    >
                        <Calculator className="mr-1.5 h-4 w-4 text-blue-600" />
                        Mid-Shift X-Reading (Spot Audit)
                    </Button>

                    {/* End-of-Shift Z-Reading Button */}
                    <Button
                        size="sm"
                        onClick={() => {
                            fetchShiftMetrics();
                            setOpenRemittanceModal(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                    >
                        <Banknote className="mr-1.5 h-4 w-4" />
                        Close Shift (Z-Reading)
                    </Button>

                    {/* New Walk-in Booking Action */}
                    <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                        <Link href="/teller/walk-in">
                            <Ticket className="mr-1.5 h-4 w-4" />
                            New Walk-in POS
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Shift Summary Cards */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {/* Expected Cash in Drawer */}
                <Card className="border-l-4 border-l-emerald-600 bg-card shadow-sm p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Expected Cash in Drawer</span>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </p>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                        ₱{expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Physical cash drawer turnover balance</p>
                </Card>

                {/* Walk-in Tickets Sold */}
                <Card className="border-l-4 border-l-blue-600 bg-card shadow-sm p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Counter Tickets Sold</span>
                        <Ticket className="h-4 w-4 text-blue-600" />
                    </p>
                    <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
                        {shiftData.total_tickets || 35} Tickets
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Walk-in passengers checked & issued</p>
                </Card>

                {/* Statutory Discounts */}
                <Card className="border-l-4 border-l-purple-600 bg-card shadow-sm p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>20% Discounts Granted</span>
                        <Percent className="h-4 w-4 text-purple-600" />
                    </p>
                    <div className="text-xl sm:text-2xl font-black text-purple-600 mt-1">
                        -₱{(shiftData.total_discounts || 1190).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {shiftData.senior_count + shiftData.student_count + shiftData.pwd_count} Senior / Student / PWD
                    </p>
                </Card>

                {/* Terminal Shift Info */}
                <Card className="border-l-4 border-l-zinc-600 bg-card shadow-sm p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Counter Window</span>
                        <Building2 className="h-4 w-4 text-zinc-600" />
                    </p>
                    <div className="text-sm font-black text-foreground truncate mt-1">{terminalName}</div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {shiftData.counter_number || "Counter 02"} • 08:00 AM - 04:00 PM
                    </p>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab("bays");
                        fetchBayBoard();
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
                        activeTab === "bays"
                            ? "border-red-600 text-red-600 bg-red-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Bus className="h-4 w-4" />
                    <span>Terminal Bay & Departure Board</span>
                    {bayBoard.length > 0 && (
                        <span className="ml-1 bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                            {bayBoard.length}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("lookup")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
                        activeTab === "lookup"
                            ? "border-red-600 text-red-600 bg-red-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Search className="h-4 w-4" />
                    <span>Ticket Lookup & Counter Re-print</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setActiveTab("issued");
                        fetchIssuedTickets();
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
                        activeTab === "issued"
                            ? "border-red-600 text-red-600 bg-red-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <FileText className="h-4 w-4" />
                    <span>Today&apos;s Issued Tickets Log</span>
                    {issuedTickets.length > 0 && (
                        <span className="ml-1 bg-zinc-800 text-zinc-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                            {issuedTickets.length}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setActiveTab("xreading");
                        fetchShiftMetrics();
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
                        activeTab === "xreading"
                            ? "border-red-600 text-red-600 bg-red-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Calculator className="h-4 w-4" />
                    <span>Mid-Shift X-Reading (Spot Cash Drawer)</span>
                </button>
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: TERMINAL BAY & DEPARTURE BOARD                                      */}
            {/* ========================================================================= */}
            {activeTab === "bays" && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2">
                                <Bus className="h-5 w-5 text-red-600" />
                                Active Terminal Bay Departure Board
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Real-time bus gate dispatch, remaining seats, and 1-click counter walk-in ticketing.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchBayBoard}
                            disabled={loadingBays}
                            className="text-xs font-semibold"
                        >
                            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingBays ? "animate-spin" : ""}`} />
                            Refresh Board
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {bayBoard.map((trip) => {
                            const isAlmostFull = trip.available_seats <= 5;
                            const isBoarding = trip.status === "BOARDING" || trip.status === "FINAL CALL";

                            return (
                                <Card
                                    key={trip.id}
                                    className={`relative overflow-hidden border-2 transition-all hover:shadow-md ${
                                        isBoarding
                                            ? "border-amber-500/80 bg-amber-500/5"
                                            : "border-border hover:border-red-500/50"
                                    }`}
                                >
                                    {/* Top Bay Banner */}
                                    <div className="flex items-center justify-between bg-muted/60 px-4 py-2 border-b text-xs font-mono">
                                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                                            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black">
                                                {trip.bay_number}
                                            </span>
                                            <span>🚍 {trip.bus_number}</span>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                trip.status === "FINAL CALL"
                                                    ? "bg-red-600 text-white animate-pulse"
                                                    : trip.status === "BOARDING"
                                                    ? "bg-amber-500 text-zinc-950"
                                                    : "bg-blue-600/20 text-blue-600 border border-blue-500/30"
                                            }`}
                                        >
                                            {trip.status}
                                        </span>
                                    </div>

                                    <CardContent className="p-4 space-y-3">
                                        <div>
                                            <h3 className="font-extrabold text-base flex items-center gap-1.5 text-foreground">
                                                <span>{trip.origin}</span>
                                                <ArrowRight className="h-4 w-4 text-red-500" />
                                                <span>{trip.destination}</span>
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                                ⏰ Departs: {new Date(trip.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Fare: ₱{trip.fare_amount}.00
                                            </p>
                                        </div>

                                        {/* Seat Gauge */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground font-medium">Seat Availability:</span>
                                                <span
                                                    className={`font-mono font-black ${
                                                        isAlmostFull ? "text-red-600 font-bold" : "text-emerald-600"
                                                    }`}
                                                >
                                                    {trip.available_seats} Seats Available ({trip.booked_seats}/45)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        isAlmostFull
                                                            ? "bg-red-600"
                                                            : trip.booked_seats > 30
                                                            ? "bg-amber-500"
                                                            : "bg-emerald-600"
                                                    }`}
                                                    style={{ width: `${(trip.booked_seats / 45) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 pt-1 border-t">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className="flex-1 text-xs font-semibold"
                                            >
                                                <Link href={`/teller/manifest?trip_id=${trip.id}`}>
                                                    <FileText className="mr-1 h-3.5 w-3.5" />
                                                    Manifest
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                asChild
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                                            >
                                                <Link href={`/teller/walk-in?trip_id=${trip.id}`}>
                                                    <Ticket className="mr-1 h-3.5 w-3.5" />
                                                    Quick Book
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: TICKET LOOKUP & COUNTER RE-PRINT                                    */}
            {/* ========================================================================= */}
            {activeTab === "lookup" && (
                <div className="space-y-4">
                    <Card className="border-2 border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Search className="h-5 w-5 text-red-600" />
                                Counter Passenger Ticket Lookup & Re-print
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Enter Passenger Name, Contact Phone, GCash Reference Number, or Ticket Token (e.g., TKT-...) to view status, rebook seats, or print physical thermal boarding pass stubs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearchLookup} className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Enter Passenger Name, GCash Ref #, Ticket Token, or Phone Number..."
                                        value={lookupQuery}
                                        onChange={(e) => setLookupQuery(e.target.value)}
                                        className="pl-9 text-xs font-medium"
                                        autoFocus
                                    />
                                </div>
                                <Button type="submit" disabled={loadingLookup || !lookupQuery.trim()} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs">
                                    {loadingLookup ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
                                    Find Ticket
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Results Display */}
                    {loadingLookup ? (
                        <div className="p-8 text-center text-muted-foreground text-xs">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-red-600" />
                            Searching system database & cached reservations...
                        </div>
                    ) : lookupResults.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {lookupResults.map((t) => {
                                const isCancelled = t.booking_status === "CANCELLED" || t.ticket_status === "CANCELLED";
                                const isUsed = t.ticket_status === "USED";

                                return (
                                    <Card key={t.id} className="border-2 border-border shadow-sm">
                                        <CardHeader className="pb-2 bg-muted/40 border-b">
                                            <div className="flex items-center justify-between text-xs font-mono">
                                                <span className="font-black text-foreground">{t.qr_token}</span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        isCancelled
                                                            ? "bg-red-500/20 text-red-600 border border-red-500/30"
                                                            : isUsed
                                                            ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                                                            : "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                                                    }`}
                                                >
                                                    {isCancelled ? "VOIDED / CANCELLED" : isUsed ? "✓ BOARDED" : "VALID FOR BOARDING"}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Passenger Name</p>
                                                    <p className="font-extrabold text-base text-foreground">{t.passenger_name}</p>
                                                    {t.passenger_contact && (
                                                        <p className="text-[11px] text-muted-foreground font-mono">{t.passenger_contact}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Seat Number</p>
                                                    <p className="text-xl font-black font-mono text-red-600">
                                                        #{t.seat_number < 10 ? `0${t.seat_number}` : t.seat_number}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-xs space-y-1 bg-muted/50 p-2.5 rounded-lg font-mono">
                                                <p className="font-bold text-foreground">
                                                    {t.trip?.origin} ➔ {t.trip?.destination}
                                                </p>
                                                <p className="text-muted-foreground text-[11px]">
                                                    Bus: {t.trip?.bus_number} • Departs: {new Date(t.trip?.departure_time).toLocaleString()}
                                                </p>
                                                <div className="flex justify-between pt-1 border-t text-[11px]">
                                                    <span>Source: <strong className="text-foreground">{t.booking_source}</strong></span>
                                                    <span>Fare Paid: <strong className="text-emerald-600">₱{t.total_price}.00</strong></span>
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setSelectedTicketForPrint(t)}
                                                    className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold"
                                                >
                                                    <Printer className="mr-1 h-3.5 w-3.5" />
                                                    Print Boarding Pass
                                                </Button>

                                                {!isCancelled && !isUsed && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedTicketForRebook(t);
                                                                setNewSeatInput(t.seat_number);
                                                                setSupervisorCode("");
                                                                setRebookError(null);
                                                            }}
                                                            className="text-xs font-bold"
                                                        >
                                                            <RotateCcw className="mr-1 h-3.5 w-3.5 text-blue-600" />
                                                            Rebook Seat
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedTicketForVoid(t)}
                                                            className="text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        >
                                                            <X className="mr-1 h-3.5 w-3.5" />
                                                            Void Ticket
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : lookupPerformed ? (
                        <Card className="p-8 text-center text-muted-foreground text-xs space-y-2">
                            <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
                            <p className="font-bold text-foreground">No matching ticket or passenger record found.</p>
                            <p>Verify that the token, passenger name spelling, or GCash reference number is accurate.</p>
                        </Card>
                    ) : null}
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: TODAY'S ISSUED TICKETS LOG                                          */}
            {/* ========================================================================= */}
            {activeTab === "issued" && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2">
                                <FileText className="h-5 w-5 text-red-600" />
                                Today&apos;s Counter Issued Tickets Log ({filteredIssuedTickets.length})
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Real-time audit of all physical and online tickets processed at this station counter.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchIssuedTickets}
                            disabled={loadingIssued}
                            className="text-xs font-semibold"
                        >
                            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingIssued ? "animate-spin" : ""}`} />
                            Refresh Log
                        </Button>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by passenger name, seat #, or token..."
                                value={issuedSearch}
                                onChange={(e) => setIssuedSearch(e.target.value)}
                                className="pl-9 text-xs"
                            />
                        </div>
                        <div className="flex gap-1 overflow-x-auto text-xs font-bold">
                            {(["ALL", "CASH", "ONLINE", "CANCELLED"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setIssuedFilter(mode)}
                                    className={`px-3 py-1.5 rounded-lg border transition-all ${
                                        issuedFilter === mode
                                            ? "bg-red-600 text-white border-red-600"
                                            : "bg-card text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {mode === "ALL" && `All (${issuedTickets.length})`}
                                    {mode === "CASH" && "Cash Only"}
                                    {mode === "ONLINE" && "Online GCash"}
                                    {mode === "CANCELLED" && "Voided / Cancelled"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table View */}
                    <Card className="border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/60 text-muted-foreground uppercase font-mono tracking-wider border-b">
                                    <tr className="text-left">
                                        <th className="p-3 w-16 text-center">Seat</th>
                                        <th className="p-3">Passenger Full Name</th>
                                        <th className="p-3">Route & Schedule</th>
                                        <th className="p-3">Source & Payment</th>
                                        <th className="p-3 font-mono">Ticket Token</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-right">Counter Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredIssuedTickets.length > 0 ? (
                                        filteredIssuedTickets.map((t) => {
                                            const isCancelled = t.booking_status === "CANCELLED" || t.ticket_status === "CANCELLED";

                                            return (
                                                <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                                                    <td className="p-3 text-center font-mono font-black text-sm text-red-600">
                                                        #{t.seat_number < 10 ? `0${t.seat_number}` : t.seat_number}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-foreground">{t.passenger_name}</div>
                                                        {t.passenger_contact && (
                                                            <div className="text-[10px] text-muted-foreground font-mono">{t.passenger_contact}</div>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-medium text-foreground">
                                                            {t.trip?.origin} ➔ {t.trip?.destination}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">
                                                            {new Date(t.trip?.departure_time).toLocaleDateString()} {new Date(t.trip?.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-bold text-emerald-600 font-mono">₱{t.total_price}.00</span>
                                                        <div className="text-[10px] text-muted-foreground uppercase">{t.booking_source} ({t.payment_method})</div>
                                                    </td>
                                                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                                                        {t.qr_token}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                isCancelled
                                                                    ? "bg-red-500/20 text-red-600 border border-red-500/30"
                                                                    : "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                                                            }`}
                                                        >
                                                            {isCancelled ? "VOIDED" : "VALID"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setSelectedTicketForPrint(t)}
                                                                className="h-7 text-xs px-2 font-bold"
                                                            >
                                                                <Printer className="h-3 w-3 mr-1" />
                                                                Print Stub
                                                            </Button>

                                                            {!isCancelled && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => setSelectedTicketForVoid(t)}
                                                                    className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No tickets found matching current search or filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: MID-SHIFT X-READING (SPOT CASH DRAWER AUDIT)                         */}
            {/* ========================================================================= */}
            {activeTab === "xreading" && (
                <div className="space-y-4">
                    <Card className="border-2 border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-blue-600" />
                                Mid-Shift Spot Cash Drawer Audit (X-Reading)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                An X-Reading performs an on-the-spot physical cash drawer reconciliation without closing the shift. Ideal for shift handovers, supervisor audits, or lunch break drawer inspections.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="p-4 rounded-xl border bg-muted/40">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Tickets Sold So Far</p>
                                    <p className="text-2xl font-black text-foreground mt-1">{shiftData.total_tickets} Tickets</p>
                                    <p className="text-[10px] text-muted-foreground">Current counter window total</p>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/40">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">System Expected Cash</p>
                                    <p className="text-2xl font-black text-emerald-600 mt-1">
                                        ₱{expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">Total cash collections minus discounts</p>
                                </div>
                                <div className="p-4 rounded-xl border bg-muted/40">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Counter Reading Status</p>
                                    <p className="text-base font-black text-blue-600 mt-1">ACTIVE / IN-PROGRESS</p>
                                    <p className="text-[10px] text-muted-foreground">{shiftData.counter_number || "Counter 02"}</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    size="lg"
                                    onClick={() => setOpenXReadingModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                    <Calculator className="mr-2 h-5 w-5" />
                                    Open X-Reading Spot Audit Modal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: OFFICIAL COUNTER BOARDING PASS / THERMAL TICKET STUB             */}
            {/* ========================================================================= */}
            {selectedTicketForPrint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-sm rounded-2xl border-2 border-zinc-700 bg-white text-zinc-950 p-6 shadow-2xl space-y-4 print:p-0 print:border-none print:shadow-none">
                        {/* Printable Ticket Header */}
                        <div className="text-center border-b pb-3 border-dashed border-zinc-400">
                            <h2 className="text-lg font-black tracking-tighter text-red-600 uppercase">
                                SUPERLINES TRANSPORT
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-600">OFFICIAL COUNTER BOARDING PASS</p>
                            <p className="text-[9px] font-mono text-zinc-500">{terminalName} • {shiftData.counter_number || "Counter 02"}</p>
                        </div>

                        {/* Passenger & Seat Focus */}
                        <div className="space-y-1.5 border-b pb-3 border-dashed border-zinc-400">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Passenger</span>
                                <span className="text-sm font-black text-black">{selectedTicketForPrint.passenger_name}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Seat Number</span>
                                <span className="text-2xl font-black font-mono text-red-600">
                                    #{selectedTicketForPrint.seat_number < 10 ? `0${selectedTicketForPrint.seat_number}` : selectedTicketForPrint.seat_number}
                                </span>
                            </div>
                        </div>

                        {/* Trip & Route Details */}
                        <div className="text-xs space-y-1 border-b pb-3 border-dashed border-zinc-400 font-mono">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Route:</span>
                                <span className="font-bold text-black">{selectedTicketForPrint.trip?.origin} ➔ {selectedTicketForPrint.trip?.destination}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Bus Unit:</span>
                                <span className="font-bold text-black">{selectedTicketForPrint.trip?.bus_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Departure:</span>
                                <span className="font-bold text-black">
                                    {new Date(selectedTicketForPrint.trip?.departure_time).toLocaleDateString()} {new Date(selectedTicketForPrint.trip?.departure_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-zinc-200">
                                <span className="text-zinc-500">Fare Paid:</span>
                                <span className="font-black text-emerald-700">₱{selectedTicketForPrint.total_price}.00 (PAID)</span>
                            </div>
                        </div>

                        {/* QR Code and Token */}
                        <div className="flex flex-col items-center justify-center pt-1">
                            <div className="h-28 w-28 bg-white p-2 border-2 border-black rounded">
                                <svg viewBox="0 0 100 100" className="h-full w-full">
                                    <rect width="100" height="100" fill="white" />
                                    <rect x="5" y="5" width="25" height="25" fill="black" />
                                    <rect x="8" y="8" width="19" height="19" fill="white" />
                                    <rect x="12" y="12" width="11" height="11" fill="black" />
                                    <rect x="70" y="5" width="25" height="25" fill="black" />
                                    <rect x="73" y="8" width="19" height="19" fill="white" />
                                    <rect x="77" y="12" width="11" height="11" fill="black" />
                                    <rect x="5" y="70" width="25" height="25" fill="black" />
                                    <rect x="8" y="73" width="19" height="19" fill="white" />
                                    <rect x="12" y="77" width="11" height="11" fill="black" />
                                    <rect x="35" y="10" width="10" height="10" fill="black" />
                                    <rect x="50" y="20" width="10" height="10" fill="black" />
                                    <rect x="35" y="35" width="20" height="20" fill="black" />
                                    <rect x="65" y="35" width="10" height="10" fill="black" />
                                    <rect x="40" y="65" width="15" height="15" fill="black" />
                                </svg>
                            </div>
                            <p className="mt-1 font-mono text-[11px] font-black">{selectedTicketForPrint.qr_token}</p>
                            <p className="text-[9px] text-zinc-500 text-center mt-1">
                                Present this ticket stub to Conductor upon bus entry.
                            </p>
                        </div>

                        {/* Print / Close Actions */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t print:hidden">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTicketForPrint(null)}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => window.print()}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                Print Boarding Stub
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: OVER-THE-COUNTER SEAT REBOOKING                                   */}
            {/* ========================================================================= */}
            {selectedTicketForRebook && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md rounded-2xl border-2 border-border bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-5 w-5 text-blue-600" />
                                <h3 className="font-bold text-foreground">Rebook / Change Passenger Seat</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTicketForRebook(null)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="text-xs bg-muted/60 p-3 rounded-xl space-y-1 font-mono">
                            <p><strong>Passenger:</strong> {selectedTicketForRebook.passenger_name}</p>
                            <p><strong>Current Seat:</strong> #{selectedTicketForRebook.seat_number}</p>
                            <p><strong>Ticket Token:</strong> {selectedTicketForRebook.qr_token}</p>
                        </div>

                        <form onSubmit={handleConfirmRebook} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">Select New Seat Number (1 - 45)</Label>
                                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-xl bg-muted/30">
                                    {Array.from({ length: 45 }).map((_, i) => {
                                        const s = i + 1;
                                        const isSelected = newSeatInput === s;
                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setNewSeatInput(s)}
                                                className={`h-9 rounded-lg font-mono font-bold text-xs border transition-all ${
                                                    isSelected
                                                        ? "bg-blue-600 text-white border-blue-600 shadow"
                                                        : "bg-background text-foreground hover:bg-muted border-border"
                                                }`}
                                            >
                                                #{s < 10 ? `0${s}` : s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 🔒 Head Supervisor Authorization Security Override Section */}
                            <div className="rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-black uppercase text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                                        Head Supervisor Authorization Code *
                                    </Label>
                                    <span className="text-[9px] font-mono bg-amber-600/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-black border border-amber-500/30">
                                        SUPERVISOR OVERRIDE
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Counter Security Policy: Over-the-counter rebooking requires on-duty Head Supervisor authorization to prevent unauthorized seat swapping.
                                </p>
                                <Input
                                    type="password"
                                    required
                                    placeholder="Enter Supervisor PIN / Code (e.g. SUP8888)"
                                    value={supervisorCode}
                                    onChange={(e) => {
                                        setSupervisorCode(e.target.value.toUpperCase());
                                        setRebookError(null);
                                    }}
                                    className="bg-background text-sm font-mono tracking-widest font-black uppercase border-amber-500/50"
                                />
                                {rebookError && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{rebookError}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedTicketForRebook(null);
                                        setSupervisorCode("");
                                        setRebookError(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={rebookLoading || !supervisorCode.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                    {rebookLoading ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
                                    Authorize & Re-seat to #{newSeatInput}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: OVER-THE-COUNTER TICKET VOID / CANCELLATION                       */}
            {/* ========================================================================= */}
            {selectedTicketForVoid && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md rounded-2xl border-2 border-red-500/50 bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                <h3 className="font-bold">Confirm Counter Ticket Void</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTicketForVoid(null)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Voiding this ticket will mark it as <strong>CANCELLED</strong> and immediately release Seat #{selectedTicketForVoid.seat_number} back to public availability for other passengers.
                        </p>

                        <div className="text-xs bg-muted/60 p-3 rounded-xl space-y-1 font-mono">
                            <p><strong>Passenger:</strong> {selectedTicketForVoid.passenger_name}</p>
                            <p><strong>Seat:</strong> #{selectedTicketForVoid.seat_number}</p>
                            <p><strong>Amount:</strong> ₱{selectedTicketForVoid.total_price}.00</p>
                            <p><strong>Token:</strong> {selectedTicketForVoid.qr_token}</p>
                        </div>

                        <form onSubmit={handleConfirmVoid} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">Cancellation / Void Reason</Label>
                                <select
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="Passenger requested cancellation/refund before trip">Passenger requested cancellation/refund</option>
                                    <option value="Duplicate booking / Mistaken seat selection">Duplicate booking / Mistaken seat selection</option>
                                    <option value="Trip rescheduled / Passenger unable to travel">Trip rescheduled / Passenger unable to travel</option>
                                    <option value="Counter cashier clerical correction">Counter cashier clerical correction</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedTicketForVoid(null)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={voidLoading}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                >
                                    {voidLoading ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <X className="mr-1.5 h-4 w-4" />}
                                    Confirm Ticket Void
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: MID-SHIFT X-READING CASH AUDIT MODAL                              */}
            {/* ========================================================================= */}
            {openXReadingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
                    <div className="w-full max-w-2xl rounded-2xl border-2 border-border bg-card p-6 text-foreground shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-6 w-6 text-blue-600" />
                                <div>
                                    <h3 className="text-lg font-black uppercase text-foreground">
                                        Mid-Shift Cash Drawer X-Reading (Spot Audit)
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Does not reset or close the shift. Provides a point-in-time cash audit for supervisor inspection.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpenXReadingModal(false)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Summary Snapshot */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 p-3 rounded-xl border text-xs">
                            <div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Terminal</span>
                                <p className="font-bold truncate">{terminalName}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Counter / Teller</span>
                                <p className="font-bold">{shiftData.counter_number || "Counter 02"}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Tickets Sold</span>
                                <p className="font-bold text-blue-600 font-mono">{shiftData.total_tickets} tickets</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Expected Cash</span>
                                <p className="font-bold text-emerald-600 font-mono">₱{expectedCash.toLocaleString()}.00</p>
                            </div>
                        </div>

                        {/* Denomination Counter Inputs */}
                        <form onSubmit={handleSaveXReading} className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-foreground">
                                        Physical Cash Drawer Denomination Breakdown
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleAutoFillExact}
                                        className="h-6 text-[11px] text-blue-600 hover:text-blue-700"
                                    >
                                        Auto-Fill Exact Match
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱1,000 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={thousands}
                                            onChange={(e) => setThousands(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(thousands * 1000).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱500 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={fiveHundreds}
                                            onChange={(e) => setFiveHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(fiveHundreds * 500).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱200 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={twoHundreds}
                                            onChange={(e) => setTwoHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(twoHundreds * 200).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱100 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={hundreds}
                                            onChange={(e) => setHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(hundreds * 100).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱50 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={fifties}
                                            onChange={(e) => setFifties(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(fifties * 50).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱20 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={twenties}
                                            onChange={(e) => setTwenties(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(twenties * 20).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background col-span-2">
                                        <label className="text-[10px] font-bold text-muted-foreground">Loose Coins (₱)</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={coins}
                                            onChange={(e) => setCoins(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{coins.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Total vs Variance */}
                            <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl border bg-muted/60 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Total Physical Cash Counted:</span>
                                    <span className="ml-2 font-mono font-black text-lg text-foreground">
                                        ₱{totalCounted.toLocaleString()}.00
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Drawer Variance:</span>
                                    <span
                                        className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                                            variance === 0
                                                ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                                                : variance > 0
                                                ? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                                                : "bg-red-500/20 text-red-600 border border-red-500/30"
                                        }`}
                                    >
                                        {variance === 0 ? "EXACT (₱0.00)" : variance > 0 ? `+₱${variance.toLocaleString()} OVER` : `-₱${Math.abs(variance).toLocaleString()} SHORT`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenXReadingModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                    <Printer className="mr-1.5 h-4 w-4" />
                                    Generate & Print X-Reading Slip
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* PRINTABLE X-READING SPOT AUDIT SLIP                                        */}
            {/* ========================================================================= */}
            {xReadingSlip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-sm rounded-2xl border-2 border-zinc-700 bg-white text-zinc-950 p-6 shadow-2xl space-y-4 print:p-0 print:border-none print:shadow-none">
                        <div className="text-center border-b pb-3 border-dashed border-zinc-400">
                            <h2 className="text-lg font-black tracking-tight text-red-600 uppercase">
                                SUPERLINES TRANSPORT
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-700">MID-SHIFT SPOT CASH AUDIT (X-READING)</p>
                            <p className="text-[9px] font-mono text-zinc-500">{xReadingSlip.id} • {new Date(xReadingSlip.timestamp).toLocaleString()}</p>
                        </div>

                        <div className="text-xs space-y-1 border-b pb-3 border-dashed border-zinc-400 font-mono">
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Terminal:</span>
                                <span className="font-bold text-black">{xReadingSlip.terminal_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Counter / Teller:</span>
                                <span className="font-bold text-black">{xReadingSlip.counter_number} • {xReadingSlip.teller_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Tickets Issued:</span>
                                <span className="font-bold text-black">{xReadingSlip.total_tickets}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Expected Cash:</span>
                                <span className="font-bold text-black">₱{xReadingSlip.net_cash_expected.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Physical Count:</span>
                                <span className="font-bold text-black">₱{xReadingSlip.total_cash_counted.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-zinc-300">
                                <span className="font-bold text-zinc-700">Drawer Variance:</span>
                                <span className="font-black text-black">
                                    {xReadingSlip.variance === 0 ? "₱0.00 (EXACT)" : `₱${xReadingSlip.variance.toLocaleString()}`}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-6 pt-3 text-[10px]">
                            <div>
                                <div className="border-b border-black w-full mt-4"></div>
                                <p className="font-bold text-center mt-1 uppercase">Teller / Cashier On-Duty</p>
                            </div>
                            <div>
                                <div className="border-b border-black w-full mt-4"></div>
                                <p className="font-bold text-center mt-1 uppercase">Audited By: Terminal Supervisor / Inspector</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t print:hidden">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setXReadingSlip(null)}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => window.print()}
                                className="bg-zinc-900 text-white font-bold"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                Print X-Reading Slip
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 5: END-OF-SHIFT Z-READING REMITTANCE DIALOG                          */}
            {/* ========================================================================= */}
            {openRemittanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
                    <div className="w-full max-w-2xl rounded-2xl border-2 border-border bg-card p-6 text-foreground shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <Banknote className="h-6 w-6 text-amber-600" />
                                <div>
                                    <h3 className="text-lg font-black uppercase text-foreground">
                                        Teller End-of-Shift Cash Remittance (Z-Reading)
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Shift cash drawer reconciliation, denomination count, and turnover to head cashier.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpenRemittanceModal(false)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Shift Summary Banner */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-muted/50 p-3 rounded-xl border text-xs">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Shift & Station</span>
                                <p className="font-extrabold text-foreground truncate">{terminalName}</p>
                                <p className="text-[10px] text-muted-foreground">{shiftData.counter_number || "Counter 02"}</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Tickets</span>
                                <p className="font-mono text-base font-black text-foreground">{shiftData.total_tickets} Tickets</p>
                                <p className="text-[10px] text-muted-foreground">Walk-in passengers</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Discounts Granted</span>
                                <p className="font-mono text-base font-black text-purple-600">-₱{shiftData.total_discounts.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">Senior/Student/PWD</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Expected Cash Drop</span>
                                <p className="font-mono text-base font-black text-emerald-600">₱{expectedCash.toLocaleString()}.00</p>
                                <p className="text-[10px] text-muted-foreground">Net cash in drawer</p>
                            </div>
                        </div>

                        {/* Denomination Counter Inputs */}
                        <form onSubmit={handleConfirmRemittance} className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-foreground">
                                        Physical Cash Drawer Denomination Count
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleAutoFillExact}
                                        className="h-6 text-[11px] text-amber-600 hover:text-amber-700"
                                    >
                                        Auto-Fill Exact Match
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱1,000 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={thousands}
                                            onChange={(e) => setThousands(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(thousands * 1000).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱500 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={fiveHundreds}
                                            onChange={(e) => setFiveHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(fiveHundreds * 500).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱200 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={twoHundreds}
                                            onChange={(e) => setTwoHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(twoHundreds * 200).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱100 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={hundreds}
                                            onChange={(e) => setHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(hundreds * 100).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱50 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={fifties}
                                            onChange={(e) => setFifties(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(fifties * 50).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background">
                                        <label className="text-[10px] font-bold text-muted-foreground">₱20 Bills</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={twenties}
                                            onChange={(e) => setTwenties(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{(twenties * 20).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-2 border rounded-lg bg-background col-span-2">
                                        <label className="text-[10px] font-bold text-muted-foreground">Loose Coins (₱)</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={coins}
                                            onChange={(e) => setCoins(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-mono mt-1"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-0.5 text-right font-mono">
                                            = ₱{coins.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Total vs Variance */}
                            <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded-xl border bg-muted/60 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Total Physical Cash Counted:</span>
                                    <span className="ml-2 font-mono font-black text-lg text-foreground">
                                        ₱{totalCounted.toLocaleString()}.00
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Turnover Variance:</span>
                                    <span
                                        className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                                            variance === 0
                                                ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                                                : variance > 0
                                                ? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                                                : "bg-red-500/20 text-red-600 border border-red-500/30"
                                        }`}
                                    >
                                        {variance === 0 ? "EXACT (₱0.00)" : variance > 0 ? `+₱${variance.toLocaleString()} OVER` : `-₱${Math.abs(variance).toLocaleString()} SHORT`}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenRemittanceModal(false)}
                                    disabled={submittingRemit}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submittingRemit}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                >
                                    {submittingRemit ? (
                                        <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-1.5 h-4 w-4" />
                                    )}
                                    Confirm Shift Close & Print Slip
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* PRINTABLE Z-READING REMITTANCE SLIP                                        */}
            {/* ========================================================================= */}
            {remittanceSlip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md rounded-2xl border-2 border-zinc-700 bg-white text-zinc-950 p-6 shadow-2xl space-y-4 print:p-0 print:border-none print:shadow-none">
                        <div className="text-center border-b pb-3 border-dashed border-zinc-400">
                            <h2 className="text-xl font-black tracking-tight text-red-600 uppercase">
                                SUPERLINES TRANSPORT
                            </h2>
                            <p className="text-xs font-bold text-zinc-700">OFFICIAL TELLER CASH REMITTANCE SLIP (Z-READING)</p>
                            <p className="text-[10px] font-mono text-zinc-500">{remittanceSlip.id} • {new Date(remittanceSlip.timestamp).toLocaleString()}</p>
                        </div>

                        <div className="text-xs space-y-1.5 border-b pb-3 border-dashed border-zinc-400 font-mono">
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Terminal:</span>
                                <span className="font-bold text-black">{remittanceSlip.terminal_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Counter & Shift:</span>
                                <span className="font-bold text-black">{remittanceSlip.counter_number} • 8-Hour Shift</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Teller In-Charge:</span>
                                <span className="font-bold text-black">{remittanceSlip.teller_name}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-zinc-200">
                                <span className="text-zinc-600">Tickets Issued:</span>
                                <span className="font-bold text-black">{remittanceSlip.total_tickets}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Expected Net Cash:</span>
                                <span className="font-bold text-black">₱{remittanceSlip.net_cash_expected.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">Turned Over Cash:</span>
                                <span className="font-black text-black text-sm">₱{remittanceSlip.total_cash_counted.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-zinc-200">
                                <span className="font-bold text-zinc-700">Variance:</span>
                                <span className="font-black text-black">
                                    {remittanceSlip.variance === 0 ? "₱0.00 (EXACT)" : `₱${remittanceSlip.variance.toLocaleString()}`}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-8 pt-4 text-[10px]">
                            <div>
                                <div className="border-b border-black w-full mt-4"></div>
                                <p className="font-bold text-center mt-1 uppercase">Remitted By: Teller / Cashier (Signature)</p>
                            </div>
                            <div>
                                <div className="border-b border-black w-full mt-4"></div>
                                <p className="font-bold text-center mt-1 uppercase">Received & Verified By: Head Cashier / Vault Supervisor</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t print:hidden">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRemittanceSlip(null)}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => window.print()}
                                className="bg-zinc-900 text-white font-bold"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                Print Remittance Slip
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
