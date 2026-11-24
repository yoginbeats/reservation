"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, UserCheck, Armchair, DoorOpen, Bath, Accessibility, Lock, Bus } from "lucide-react";
import { 
    SUPERLINES_BUS_CLASSIFICATIONS, 
    getBusClassification, 
    BusClassification,
    SeatGridCell,
    isPwdPrioritySeat,
    PWD_PRIORITY_SEATS,
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
    allowPwdSeats?: boolean;
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
    allowPwdSeats = false,
}: SeatPickerProps) {
    // Resolve initial classification based on busType or busNumber
    const [classification, setClassification] = useState<BusClassification>(() => 
        getBusClassification(busType, busNumber)
    );

    // Sync when props change
    useEffect(() => {
        setClassification(getBusClassification(busType, busNumber));
    }, [busType, busNumber]);

    // Automatically remove PWD priority seats if allowPwdSeats becomes false
    useEffect(() => {
        if (!allowPwdSeats) {
            if (selectedSeats && selectedSeats.some((s) => isPwdPrioritySeat(s))) {
                const filtered = selectedSeats.filter((s) => !isPwdPrioritySeat(s));
                if (onSelectSeats) onSelectSeats(filtered);
                if (onSelectSeat) onSelectSeat(filtered.length > 0 ? filtered[filtered.length - 1] : 0);
            } else if (selectedSeat && isPwdPrioritySeat(selectedSeat)) {
                if (onSelectSeat) onSelectSeat(0);
            }
        }
    }, [allowPwdSeats, selectedSeats, selectedSeat, onSelectSeats, onSelectSeat]);

    const isSeatSelected = (seatNum: number) => {
        if (selectedSeats && selectedSeats.length > 0) {
            return selectedSeats.includes(seatNum);
        }
        return selectedSeat === seatNum;
    };

    const handleSeatClick = (seatNum: number) => {
        // Strictly prevent non-PWD customers from selecting PWD priority seats
        if (isPwdPrioritySeat(seatNum) && !allowPwdSeats) {
            return;
        }
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
            return <div className="h-9 w-8 sm:h-11 sm:w-11" />;
        }

        if (cell.type === "cr") {
            return (
                <div 
                    className="flex h-9 w-[68px] sm:h-11 sm:w-[92px] items-center justify-center rounded-md bg-[#4A7BB0] text-white font-black text-[8px] sm:text-[10px] shadow-sm gap-0.5 sm:gap-1 border border-[#3A6B9E] select-none px-1 text-center leading-tight"
                    title="Comfort Room (Restroom)"
                >
                    <Bath className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="tracking-tighter">COMFORT ROOM</span>
                </div>
            );
        }

        if (cell.type === "stairs") {
            return (
                <div 
                    className="flex h-9 w-[68px] sm:h-11 sm:w-[92px] items-center justify-center rounded-md bg-[#70B0E0] text-zinc-950 font-black text-[9px] sm:text-[11px] shadow-sm gap-0.5 sm:gap-1 border border-[#5A9AC8] select-none"
                    title="Exit / Entrance Stairs"
                >
                    <DoorOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span className="tracking-wider">STAIRS</span>
                </div>
            );
        }

        const seatNum = cell.seatNumber!;
        const isBooked = bookedSeats.includes(seatNum);
        const isSelected = isSeatSelected(seatNum);
        const isPwd = isPwdPrioritySeat(seatNum);
        const isPwdLocked = isPwd && !allowPwdSeats;

        // Official color from paper sheets:
        // Regular Aircon & Super Deluxe = Red (#E05D5D)
        // First Class = Blue (#5B9BD5)
        const availableBg = isPwd
            ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
            : isRedTheme
            ? "bg-[#E05D5D] hover:bg-[#D44A4A] text-white border-[#C94545]"
            : "bg-[#5B9BD5] hover:bg-[#4A8EC6] text-white border-[#457EB3]";

        return (
            <button
                key={seatNum}
                type="button"
                disabled={isBooked || isPwdLocked}
                onClick={() => handleSeatClick(seatNum)}
                className={`relative flex h-9 w-8 sm:h-11 sm:w-11 flex-col items-center justify-center rounded-md border font-mono text-xs font-black transition-all ${
                    isBooked
                        ? "cursor-not-allowed bg-zinc-200 border-zinc-300 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500 opacity-60 line-through select-none"
                        : isPwdLocked
                        ? "cursor-not-allowed bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 opacity-80 select-none"
                        : isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-emerald-300 dark:ring-emerald-600 scale-105 z-10"
                        : `${availableBg} shadow-sm hover:scale-105 active:scale-95`
                } ${isBackRow ? "shrink-0" : ""}`}
                title={
                    isBooked
                        ? `Seat #${seatNum} (Booked)`
                        : isPwdLocked
                        ? `Seat #${seatNum} (PWD Priority Only — Enable PWD option to select)`
                        : isPwd
                        ? `Seat #${seatNum} (PWD Priority Seat)`
                        : isSelected
                        ? `Seat #${seatNum} (Selected)`
                        : `Seat #${seatNum} (Available)`
                }
            >
                <span className="text-[13px] leading-none">{seatNum}</span>
                {isPwd && !isBooked && (
                    <span className="text-[8px] font-sans font-extrabold uppercase tracking-tight leading-none mt-0.5 flex items-center gap-0.5">
                        <Accessibility className="h-2.5 w-2.5" />
                        PWD
                    </span>
                )}
                {isPwdLocked && !isBooked && (
                    <span className="absolute -left-1 -top-1 rounded-full bg-indigo-600 p-0.5 text-white shadow">
                        <Lock className="h-2.5 w-2.5" />
                    </span>
                )}
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
        <div className="mx-auto w-full max-w-lg sm:max-w-xl rounded-2xl border-2 border-zinc-300 bg-white p-2.5 sm:p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-950 space-y-4 overflow-hidden">
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

                {/* Official Rows Container */}
                <div className="space-y-1 sm:space-y-1.5 bg-white dark:bg-zinc-950/60 p-1.5 sm:p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                    {(() => {
                        const startRowIdx = Math.max(1, Math.floor((classification.rows.length - aisleLetters.length) / 2));

                        return (
                            <>
                                {/* Front of Bus: Driver Cockpit & Entrance Stairs (In Front of Seats 1, 2, 3, 4) */}
                                <div className="flex items-center justify-between gap-1.5 p-1.5 sm:p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-2">
                                    {/* Driver Seat Flank */}
                                    <div
                                        className="flex h-10 w-16 sm:h-11 sm:w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-zinc-800 text-white font-black text-[7px] sm:text-[9px] uppercase shadow-sm border border-zinc-700 select-none px-1"
                                        title="Driver's Cockpit Station"
                                    >
                                        <Bus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mb-0.5 text-sky-400 shrink-0" />
                                        <span className="leading-tight text-center">DRIVER<br />SEAT</span>
                                    </div>

                                    {/* Center Windshield Indicator */}
                                    <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-mono">
                                            ▲ FRONT OF BUS ▲
                                        </span>
                                        <span className="text-[7px] text-zinc-400 dark:text-zinc-500 uppercase font-mono">
                                            Windshield &amp; Entry
                                        </span>
                                    </div>

                                    {/* Entrance Stairs */}
                                    <div
                                        className="flex h-10 w-16 sm:h-11 sm:w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-[#70B0E0] text-zinc-950 font-black text-[7px] sm:text-[9px] uppercase shadow-sm border border-[#5A9AC8] select-none px-1"
                                        title="Passenger Entrance & Exit Stairs"
                                    >
                                        <DoorOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 mb-0.5 text-zinc-900 shrink-0" />
                                        <span className="leading-tight text-center">ENTRANCE<br />STAIRS</span>
                                    </div>
                                </div>

                                {/* Passenger Seat Rows (Row 1: Seats 1-4 PWD Priority, Rows 2 to Rear) */}
                                {classification.rows.map((row, rowIdx) => {
                                    const isBackRow = Boolean(row.aisleSeat);
                                    const isRow1 = row.rowNumber === 1;
                                    const aisleLetterIdx = rowIdx - startRowIdx;
                                    const aisleLetter = (!isBackRow && !isRow1 && aisleLetterIdx >= 0 && aisleLetterIdx < aisleLetters.length)
                                        ? aisleLetters[aisleLetterIdx]
                                        : null;

                                    return (
                                        <div
                                            key={row.rowNumber}
                                            className={`flex items-center justify-between gap-1 sm:gap-1.5 px-1 sm:px-1.5 py-0.5 rounded-lg transition-colors ${
                                                isRow1
                                                    ? "bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50"
                                                    : ""
                                            }`}
                                        >
                                            {/* Row Marker */}
                                            <div className="w-7 sm:w-9 shrink-0 flex items-center justify-center font-mono text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-600">
                                                <span>R{row.rowNumber}</span>
                                            </div>

                                            {/* Left 2 Seats */}
                                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                                {row.leftSeats.map((cell, idx) => (
                                                    <div key={idx} className="shrink-0">{renderSeatButton(cell, isBackRow)}</div>
                                                ))}
                                            </div>

                                            {/* Center Aisle */}
                                            <div className="flex-1 min-w-[24px] flex items-center justify-center px-0.5">
                                                {row.aisleSeat ? (
                                                    renderSeatButton(row.aisleSeat, true)
                                                ) : isRow1 ? (
                                                    <span className="text-[8px] sm:text-[10px] font-black uppercase text-red-600 dark:text-red-400 font-mono tracking-tight sm:tracking-wider">
                                                        AISLE
                                                    </span>
                                                ) : (
                                                    <div className="h-9 w-5 flex items-center justify-center font-black text-xs sm:text-sm text-red-600 dark:text-red-400 select-none font-sans">
                                                        {aisleLetter || ""}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right 2 Seats / CR / Stairs */}
                                            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                                {row.rightSeats.map((cell, idx) => (
                                                    <div key={idx} className="shrink-0">{renderSeatButton(cell, isBackRow)}</div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        );
                    })()}
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
                <div className="flex items-center gap-1.5" title={`Seats ${PWD_PRIORITY_SEATS.join(" & ")} reserved for PWD`}>
                    <div className={`h-3 w-3 rounded flex items-center justify-center ${allowPwdSeats ? "bg-indigo-600 text-white" : "bg-indigo-200 border border-indigo-400 text-indigo-700"}`}>
                        <Accessibility className="h-2.5 w-2.5" />
                    </div>
                    <span>PWD Only</span>
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
