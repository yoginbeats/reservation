"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, UserCheck, Armchair, DoorOpen, Bath } from "lucide-react";
import { 
    SUPERLINES_BUS_CLASSIFICATIONS, 
    getBusClassification, 
    BusClassification,
    SeatGridCell
} from "@/lib/constants/bus-layouts";

interface SeatPickerProps {
    totalSeats?: number;
    bookedSeats: number[];
    selectedSeat?: number | null;
    selectedSeats?: number[];
    onSelectSeat?: (seatNumber: number) => void;
    onSelectSeats?: (seatNumbers: number[]) => void;
    busType?: string;
    busNumber?: string;
    maxSeats?: number;
    allowClassificationSwitch?: boolean;
}

export function SeatPicker({
    bookedSeats = [],
    selectedSeat = null,
    selectedSeats,
    onSelectSeat,
    onSelectSeats,
    busType = "REGULAR_AIRCON",
    busNumber,
    maxSeats = 10,
    allowClassificationSwitch = true,
}: SeatPickerProps) {
    // Resolve initial classification based on busType or busNumber
    const [classification, setClassification] = useState<BusClassification>(() => 
        getBusClassification(busType, busNumber)
    );

    // Sync when props change
    useEffect(() => {
        setClassification(getBusClassification(busType, busNumber));
    }, [busType, busNumber]);

    const isSeatSelected = (seatNum: number) => {
        if (selectedSeats && selectedSeats.length > 0) {
            return selectedSeats.includes(seatNum);
        }
        return selectedSeat === seatNum;
    };

    const handleSeatClick = (seatNum: number) => {
        if (onSelectSeats && selectedSeats !== undefined) {
            if (selectedSeats.includes(seatNum)) {
                const next = selectedSeats.filter((s) => s !== seatNum);
                onSelectSeats(next);
                if (onSelectSeat) onSelectSeat(next.length > 0 ? next[next.length - 1] : 0);
            } else {
                if (selectedSeats.length >= maxSeats) return;
                const next = [...selectedSeats, seatNum].sort((a, b) => a - b);
                onSelectSeats(next);
                if (onSelectSeat) onSelectSeat(seatNum);
            }
        } else if (onSelectSeat) {
            onSelectSeat(seatNum);
        }
    };

    const handleClassificationChange = (id: string) => {
        const found = SUPERLINES_BUS_CLASSIFICATIONS.find(c => c.id === id);
        if (found) {
            setClassification(found);
            // If currently selected seats exceed new capacity, reset
            if (selectedSeats && selectedSeats.some(s => s > found.capacity)) {
                const validSeats = selectedSeats.filter(s => s <= found.capacity);
                if (onSelectSeats) onSelectSeats(validSeats);
                if (onSelectSeat) onSelectSeat(validSeats.length > 0 ? validSeats[0] : 0);
            } else if (selectedSeat && selectedSeat > found.capacity) {
                if (onSelectSeat) onSelectSeat(0);
            }
        }
    };

    const isRedTheme = classification.seatColor === "red";

    const renderSeatButton = (cell: SeatGridCell, isBackRow = false) => {
        if (!cell || cell.type === "empty") {
            return <div className="h-10 w-11 sm:h-11 sm:w-12" />;
        }

        if (cell.type === "cr") {
            return (
                <div 
                    className="flex h-10 w-[94px] sm:h-11 sm:w-[102px] items-center justify-center rounded-md bg-[#4A7BB0] text-white font-black text-[10px] sm:text-[11px] shadow-sm gap-1 border border-[#3A6B9E] select-none"
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
                    className="flex h-10 w-[94px] sm:h-11 sm:w-[102px] items-center justify-center rounded-md bg-[#70B0E0] text-zinc-950 font-black text-[10px] sm:text-[11px] shadow-sm gap-1 border border-[#5A9AC8] select-none"
                    title="Exit / Entrance Stairs"
                >
                    <DoorOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="tracking-wider">STAIRS</span>
                </div>
            );
        }

        const seatNum = cell.seatNumber!;
        const isBooked = bookedSeats.includes(seatNum);
        const isSelected = isSeatSelected(seatNum);

        // Official color from paper sheets:
        // Regular Aircon & Super Deluxe = Red (#E05D5D)
        // First Class = Blue (#5B9BD5)
        const availableBg = isRedTheme
            ? "bg-[#E05D5D] hover:bg-[#D44A4A] text-white border-[#C94545]"
            : "bg-[#5B9BD5] hover:bg-[#4A8EC6] text-white border-[#457EB3]";

        return (
            <button
                key={seatNum}
                type="button"
                disabled={isBooked}
                onClick={() => handleSeatClick(seatNum)}
                className={`relative flex h-10 w-11 sm:h-11 sm:w-12 flex-col items-center justify-center rounded-md border font-mono text-xs font-black transition-all ${
                    isBooked
                        ? "cursor-not-allowed bg-zinc-200 border-zinc-300 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500 opacity-60 line-through select-none"
                        : isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-emerald-300 dark:ring-emerald-600 scale-105 z-10"
                        : `${availableBg} shadow-sm hover:scale-105 active:scale-95`
                } ${isBackRow ? "flex-1 max-w-[52px]" : ""}`}
                title={`Seat #${seatNum} ${isBooked ? '(Booked)' : isSelected ? '(Selected)' : '(Available)'}`}
            >
                <span className="text-[13px]">{seatNum}</span>
                {isSelected && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-emerald-600 shadow">
                        <CheckCircle2 className="h-3 w-3" />
                    </span>
                )}
            </button>
        );
    };

    // Distribute AISLE letters across rows
    const totalRows = classification.rows.length;
    const aisleLetters = ["A", "I", "S", "L", "E"];
    const startRowIdx = Math.max(1, Math.floor((totalRows - aisleLetters.length) / 2));

    const hasMultiSelected = selectedSeats && selectedSeats.length > 0;

    return (
        <div className="mx-auto w-full max-w-sm sm:max-w-md rounded-2xl border-2 border-zinc-300 bg-white p-3 sm:p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-950 space-y-4">
            {/* Classification Quick Switcher (if enabled) */}
            {allowClassificationSwitch && (
                <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800 gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                        <Armchair className="h-4 w-4 text-red-600" />
                        <span>Select Bus Model:</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {SUPERLINES_BUS_CLASSIFICATIONS.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => handleClassificationChange(c.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                    classification.id === c.id
                                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                }`}
                            >
                                {c.capacity} Seater
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* OFFICIAL SUPERLINES MANIFEST CARD (MATCHING PHYSICAL LAMINATED SHEETS)    */}
            {/* ========================================================================= */}
            <div className="rounded-xl border-2 border-zinc-400/80 bg-[#FAFAFA] dark:bg-zinc-900 p-3 sm:p-4 shadow-md space-y-3">
                {/* Official Header */}
                <div className="text-center space-y-0.5 border-b border-zinc-300 dark:border-zinc-700 pb-3">
                    <h2 className="text-sm sm:text-base font-black tracking-wider text-[#1A365D] dark:text-sky-300 uppercase font-sans">
                        SUPERLINES TRANSPORTATION CO., INC.
                    </h2>
                    <div className="pt-1">
                        <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide">
                            {classification.officialTitle}
                        </p>
                        <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                            {classification.seaterLabel}
                        </p>
                    </div>
                    {classification.busNotes && (
                        <p className="text-[10px] font-mono font-bold text-zinc-500 pt-0.5">
                            {classification.busNotes}
                        </p>
                    )}
                </div>

                {/* Column Headers: DRIVER'S SEAT | AISLE | CONDUCTOR SEAT */}
                <div className="grid grid-cols-12 gap-1 items-end text-center">
                    <div className="col-span-5 rounded-t-md bg-[#70B0E0] text-zinc-950 font-black text-[11px] sm:text-xs uppercase py-1.5 shadow-sm border border-[#5A9AC8]">
                        DRIVER&apos;S SEAT
                    </div>
                    <div className="col-span-2 text-[10px] font-black uppercase text-red-600 dark:text-red-400 py-1 font-mono">
                        {/* Aisle Spacer */}
                    </div>
                    <div className="col-span-5 rounded-t-md bg-[#70B0E0] text-zinc-950 font-black text-[11px] sm:text-xs uppercase py-1.5 shadow-sm border border-[#5A9AC8]">
                        CONDUCTOR SEAT
                    </div>
                </div>

                {/* Official Rows */}
                <div className="space-y-1 sm:space-y-1.5 bg-white dark:bg-zinc-950/60 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    {classification.rows.map((row, rowIdx) => {
                        const isBackRow = Boolean(row.aisleSeat);
                        const aisleLetterIdx = rowIdx - startRowIdx;
                        const aisleLetter = (!isBackRow && aisleLetterIdx >= 0 && aisleLetterIdx < aisleLetters.length)
                            ? aisleLetters[aisleLetterIdx]
                            : null;

                        return (
                            <div key={row.rowNumber} className="grid grid-cols-12 items-center gap-1">
                                {/* Left Side (Driver Side - 2 Seats) */}
                                <div className="col-span-5 flex justify-end gap-1 sm:gap-1.5">
                                    {row.leftSeats.map((cell, idx) => (
                                        <div key={idx} className="shrink-0">
                                            {renderSeatButton(cell, isBackRow)}
                                        </div>
                                    ))}
                                </div>

                                {/* Center Aisle (Or Middle Back Seat) */}
                                <div className="col-span-2 flex items-center justify-center">
                                    {row.aisleSeat ? (
                                        renderSeatButton(row.aisleSeat, true)
                                    ) : (
                                        <div className="h-9 w-6 flex items-center justify-center font-black text-xs sm:text-sm text-red-600 dark:text-red-400 select-none font-sans">
                                            {aisleLetter || ""}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side (Conductor Side - 2 Seats or CR/Stairs) */}
                                <div className="col-span-5 flex justify-start gap-1 sm:gap-1.5">
                                    {row.rightSeats.map((cell, idx) => (
                                        <div key={idx} className="shrink-0">
                                            {renderSeatButton(cell, isBackRow)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Official Legend */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 rounded-xl bg-zinc-50 p-2.5 text-[10px] sm:text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 rounded ${isRedTheme ? "bg-[#E05D5D]" : "bg-[#5B9BD5]"}`} />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-emerald-600" />
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-zinc-300 dark:bg-zinc-700 line-through" />
                    <span>Booked</span>
                </div>
                {classification.hasCR && (
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-[#4A7BB0] text-white flex items-center justify-center text-[7px] font-black">CR</div>
                        <span>Restroom</span>
                    </div>
                )}
                {classification.hasStairs && (
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-[#70B0E0] text-zinc-950 flex items-center justify-center text-[7px] font-black">ST</div>
                        <span>Stairs</span>
                    </div>
                )}
            </div>

            {/* Selected Seat Footer Notification */}
            {hasMultiSelected ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 dark:bg-emerald-950/50 dark:border-emerald-900">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                                Selected Seats ({selectedSeats!.length}):
                            </span>
                            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 block">
                                {classification.officialTitle}
                            </span>
                        </div>
                    </div>
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 max-w-[200px] truncate text-right">
                        {selectedSeats!.map((s) => `#${s}`).join(", ")}
                    </span>
                </div>
            ) : selectedSeat ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 dark:bg-emerald-950/50 dark:border-emerald-900">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                                Selected Seat:
                            </span>
                            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 block">
                                {classification.officialTitle}
                            </span>
                        </div>
                    </div>
                    <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                        Seat #{selectedSeat}
                    </span>
                </div>
            ) : (
                <div className="text-center text-xs text-zinc-500 font-medium py-1">
                    Please click an available seat from the official Superlines layout.
                </div>
            )}
        </div>
    );
}
