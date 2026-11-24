"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Printer,
    Bus,
    Calendar,
    Clock,
    DoorOpen,
    Bath,
    Check,
    AlertCircle,
    User,
    CheckCircle2,
    ShieldCheck,
    X,
    Filter,
    ArrowRight
} from "lucide-react";
import { BusClassificationBadge } from "@/components/bus-classification-badge";
import {
    SUPERLINES_BUS_CLASSIFICATIONS,
    getBusClassification,
    BusClassification,
    SeatGridCell,
    isPwdPrioritySeat,
    PWD_PRIORITY_SEATS
} from "@/lib/constants/bus-layouts";

export interface ManifestBooking {
    id: string;
    seat_number: number;
    passenger_name: string;
    passenger_contact?: string;
    booking_source?: string;
    booking_status?: string;
    payment_status?: string;
    ticket_status?: string;
    qr_token?: string;
    created_at?: string;
    total_price?: number;
    pickup_location?: string;
    is_discounted?: boolean;
    passenger_type?: string;
    discount_id?: string;
    discounted_passengers?: Array<{
        name: string;
        classification: string;
        id_number: string;
    }>;
    booking_terminal?: {
        name: string;
    } | null;
    ticket?: {
        qr_token: string;
        ticket_status: string;
    } | null;
}

export interface TripInfo {
    id: string;
    departure_time: string;
    fare_amount?: number;
    price?: number;
    origin?: string;
    destination?: string;
    status?: string;
    bus?: {
        bus_number?: string;
        bus_type?: string;
        seat_capacity?: number;
    } | null;
    route?: {
        origin?: { name: string } | null;
        destination?: { name: string } | null;
    } | null;
}

export interface PassengerManifestProps {
    trip: TripInfo;
    bookings: ManifestBooking[];
    role?: "ADMIN" | "CONDUCTOR" | "TELLER";
    onMarkBoarded?: (qrToken: string, seatNumber: number) => Promise<void> | void;
    pairedTrip?: TripInfo | null;
    inboundBookings?: ManifestBooking[];
    onClose?: () => void;
}

export function PassengerManifest({
    trip,
    bookings,
    role = "TELLER",
    onMarkBoarded,
    pairedTrip,
    inboundBookings = [],
    onClose
}: PassengerManifestProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSource, setFilterSource] = useState<"ALL" | "ONLINE" | "WALK_IN">("ALL");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "BOARDED" | "PAID" | "DISCOUNTED">("ALL");
    const [selectedSeatPreview, setSelectedSeatPreview] = useState<ManifestBooking | null>(null);
    const [inspectedSeatNumber, setInspectedSeatNumber] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Classification layout based on trip bus type
    const busType = trip.bus?.bus_type;
    const busNum = trip.bus?.bus_number || "Bus TBD";
    const [manifestLayout, setManifestLayout] = useState<BusClassification>(() =>
        getBusClassification(busType, busNum)
    );

    const originName = trip.origin || trip.route?.origin?.name || "Origin";
    const destName = trip.destination || trip.route?.destination?.name || "Destination";
    const tripDate = new Date(trip.departure_time);

    // Filtered bookings for the roster table
    const filteredBookings = bookings.filter((b) => {
        const token = b.qr_token || b.ticket?.qr_token || "";
        const matchesSearch =
            b.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.seat_number.toString().includes(searchTerm) ||
            token.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.passenger_contact && b.passenger_contact.includes(searchTerm));

        const source = b.booking_source?.toUpperCase() || "WALK_IN";
        const matchesSource =
            filterSource === "ALL" ||
            (filterSource === "ONLINE" && source.includes("ONLINE")) ||
            (filterSource === "WALK_IN" && !source.includes("ONLINE"));

        const isBoarded = b.ticket_status === "USED" || b.ticket?.ticket_status === "USED";
        const isDiscounted = b.is_discounted || (b.discounted_passengers && b.discounted_passengers.length > 0);

        let matchesStatus = true;
        if (filterStatus === "BOARDED") matchesStatus = isBoarded;
        else if (filterStatus === "PAID") matchesStatus = !isBoarded;
        else if (filterStatus === "DISCOUNTED") matchesStatus = Boolean(isDiscounted);

        return matchesSearch && matchesSource && matchesStatus;
    });

    const boardedCount = bookings.filter(
        (b) => b.ticket_status === "USED" || b.ticket?.ticket_status === "USED"
    ).length;
    const bookedCount = bookings.length;
    const capacity = manifestLayout.capacity || trip.bus?.seat_capacity || 49;
    const freeCount = Math.max(0, capacity - bookedCount);

    const handlePrint = () => {
        window.print();
    };

    const handleBoardAction = async (token: string, seatNum: number) => {
        if (!onMarkBoarded) return;
        setActionLoading(token);
        try {
            await onMarkBoarded(token, seatNum);
            // Optimistically update preview if currently selected
            if (selectedSeatPreview && selectedSeatPreview.seat_number === seatNum) {
                setSelectedSeatPreview({
                    ...selectedSeatPreview,
                    ticket_status: "USED",
                    ticket: selectedSeatPreview.ticket ? { ...selectedSeatPreview.ticket, ticket_status: "USED" } : undefined
                });
            }
        } finally {
            setActionLoading(null);
        }
    };

    const renderSeatCell = (cell: SeatGridCell, isBackRow = false) => {
        if (!cell || cell.type === "empty") {
            return <div className="h-11 w-11 sm:h-12 sm:w-12" />;
        }

        if (cell.type === "cr") {
            return (
                <div
                    className="flex h-11 w-[96px] sm:h-12 sm:w-[104px] items-center justify-center rounded-lg bg-[#4A7BB0] text-white font-black text-[10px] sm:text-[11px] shadow-sm gap-1 border border-[#3A6B9E] select-none print:bg-zinc-200 print:text-black print:border-black"
                    title="Comfort Room (Restroom)"
                >
                    <Bath className="h-3.5 w-3.5 shrink-0" />
                    <span className="tracking-tighter">COMFORT ROOM</span>
                </div>
            );
        }

        if (cell.type === "stairs") {
            return (
                <div
                    className="flex h-11 w-[96px] sm:h-12 sm:w-[104px] items-center justify-center rounded-lg bg-[#70B0E0] text-zinc-950 font-black text-[10px] sm:text-[11px] shadow-sm gap-1 border border-[#5A9AC8] select-none print:bg-zinc-200 print:text-black print:border-black"
                    title="Mid-Bus Exit / Entrance Stairs"
                >
                    <DoorOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="tracking-wider">STAIRS</span>
                </div>
            );
        }

        const seatNum = cell.seatNumber!;
        const passenger = bookings.find((b) => b.seat_number === seatNum);
        const isBoarded = passenger?.ticket_status === "USED" || passenger?.ticket?.ticket_status === "USED";
        const isBooked = Boolean(passenger);
        const isSelected = selectedSeatPreview?.seat_number === seatNum || inspectedSeatNumber === seatNum;
        const isPwd = isPwdPrioritySeat(seatNum);
        const isRedTheme = manifestLayout.seatColor === "red";

        const freeBg = isRedTheme
            ? "bg-[#E05D5D] hover:bg-[#D44A4A] text-white border-[#C94545]"
            : "bg-[#5B9BD5] hover:bg-[#4A8EC6] text-white border-[#457EB3]";

        return (
            <button
                key={seatNum}
                type="button"
                onClick={() => {
                    setInspectedSeatNumber(seatNum);
                    setSelectedSeatPreview(passenger || null);
                }}
                className={`relative flex h-11 w-11 sm:h-12 sm:w-12 flex-col items-center justify-center rounded-lg border font-mono transition-all ${
                    isBoarded
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md hover:bg-emerald-500 print:bg-zinc-300 print:text-black print:border-black"
                        : isBooked
                        ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md hover:bg-amber-400 print:bg-zinc-200 print:text-black print:border-black"
                        : `${freeBg} shadow-sm hover:scale-105 active:scale-95 print:bg-white print:text-black print:border-zinc-400`
                } ${isSelected ? "ring-4 ring-sky-500 scale-105 z-20 shadow-xl" : ""} ${
                    isBackRow ? "flex-1 max-w-[54px]" : ""
                }`}
                title={`Seat #${seatNum} — ${
                    isPwd ? "[PWD PRIORITY SEAT] " : ""
                }${isBoarded ? "BOARDED" : isBooked ? `PAID (${passenger?.passenger_name})` : "FREE"}`}
            >
                <span className="text-[12px] sm:text-[13px] font-black leading-tight">
                    {seatNum < 10 ? `0${seatNum}` : seatNum}
                </span>

                <span className="text-[7px] sm:text-[7.5px] font-black uppercase tracking-tight leading-none mt-0.5">
                    {isBoarded ? "BOARDED" : isBooked ? "PAID" : "FREE"}
                </span>

                {/* Explicit PWD Label for Seats 1, 2, 3, 4 */}
                {isPwd && (
                    <span className="mt-0.5 inline-flex items-center px-1 py-0.2 rounded font-black text-[7px] sm:text-[7.5px] tracking-wider uppercase bg-blue-700 text-white border border-blue-400 shadow-sm print:bg-black print:text-white print:border-black">
                        ♿ PWD
                    </span>
                )}

                {/* 20% Discount Badge on booked seat */}
                {(passenger?.is_discounted ||
                    (passenger?.discounted_passengers && passenger.discounted_passengers.length > 0)) && (
                    <span
                        className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-purple-600 rounded-full border border-white text-[7.5px] text-white flex items-center justify-center font-black shadow print:hidden"
                        title="20% Statutory Discount Verified"
                    >
                        %
                    </span>
                )}
            </button>
        );
    };

    const aisleLetters = ["A", "I", "S", "L", "E"];
    const startRowIdx = Math.max(1, Math.floor((manifestLayout.rows.length - aisleLetters.length) / 2));

    return (
        <div className="space-y-6">
            {/* ========================================================================= */}
            {/* SCREEN VIEW CONTROLS (HIDDEN DURING PRINT)                                 */}
            {/* ========================================================================= */}
            <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                    <div className="flex items-center gap-2">
                        <Bus className="h-6 w-6 text-blue-600" />
                        <h2 className="text-2xl font-black tracking-tight text-foreground">
                            Official Passenger Manifest
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300">
                            {role} Module
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Unified bus manifest and physical seating arrangement for {originName} ➔ {destName}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <Button onClick={onClose} variant="ghost" size="sm">
                            <X className="mr-1.5 h-4 w-4" />
                            Close
                        </Button>
                    )}
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Manifest
                    </Button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* PRINT HEADER BANNER (OFFICIAL SUPERLINES CO., INC. AUDIT FORMAT)          */}
            {/* ========================================================================= */}
            <div className="hidden border-b-2 border-black pb-4 print:block text-black">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase text-red-600 tracking-wider">
                            SUPERLINES TRANSPORTATION CO., INC.
                        </h1>
                        <p className="text-sm font-black uppercase tracking-wide text-zinc-800">
                            OFFICIAL TRIP PASSENGER MANIFEST & SEATING ARRANGEMENT
                        </p>
                        <p className="text-xs font-mono font-bold text-zinc-600 mt-0.5">
                            Central Bus Dispatch Operations • LTFRB Regulated Passenger Audit
                        </p>
                    </div>
                    <div className="text-right font-mono text-xs border border-black p-2 rounded">
                        <p className="font-bold">PRINTED DATE: {new Date().toLocaleDateString()}</p>
                        <p className="font-bold">TIME: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="font-black text-red-600">ROLE: {role}</p>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-xs font-mono border-t border-black pt-2 bg-zinc-100 p-2">
                    <div>
                        <span className="font-bold block text-[10px] text-zinc-600">TRIP ROUTE</span>
                        <span className="font-black">{originName} ➔ {destName}</span>
                    </div>
                    <div>
                        <span className="font-bold block text-[10px] text-zinc-600">BUS UNIT & CLASSIFICATION</span>
                        <span className="font-black">{busNum} • {manifestLayout.name}</span>
                    </div>
                    <div>
                        <span className="font-bold block text-[10px] text-zinc-600">DEPARTURE SCHEDULE</span>
                        <span className="font-black">
                            {tripDate.toLocaleDateString()} at {tripDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    </div>
                    <div>
                        <span className="font-bold block text-[10px] text-zinc-600">PASSENGER LOAD</span>
                        <span className="font-black">{bookedCount} / {capacity} ({boardedCount} Boarded)</span>
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* TRIP SUMMARY CARDS (SCREEN VIEW)                                          */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs print:hidden">
                <Card className="p-3 bg-muted/40 border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Bus Unit</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-black font-mono text-foreground">{busNum}</span>
                        <BusClassificationBadge busType={busType} seatCapacity={capacity} showFeatures />
                    </div>
                </Card>
                <Card className="p-3 bg-muted/40 border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Booked</p>
                    <p className="text-base font-black font-mono text-blue-600 mt-1">
                        {bookedCount} / {capacity} Passengers
                    </p>
                </Card>
                <Card className="p-3 bg-muted/40 border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Boarding Status</p>
                    <p className="text-base font-black font-mono text-emerald-600 mt-1">
                        {boardedCount} Boarded • {freeCount} Free
                    </p>
                </Card>
                <Card className="p-3 bg-muted/40 border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Departure Time</p>
                    <p className="text-base font-black font-mono text-foreground mt-1">
                        {tripDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                </Card>
            </div>

            {/* ========================================================================= */}
            {/* SEATING ARRANGEMENT CARD (UNIFIED ACROSS ADMIN, CONDUCTOR, TELLER)         */}
            {/* ========================================================================= */}
            <Card className="border-2 border-zinc-300 dark:border-zinc-800 shadow-lg print:border-black print:shadow-none">
                <CardHeader className="pb-3 border-b bg-muted/20 print:hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-black flex items-center gap-2">
                                <Bus className="h-5 w-5 text-blue-600" />
                                Official Bus Seating Arrangement & PWD Boarding Diagram
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Front-row cockpit alignment directly across from the driver&apos;s seat and adjacent to entrance stairs. Seats 1, 2, 3, and 4 are designated PWD priority seats.
                            </CardDescription>
                        </div>

                        {/* Bus Model Classification Switcher */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-xl border">
                            {SUPERLINES_BUS_CLASSIFICATIONS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        setManifestLayout(c);
                                        setSelectedSeatPreview(null);
                                        setInspectedSeatNumber(null);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                        manifestLayout.id === c.id
                                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                            : "bg-background text-muted-foreground border-transparent hover:text-foreground"
                                    }`}
                                >
                                    {c.capacity} Seater ({c.name})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Legend */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 text-[11px] font-semibold text-muted-foreground border-t mt-2">
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded bg-emerald-600 border border-emerald-500" /> Boarded ({boardedCount})
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded bg-amber-500 border border-amber-400" /> Paid / Pending ({bookedCount - boardedCount})
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                className={`h-3 w-3 rounded ${
                                    manifestLayout.seatColor === "red" ? "bg-[#E05D5D]" : "bg-[#5B9BD5]"
                                } border border-zinc-600`}
                            />{" "}
                            Free ({freeCount})
                        </span>
                        <span className="flex items-center gap-1.5 font-black text-blue-700 dark:text-blue-400">
                            <span className="px-1 py-0.2 rounded bg-blue-700 text-white text-[8px] font-black border border-blue-500">
                                ♿ PWD
                            </span>{" "}
                            PWD Priority (Seats 1, 2, 3, 4)
                        </span>
                        {manifestLayout.hasCR && (
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded bg-[#4A7BB0] border border-[#3A6B9E]" /> Comfort Room
                            </span>
                        )}
                        {manifestLayout.hasStairs && (
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded bg-[#70B0E0] border border-[#5A9AC8]" /> Mid-Bus Stairs
                            </span>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 bg-[#FAFAFA] dark:bg-zinc-950/40 print:bg-white print:p-2">
                    {/* Visual Laminated Manifest Chassis */}
                    <div className="mx-auto max-w-lg rounded-2xl border-2 border-zinc-400/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 sm:p-5 shadow-xl text-zinc-950 dark:text-zinc-50 space-y-3.5 print:border-black print:shadow-none print:p-2">
                        {/* Official Header */}
                        <div className="text-center space-y-0.5 border-b border-zinc-300 dark:border-zinc-700 pb-3 print:border-black">
                            <h2 className="text-sm sm:text-base font-black tracking-wider text-[#1A365D] dark:text-sky-300 uppercase font-sans print:text-black">
                                SUPERLINES TRANSPORTATION CO., INC.
                            </h2>
                            <div className="pt-0.5">
                                <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide print:text-black">
                                    {manifestLayout.officialTitle}
                                </p>
                                <p className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 font-mono print:text-black">
                                    {manifestLayout.seaterLabel}
                                </p>
                            </div>
                            {manifestLayout.busNotes && (
                                <p className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 pt-0.5 print:text-black">
                                    {manifestLayout.busNotes}
                                </p>
                            )}
                        </div>

                        {/* Grid Rows Container */}
                        <div className="space-y-1 sm:space-y-1.5 bg-white dark:bg-zinc-950/70 p-2 sm:p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 shadow-inner print:border-black print:p-1">
                            {/* ========================================================================= */}
                            {/* FRONT OF BUS: DRIVER COCKPIT & ENTRANCE STAIRS (IN FRONT OF PWD SEATS)   */}
                            {/* ========================================================================= */}
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 mb-2 print:border-black print:bg-white">
                                {/* [ Driver Seat ] */}
                                <div
                                    className="flex h-11 w-20 sm:h-12 sm:w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-zinc-800 text-white font-black text-[9px] sm:text-[10px] uppercase shadow-sm border border-zinc-700 select-none print:bg-zinc-200 print:text-black print:border-black"
                                    title="Driver's Seat Station"
                                >
                                    <Bus className="h-4 w-4 mb-0.5 text-sky-400 print:text-black shrink-0" />
                                    <span className="leading-tight text-center">
                                        DRIVER<br />SEAT
                                    </span>
                                </div>

                                {/* Center Windshield & Entrance Indicator */}
                                <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
                                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 print:text-black font-mono">
                                        ▲ FRONT OF BUS ▲
                                    </span>
                                    <span className="text-[8px] text-zinc-400 dark:text-zinc-500 print:text-zinc-600 uppercase font-mono">
                                        Cockpit &amp; Main Entrance Door
                                    </span>
                                </div>

                                {/* [ Entrance Stairs ] */}
                                <div
                                    className="flex h-11 w-20 sm:h-12 sm:w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-[#70B0E0] text-zinc-950 font-black text-[9px] sm:text-[10px] uppercase shadow-sm border border-[#5A9AC8] select-none print:bg-zinc-200 print:text-black print:border-black"
                                    title="Passenger Entrance & Exit Stairs"
                                >
                                    <DoorOpen className="h-4 w-4 mb-0.5 text-zinc-900 print:text-black shrink-0" />
                                    <span className="leading-tight text-center">
                                        ENTRANCE<br />STAIRS
                                    </span>
                                </div>
                            </div>

                            {/* ========================================================================= */}
                            {/* PASSENGER SEAT ROWS (ROW 1: SEATS 1-4 PWD PRIORITY, ROWS 2 TO REAR)       */}
                            {/* ========================================================================= */}
                            {manifestLayout.rows.map((row, rowIdx) => {
                                const isBackRow = Boolean(row.aisleSeat);
                                const isRow1 = row.rowNumber === 1;
                                const aisleLetterIdx = rowIdx - startRowIdx;
                                const aisleLetter =
                                    !isBackRow && !isRow1 && aisleLetterIdx >= 0 && aisleLetterIdx < aisleLetters.length
                                        ? aisleLetters[aisleLetterIdx]
                                        : null;

                                return (
                                    <div
                                        key={row.rowNumber}
                                        className={`flex items-center justify-between gap-1 sm:gap-2 px-1.5 py-0.5 rounded-lg transition-colors ${
                                            isRow1
                                                ? "bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 print:bg-transparent print:border-none"
                                                : ""
                                        }`}
                                    >
                                        {/* Row Number Marker */}
                                        <div className="w-8 sm:w-10 shrink-0 flex items-center justify-center font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-600 print:text-zinc-500">
                                            <span>R{row.rowNumber}</span>
                                        </div>

                                        {/* Left 2 Seats (Driver Side) */}
                                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                            {row.leftSeats.map((cell, idx) => (
                                                <div key={idx} className="shrink-0">
                                                    {renderSeatCell(cell, isBackRow)}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Central Aisle */}
                                        <div className="flex-1 flex items-center justify-center px-1">
                                            {row.aisleSeat ? (
                                                renderSeatCell(row.aisleSeat, true)
                                            ) : isRow1 ? (
                                                <span className="text-[10px] sm:text-xs font-black uppercase text-red-600 dark:text-red-400 font-mono tracking-wider print:text-black">
                                                    AISLE
                                                </span>
                                            ) : (
                                                <span className="text-xs font-black font-serif text-red-600 dark:text-red-400 print:text-black select-none">
                                                    {aisleLetter || "•"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Right 2 Seats / CR / Stairs */}
                                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                            {row.rightSeats.map((cell, idx) => (
                                                <div key={idx} className="shrink-0">
                                                    {renderSeatCell(cell, isBackRow)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* SELECTED SEAT QUICK INSPECTION CARD (INTERACTIVE SCREEN VIEW)             */}
                    {/* ========================================================================= */}
                    {(selectedSeatPreview || inspectedSeatNumber !== null) && (
                        <div className="mt-4 p-4 rounded-xl border-2 border-zinc-700 bg-zinc-900 text-xs space-y-3 print:hidden text-white">
                            {selectedSeatPreview ? (
                                <>
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xl font-black text-emerald-400">
                                                Seat #{selectedSeatPreview.seat_number < 10 ? `0${selectedSeatPreview.seat_number}` : selectedSeatPreview.seat_number}
                                            </span>
                                            <span className="text-zinc-200 font-bold text-sm">
                                                {selectedSeatPreview.passenger_name}
                                            </span>
                                            {isPwdPrioritySeat(selectedSeatPreview.seat_number) && (
                                                <span className="px-2 py-0.5 rounded font-black text-[10px] bg-blue-600 text-white border border-blue-400">
                                                    ♿ PWD Priority Seat
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                selectedSeatPreview.ticket_status === "USED" || selectedSeatPreview.ticket?.ticket_status === "USED"
                                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                                    : "bg-amber-950 text-amber-300 border border-amber-800"
                                            }`}
                                        >
                                            {selectedSeatPreview.ticket_status === "USED" || selectedSeatPreview.ticket?.ticket_status === "USED"
                                                ? "✓ BOARDED"
                                                : "AWAITING BOARDING"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-400">
                                        <div>
                                            <span className="text-zinc-500 block text-[10px]">Contact Phone</span>
                                            <span className="text-zinc-200 font-mono">
                                                {selectedSeatPreview.passenger_contact || "N/A"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 block text-[10px]">Booking Source</span>
                                            <span className="text-zinc-200 font-semibold">
                                                {selectedSeatPreview.booking_source || "Counter / Online"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 block text-[10px]">Payment Status</span>
                                            <span className="text-emerald-400 font-bold">
                                                {selectedSeatPreview.payment_status || "PAID"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 block text-[10px]">QR Token</span>
                                            <span className="text-zinc-200 font-mono">
                                                {selectedSeatPreview.qr_token || selectedSeatPreview.ticket?.qr_token || "Verified"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Statutory Discount Inspection */}
                                    {(selectedSeatPreview.is_discounted ||
                                        (selectedSeatPreview.discounted_passengers &&
                                            selectedSeatPreview.discounted_passengers.length > 0)) && (
                                        <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-800 text-purple-200 text-xs space-y-1">
                                            <div className="font-bold flex items-center justify-between text-purple-300">
                                                <span>20% Statutory Discount Beneficiary</span>
                                                <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded font-black">
                                                    20% OFF
                                                </span>
                                            </div>
                                            {selectedSeatPreview.discounted_passengers &&
                                            selectedSeatPreview.discounted_passengers.length > 0 ? (
                                                selectedSeatPreview.discounted_passengers.map((p, idx) => (
                                                    <p key={idx} className="font-mono text-[11px]">
                                                        {p.name} ({p.classification}) • ID: {p.id_number}
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="font-mono text-[11px]">
                                                    {selectedSeatPreview.passenger_type || "Discount"} • ID:{" "}
                                                    {selectedSeatPreview.discount_id || "Verified"}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Conductor Quick Boarding Action */}
                                    {onMarkBoarded &&
                                        selectedSeatPreview.ticket_status !== "USED" &&
                                        selectedSeatPreview.ticket?.ticket_status !== "USED" && (
                                            <div className="flex justify-end pt-1">
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs"
                                                    onClick={() =>
                                                        handleBoardAction(
                                                            selectedSeatPreview.qr_token || selectedSeatPreview.ticket?.qr_token || "",
                                                            selectedSeatPreview.seat_number
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        (selectedSeatPreview.qr_token || selectedSeatPreview.ticket?.qr_token)
                                                    }
                                                >
                                                    <Check className="h-3.5 w-3.5 mr-1" />
                                                    Mark as Boarded
                                                </Button>
                                            </div>
                                        )}
                                </>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg font-black text-zinc-300">
                                            Seat #{inspectedSeatNumber! < 10 ? `0${inspectedSeatNumber}` : inspectedSeatNumber}
                                        </span>
                                        <span className="text-zinc-400 font-semibold text-xs">
                                            Vacant / Available for Walk-in or Reservation
                                        </span>
                                        {isPwdPrioritySeat(inspectedSeatNumber!) && (
                                            <span className="px-2 py-0.5 rounded font-black text-[10px] bg-blue-600 text-white border border-blue-400">
                                                ♿ PWD Priority Seat
                                            </span>
                                        )}
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                        UNBOOKED
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ========================================================================= */}
            {/* PASSENGER LEDGER ROSTER TABLE (PRINTABLE & SCREEN)                         */}
            {/* ========================================================================= */}
            <Card className="print:border-none print:shadow-none">
                <CardHeader className="pb-3 border-b print:hidden">
                    <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <div>
                            <CardTitle className="text-base font-bold">Passenger Booking Manifest</CardTitle>
                            <CardDescription className="text-xs">
                                Showing {filteredBookings.length} of {bookings.length} passenger reservations
                            </CardDescription>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search passenger, seat #, QR..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <div className="flex gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                            <button
                                type="button"
                                onClick={() => setFilterSource("ALL")}
                                className={`px-2 py-1 rounded font-bold ${
                                    filterSource === "ALL" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                All Sources ({bookings.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterSource("ONLINE")}
                                className={`px-2 py-1 rounded font-bold ${
                                    filterSource === "ONLINE" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                Online ({bookings.filter((b) => b.booking_source?.toUpperCase().includes("ONLINE")).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterSource("WALK_IN")}
                                className={`px-2 py-1 rounded font-bold ${
                                    filterSource === "WALK_IN" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                Walk-in ({bookings.filter((b) => !b.booking_source?.toUpperCase().includes("ONLINE")).length})
                            </button>
                        </div>

                        <div className="flex gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                            <button
                                type="button"
                                onClick={() => setFilterStatus("ALL")}
                                className={`px-2 py-1 rounded font-bold ${
                                    filterStatus === "ALL" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                All Status
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterStatus("BOARDED")}
                                className={`px-2 py-1 rounded font-bold ${
                                    filterStatus === "BOARDED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "text-muted-foreground"
                                }`}
                            >
                                Boarded ({boardedCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterStatus("PAID")}
                                className={`px-2 py-1 rounded font-bold ${
                                    filterStatus === "PAID" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "text-muted-foreground"
                                }`}
                            >
                                Pending ({bookedCount - boardedCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterStatus("DISCOUNTED")}
                                className={`px-2 py-1 rounded font-bold ${
                                    filterStatus === "DISCOUNTED" ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" : "text-muted-foreground"
                                }`}
                            >
                                20% Discount
                            </button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b font-mono uppercase text-[10px] text-muted-foreground tracking-wider print:bg-zinc-200 print:text-black">
                                <tr>
                                    <th className="p-3 text-center w-20">Seat #</th>
                                    <th className="p-3">Passenger Name</th>
                                    <th className="p-3">Contact</th>
                                    <th className="p-3">Source & Terminal</th>
                                    <th className="p-3">QR Token</th>
                                    <th className="p-3 text-center">Ticket Status</th>
                                    {onMarkBoarded && <th className="p-3 text-right print:hidden">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y print:divide-zinc-400">
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((b) => {
                                        const isBoarded = b.ticket_status === "USED" || b.ticket?.ticket_status === "USED";
                                        const isPwd = isPwdPrioritySeat(b.seat_number);
                                        const token = b.qr_token || b.ticket?.qr_token || "Pending";
                                        const isDiscounted = b.is_discounted || (b.discounted_passengers && b.discounted_passengers.length > 0);

                                        return (
                                            <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 print:text-black">
                                                            #{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}
                                                        </span>
                                                        {isPwd && (
                                                            <span className="mt-0.5 rounded px-1 py-0.2 text-[8px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-400 print:bg-black print:text-white print:border-black">
                                                                ♿ PWD
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    <div className="font-bold text-foreground print:text-black flex items-center gap-1.5">
                                                        <span>{b.passenger_name}</span>
                                                        {isDiscounted && (
                                                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 print:border-black print:text-black">
                                                                20% DISC
                                                            </span>
                                                        )}
                                                    </div>
                                                    {b.discounted_passengers && b.discounted_passengers.length > 0 ? (
                                                        <div className="text-[10px] text-muted-foreground font-mono print:text-zinc-600">
                                                            {b.discounted_passengers.map((p, idx) => (
                                                                <span key={idx} className="block">
                                                                    ID: {p.id_number} ({p.classification})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : b.discount_id ? (
                                                        <span className="text-[10px] text-muted-foreground font-mono block print:text-zinc-600">
                                                            ID: {b.discount_id}
                                                        </span>
                                                    ) : null}
                                                </td>

                                                <td className="p-3 font-mono text-[11px] text-muted-foreground print:text-black">
                                                    {b.passenger_contact || "N/A"}
                                                </td>

                                                <td className="p-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                                                            b.booking_source?.toUpperCase().includes("ONLINE")
                                                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 print:border print:border-black"
                                                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 print:border print:border-black"
                                                        }`}
                                                    >
                                                        {b.booking_source?.toUpperCase().includes("ONLINE")
                                                            ? "🌐 ONLINE"
                                                            : `🏬 COUNTER (${b.booking_terminal?.name || "Terminal"})`}
                                                    </span>
                                                </td>

                                                <td className="p-3 font-mono text-[11px] text-muted-foreground print:text-black">
                                                    {token}
                                                </td>

                                                <td className="p-3 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                                                            isBoarded
                                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 print:bg-zinc-200 print:text-black print:border print:border-black"
                                                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 print:bg-zinc-100 print:text-black"
                                                        }`}
                                                    >
                                                        {isBoarded ? "✓ BOARDED" : "AWAITING"}
                                                    </span>
                                                </td>

                                                {onMarkBoarded && (
                                                    <td className="p-3 text-right print:hidden">
                                                        {!isBoarded ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                                                                onClick={() => handleBoardAction(token, b.seat_number)}
                                                                disabled={actionLoading === token}
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Board
                                                            </Button>
                                                        ) : (
                                                            <span className="text-emerald-600 font-bold text-xs">
                                                                Checked In
                                                            </span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={onMarkBoarded ? 7 : 6} className="p-8 text-center text-muted-foreground">
                                            No passenger reservations found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ========================================================================= */}
                    {/* OFFICIAL TRI-SIGNATURE AUDIT BLOCK (UNIFIED PRINT FOOTER)                 */}
                    {/* ========================================================================= */}
                    <div className="hidden grid-cols-3 gap-8 text-xs print:grid border-t-2 border-black p-6 mt-8 text-black">
                        <div>
                            <p className="font-bold uppercase tracking-wider text-[11px]">Prepared By:</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">Terminal Teller / Dispatcher</p>
                            <div className="mt-8 border-b border-black w-44"></div>
                            <p className="mt-1 text-[9px] text-zinc-500 font-mono">Signature Over Printed Name</p>
                        </div>
                        <div>
                            <p className="font-bold uppercase tracking-wider text-[11px]">Verified By:</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">Assigned Bus Conductor</p>
                            <div className="mt-8 border-b border-black w-44"></div>
                            <p className="mt-1 text-[9px] text-zinc-500 font-mono">Signature Over Printed Name</p>
                        </div>
                        <div>
                            <p className="font-bold uppercase tracking-wider text-[11px]">Approved By:</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">Admin / Operations Manager</p>
                            <div className="mt-8 border-b border-black w-44"></div>
                            <p className="mt-1 text-[9px] text-zinc-500 font-mono">Signature Over Printed Name</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
