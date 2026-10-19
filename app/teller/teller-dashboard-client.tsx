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
    Calculator
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
    const [trips] = useState<any[]>(initialTrips);
    const [walkInCount, setWalkInCount] = useState<number>(initialWalkInCount || 35);
    const [openRemittanceModal, setOpenRemittanceModal] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [submittingRemit, setSubmittingRemit] = useState(false);

    // Z-Reading Data
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

    // Denominations Counter
    const [thousands, setThousands] = useState<number>(25);
    const [fiveHundreds, setFiveHundreds] = useState<number>(8);
    const [twoHundreds, setTwoHundreds] = useState<number>(2);
    const [hundreds, setHundreds] = useState<number>(3);
    const [fifties, setFifties] = useState<number>(1);
    const [twenties, setTwenties] = useState<number>(0);
    const [coins, setCoins] = useState<number>(0);
    const [notes, setNotes] = useState<string>("Shift handover to Vault / Head Cashier");

    // Success Remittance Slip State
    const [remittanceSlip, setRemittanceSlip] = useState<any | null>(null);

    // Compute Actual Counted Cash
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
    }, []);

    const fetchShiftMetrics = async () => {
        setLoadingData(true);
        try {
            const res = await fetch("/api/teller/remittance");
            const data = await res.json();
            if (res.ok && data.shift) {
                setShiftData(data.shift);
                setWalkInCount(data.shift.total_tickets);
            }
        } catch (err) {
            console.error("Failed to load shift metrics:", err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleAutoFillExact = () => {
        // Automatically fills denominations to match exact ₱29,750 or expectedCash
        setThousands(25);      // 25,000
        setFiveHundreds(8);    // 4,000  -> 29,000
        setTwoHundreds(2);     // 400    -> 29,400
        setHundreds(3);        // 300    -> 29,700
        setFifties(1);         // 50     -> 29,750
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
                coins
            },
            notes: notes
        };

        try {
            const res = await fetch("/api/teller/remittance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.remittance) {
                setRemittanceSlip(data.remittance);
                setOpenRemittanceModal(false);
            } else {
                alert(data.error || "Failed to record remittance.");
            }
        } catch (err: any) {
            alert("Error submitting remittance: " + err.message);
        } finally {
            setSubmittingRemit(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                        <Banknote className="h-8 w-8 text-emerald-600" />
                        Teller Terminal Counter
                    </h1>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        Process walk-in ticket sales, manage active terminal departures, and perform end-of-shift Z-Reading cash drop.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* End-of-Shift Cash Remittance Button */}
                    <Button
                        size="lg"
                        variant="default"
                        onClick={() => {
                            fetchShiftMetrics();
                            setOpenRemittanceModal(true);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20"
                    >
                        <Banknote className="mr-2 h-5 w-5" />
                        Close Shift & Remit Cash (Z-Reading)
                    </Button>

                    <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md">
                        <Link href="/teller/walk-in">
                            <Ticket className="mr-2 h-5 w-5" />
                            New Walk-in Booking
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Shift Overview Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* Expected Cash in Drawer */}
                <Card className="border-l-4 border-l-emerald-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                            <span>Cash Drawer to Turnover</span>
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-emerald-600">
                            ₱{expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Net physical cash collected this shift</p>
                    </CardContent>
                </Card>

                {/* Walk-in Tickets Sold */}
                <Card className="border-l-4 border-l-blue-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                            <span>Tickets Sold Today</span>
                            <Ticket className="h-4 w-4 text-blue-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-blue-600">
                            {shiftData.total_tickets || 35} Tickets
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Counter walk-in passengers processed</p>
                    </CardContent>
                </Card>

                {/* Statutory Discounts Subsidized */}
                <Card className="border-l-4 border-l-purple-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                            <span>20% Discounts Granted</span>
                            <PercentIcon className="h-4 w-4 text-purple-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-purple-600">
                            -₱{shiftData.total_discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            {shiftData.senior_count + shiftData.student_count + shiftData.pwd_count} Senior/Student/PWD subsidized
                        </p>
                    </CardContent>
                </Card>

                {/* Station & Shift Info */}
                <Card className="border-l-4 border-l-zinc-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                            <span>Shift & Station</span>
                            <Building2 className="h-4 w-4 text-zinc-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-sm font-black text-foreground">{terminalName}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            {shiftData.counter_number || "Counter 02"} • {tellerName}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Departure Schedules */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">Upcoming Departure Schedules</CardTitle>
                            <CardDescription className="text-xs">Select a trip to process walk-in ticket sales or audit seat manifests.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/teller/manifest">View Full Manifests</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {trips && trips.length > 0 ? (
                            trips.map((t: any) => {
                                const origin = t.route?.origin?.name || "Cubao";
                                const dest = t.route?.destination?.name || "Daet";
                                const busNum = t.bus?.bus_number || "Superlines Express";
                                const depTime = new Date(t.departure_time);

                                return (
                                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold">
                                                <Bus className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base flex items-center gap-2">
                                                    <span>{origin}</span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    <span>{dest}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    Bus: <span className="font-semibold text-foreground">{busNum}</span> • Departure: {depTime.toLocaleDateString()} {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Fare: ₱{t.fare_amount || 850}.00
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/teller/manifest?trip_id=${t.id}`}>Manifest</Link>
                                            </Button>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" asChild>
                                                <Link href={`/teller/walk-in?trip_id=${t.id}`}>Book Walk-in</Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">No upcoming departure schedules found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ========================================================================= */}
            {/* MODAL 1: Z-READING & CASH REMITTANCE DIALOG                                */}
            {/* ========================================================================= */}
            {openRemittanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
                    <div className="w-full max-w-2xl rounded-2xl border-2 border-zinc-700 bg-background p-6 text-foreground shadow-2xl space-y-4 my-8">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                                    <Banknote className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
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
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Station & Teller Badge */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/60 p-3 rounded-xl border text-xs font-mono">
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Station / Terminal</span>
                                <span className="font-bold text-foreground">{terminalName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Teller In-Charge</span>
                                <span className="font-bold text-foreground">{tellerName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Counter Station</span>
                                <span className="font-bold text-foreground">{shiftData.counter_number || "Counter 02"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Shift Duration</span>
                                <span className="font-bold text-emerald-600">8-Hour Shift</span>
                            </div>
                        </div>

                        {/* Z-Reading Financial Summary Card */}
                        <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2">
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                    Official System Sales Audit Summary
                                </span>
                                <span className="text-xs font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded">
                                    {shiftData.total_tickets} Tickets Sold
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-1">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase">Gross Ticket Sales:</span>
                                    <p className="font-bold text-sm">₱{shiftData.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] text-purple-600 uppercase">20% Statutory Deductions:</span>
                                    <p className="font-bold text-sm text-purple-600">-₱{shiftData.total_discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Net Expected Cash:</span>
                                    <p className="font-black text-lg text-emerald-600">₱{expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>

                        {/* Physical Cash Denomination Counter */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
                                    <Calculator className="h-4 w-4 text-blue-600" />
                                    Physical Cash Denomination Count (Drawer Breakdown)
                                </span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAutoFillExact}
                                    className="h-6 text-[10px] border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                >
                                    Auto-fill Exact Balanced (₱{expectedCash.toLocaleString()})
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                {/* ₱1,000 */}
                                <div className="p-2 rounded-lg border bg-muted/30 space-y-1">
                                    <span className="font-bold text-blue-600 block">₱1,000 Bills</span>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={thousands}
                                            onChange={(e) => setThousands(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-bold"
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block text-right font-semibold">
                                        = ₱{(thousands * 1000).toLocaleString()}
                                    </span>
                                </div>

                                {/* ₱500 */}
                                <div className="p-2 rounded-lg border bg-muted/30 space-y-1">
                                    <span className="font-bold text-amber-600 block">₱500 Bills</span>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={fiveHundreds}
                                            onChange={(e) => setFiveHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-bold"
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block text-right font-semibold">
                                        = ₱{(fiveHundreds * 500).toLocaleString()}
                                    </span>
                                </div>

                                {/* ₱200 */}
                                <div className="p-2 rounded-lg border bg-muted/30 space-y-1">
                                    <span className="font-bold text-green-600 block">₱200 Bills</span>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={twoHundreds}
                                            onChange={(e) => setTwoHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-bold"
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block text-right font-semibold">
                                        = ₱{(twoHundreds * 200).toLocaleString()}
                                    </span>
                                </div>

                                {/* ₱100 */}
                                <div className="p-2 rounded-lg border bg-muted/30 space-y-1">
                                    <span className="font-bold text-purple-600 block">₱100 Bills</span>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={hundreds}
                                            onChange={(e) => setHundreds(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-8 text-xs font-bold"
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block text-right font-semibold">
                                        = ₱{(hundreds * 100).toLocaleString()}
                                    </span>
                                </div>

                                {/* ₱50 */}
                                <div className="p-2 rounded-lg border bg-muted/30 space-y-1">
                                    <span className="font-bold text-red-600 block">₱50 Bills</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={fifties}
                                        onChange={(e) => setFifties(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="h-8 text-xs font-bold"
                                    />
                                    <span className="text-[10px] text-muted-foreground block text-right font-semibold">
                                        = ₱{(fifties * 50).toLocaleString()}
                                    </span>
                                </div>

                                {/* ₱20 */}
                                <div className="p-2 rounded-lg border bg-muted/30 space-y-1">
                                    <span className="font-bold text-orange-600 block">₱20 Bills</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={twenties}
                                        onChange={(e) => setTwenties(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="h-8 text-xs font-bold"
                                    />
                                    <span className="text-[10px] text-muted-foreground block text-right font-semibold">
                                        = ₱{(twenties * 20).toLocaleString()}
                                    </span>
                                </div>

                                {/* Coins */}
                                <div className="p-2 rounded-lg border bg-muted/30 space-y-1 col-span-2">
                                    <span className="font-bold text-zinc-500 block">Coins / Small Change</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={coins}
                                        onChange={(e) => setCoins(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="h-8 text-xs font-bold"
                                    />
                                    <span className="text-[10px] text-muted-foreground block text-right font-semibold">
                                        = ₱{coins.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Variance & Reconciliation Status Box */}
                        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                            variance === 0
                                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-800 dark:text-emerald-300"
                                : variance > 0
                                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-400 text-blue-800 dark:text-blue-300"
                                : "bg-red-50 dark:bg-red-950/30 border-red-400 text-red-800 dark:text-red-300"
                        }`}>
                            <div>
                                <span className="font-bold block text-sm">
                                    Total Physical Cash Counted: ₱{totalCounted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[11px] opacity-90">
                                    System Expected Cash: ₱{expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-sm block">
                                    {variance === 0
                                        ? "✓ EXACT BALANCED"
                                        : variance > 0
                                        ? `+ OVER ₱${variance.toLocaleString()}`
                                        : `- SHORT ₱${Math.abs(variance).toLocaleString()}`}
                                </span>
                                <span className="text-[10px] uppercase font-bold opacity-80">
                                    Variance Discrepancy
                                </span>
                            </div>
                        </div>

                        {/* Remittance Notes */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-muted-foreground">Shift Turnover Notes</Label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g., Shift handover to Night Cashier Roberto / Vault deposit"
                                className="h-8 text-xs"
                            />
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpenRemittanceModal(false)}
                                disabled={submittingRemit}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConfirmRemittance}
                                disabled={submittingRemit}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                            >
                                {submittingRemit ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Confirm Remittance & Print Z-Reading Slip
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: OFFICIAL PRINTABLE Z-READING REMITTANCE SLIP                     */}
            {/* ========================================================================= */}
            {remittanceSlip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
                    <div className="w-full max-w-md rounded-2xl border-2 border-zinc-700 bg-white text-black p-6 shadow-2xl space-y-4 my-8 font-sans">
                        {/* Header */}
                        <div className="text-center border-b-2 border-black pb-3">
                            <h2 className="text-xl font-black uppercase text-red-600 tracking-wider">SUPERLINES TRANSPORTATION CO., INC.</h2>
                            <p className="text-xs font-bold uppercase">Official Cashier Z-Reading & Remittance Slip</p>
                            <p className="text-[10px] text-zinc-600">Terminal Cashiering & Shift Handover Receipt</p>
                        </div>

                        {/* Slip Metadata */}
                        <div className="text-xs font-mono space-y-1 border-b pb-3">
                            <div className="flex justify-between">
                                <span className="text-zinc-600">SLIP REF #:</span>
                                <span className="font-bold">{remittanceSlip.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">DATE & TIME:</span>
                                <span className="font-bold">{new Date(remittanceSlip.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">TERMINAL:</span>
                                <span className="font-bold">{remittanceSlip.terminal_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">CASHIER / TELLER:</span>
                                <span className="font-bold">{remittanceSlip.teller_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-600">COUNTER:</span>
                                <span className="font-bold">{remittanceSlip.counter_number}</span>
                            </div>
                        </div>

                        {/* Financial Audit */}
                        <div className="text-xs font-mono space-y-1.5 border-b pb-3">
                            <div className="flex justify-between">
                                <span>TOTAL TICKETS SOLD:</span>
                                <span className="font-bold">{remittanceSlip.total_tickets}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GROSS FARE SALES:</span>
                                <span>₱{remittanceSlip.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-purple-700 font-bold">
                                <span>20% STATUTORY DISCOUNTS:</span>
                                <span>-₱{remittanceSlip.total_discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 font-bold">
                                <span>NET EXPECTED CASH:</span>
                                <span>₱{remittanceSlip.net_cash_expected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-black text-sm pt-0.5">
                                <span>ACTUAL CASH REMITTED:</span>
                                <span>₱{remittanceSlip.total_cash_counted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold">
                                <span>VARIANCE:</span>
                                <span className={remittanceSlip.variance === 0 ? "text-emerald-700" : "text-red-600"}>
                                    {remittanceSlip.variance === 0 ? "EXACT (₱0.00)" : `₱${remittanceSlip.variance.toLocaleString()}`}
                                </span>
                            </div>
                        </div>

                        {/* Denomination Breakdown */}
                        <div className="text-[11px] font-mono border-b pb-3 space-y-0.5">
                            <p className="font-bold text-[10px] uppercase text-zinc-600 mb-1">Bill Breakdown:</p>
                            <div className="grid grid-cols-2 gap-x-4">
                                <div>₱1,000 x {remittanceSlip.denominations.thousands} = ₱{(remittanceSlip.denominations.thousands * 1000).toLocaleString()}</div>
                                <div>₱500 x {remittanceSlip.denominations.fiveHundreds} = ₱{(remittanceSlip.denominations.fiveHundreds * 500).toLocaleString()}</div>
                                <div>₱200 x {remittanceSlip.denominations.twoHundreds} = ₱{(remittanceSlip.denominations.twoHundreds * 200).toLocaleString()}</div>
                                <div>₱100 x {remittanceSlip.denominations.hundreds} = ₱{(remittanceSlip.denominations.hundreds * 100).toLocaleString()}</div>
                                <div>₱50 x {remittanceSlip.denominations.fifties} = ₱{(remittanceSlip.denominations.fifties * 50).toLocaleString()}</div>
                                <div>Coins/Small = ₱{remittanceSlip.denominations.coins.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="pt-2 space-y-6 text-xs">
                            <div>
                                <div className="border-b border-black w-full mt-6"></div>
                                <p className="font-bold text-center mt-1 uppercase text-[10px]">
                                    Remitted By: {remittanceSlip.teller_name} (Cashier)
                                </p>
                            </div>
                            <div>
                                <div className="border-b border-black w-full mt-6"></div>
                                <p className="font-bold text-center mt-1 uppercase text-[10px]">
                                    Received & Verified By: Head Cashier / Terminal Supervisor
                                </p>
                            </div>
                        </div>

                        {/* Print & Dismiss Actions */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t print:hidden">
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

function PercentIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="19" x2="5" y1="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    );
}
