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

    const renderSeatButton = (cell: SeatGridCell, isBackRow = false) => {
        if (!cell || cell.type === "empty") {
            return <div className="h-10 w-10 sm:h-11 sm:w-11" />;
        }

        if (cell.type === "cr") {
            return (
                <div 
                    className="flex h-10 w-[84px] sm:h-11 sm:w-[94px] items-center justify-center rounded-xl bg-purple-600 text-white font-black text-[10px] sm:text-xs shadow-md gap-1 border border-purple-400 select-none"
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
                    className="flex h-10 w-[84px] sm:h-11 sm:w-[94px] items-center justify-center rounded-xl bg-sky-700 text-white font-black text-[10px] sm:text-xs shadow-md gap-1 border border-sky-500 select-none"
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

        return (
            <button
                key={seatNum}
                type="button"
                disabled={isBooked}
                onClick={() => handleSeatClick(seatNum)}
                className={`relative flex h-10 w-10 sm:h-11 sm:w-11 flex-col items-center justify-center rounded-xl border font-mono text-xs font-black transition-all ${
                    isBooked
                        ? "cursor-not-allowed bg-red-100 border-red-200 text-red-500 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400 opacity-80"
                        : isSelected
                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105 z-10"
                        : "border-zinc-300 bg-white text-zinc-800 hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 shadow-sm hover:scale-102"
                } ${isBackRow ? "flex-1 max-w-[48px]" : ""}`}
                title={`Seat #${seatNum} ${isBooked ? '(Booked)' : isSelected ? '(Selected)' : '(Available)'}`}
            >
                <span>{seatNum < 10 ? `0${seatNum}` : seatNum}</span>
                {isSelected && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-blue-600 shadow">
                        <CheckCircle2 className="h-3 w-3" />
                    </span>
                )}
            </button>
        );
    };

    const hasMultiSelected = selectedSeats && selectedSeats.length > 0;

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
            {/* Bus Header & Classification Selector */}
            {allowClassificationSwitch && (
                <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800 gap-2">
                    <div>
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                            <Armchair className="h-5 w-5 text-red-600 shrink-0" />
                            <span>{classification.name} ({classification.capacity} Seats)</span>
                        </h3>
                        <p className="text-[11px] text-zinc-500">
                            {classification.hasCR ? "With Comfort Room & Stairs" : "Standard Express Seating"}
                        </p>
                    </div>

                    <select
                        value={classification.id}
                        onChange={(e) => handleClassificationChange(e.target.value)}
                        className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500 cursor-pointer"
                    >
                        {SUPERLINES_BUS_CLASSIFICATIONS.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.capacity} Seats)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Seat Legend */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 rounded-xl bg-zinc-50 p-2.5 text-[10px] sm:text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded border border-zinc-300 bg-white dark:bg-zinc-900" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-blue-600" />
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-red-100 border border-red-300 text-red-600 dark:bg-red-950/60" />
                    <span>Booked</span>
                </div>
                {classification.hasCR && (
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-purple-600 text-white flex items-center justify-center text-[7px] font-black">CR</div>
                        <span>Restroom</span>
                    </div>
                )}
                {classification.hasStairs && (
                    <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-sky-700 text-white flex items-center justify-center text-[7px] font-black">ST</div>
                        <span>Stairs</span>
                    </div>
                )}
            </div>

            {/* BUS FRAME CONTAINER */}
            <div className="relative rounded-3xl border-2 border-zinc-300 bg-zinc-100/90 p-4 sm:p-5 dark:border-zinc-700 dark:bg-zinc-950/90 shadow-inner">
                {/* Windshield / Front of Bus Indicator */}
                <div className="mb-4 rounded-xl bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 p-2.5 text-white shadow-md">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        {/* Driver Seat Indicator */}
                        <div className="flex items-center gap-1 bg-zinc-700/90 px-2 py-0.5 rounded border border-zinc-600 text-amber-300 text-[11px]">
                            <span>🛞</span>
                            <span>Driver</span>
                        </div>

                        <span className="text-[9px] sm:text-[10px] font-extrabold text-zinc-400 tracking-widest">
                            FRONT WINDSHIELD
                        </span>

                        {/* Conductor Seat / Front Entrance */}
                        <div className="flex items-center gap-1 bg-emerald-800/90 px-2 py-0.5 rounded border border-emerald-600 text-emerald-200 text-[11px]">
                            <span>🎫</span>
                            <span>Conductor</span>
                        </div>
                    </div>
                </div>

                {/* Column Headers: DRIVER'S SEAT vs CONDUCTOR SEAT */}
                <div className="mb-3 grid grid-cols-12 gap-1 text-[10px] font-black uppercase tracking-wider text-center">
                    <div className="col-span-5 rounded-md bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 py-1">
                        DRIVER&apos;S SEAT
                    </div>
                    <div className="col-span-2 text-zinc-400 dark:text-zinc-500 py-1 font-mono text-[9px]">
                        AISLE
                    </div>
                    <div className="col-span-5 rounded-md bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 py-1">
                        CONDUCTOR SEAT
                    </div>
                </div>

                {/* Bus Rows */}
                <div className="space-y-2.5">
                    {classification.rows.map((row) => {
                        const isBackRow = Boolean(row.aisleSeat);

                        return (
                            <div key={row.rowNumber} className="grid grid-cols-12 items-center gap-1 sm:gap-2">
                                {/* Left Side (Driver Side - 2 Seats) */}
                                <div className="col-span-5 flex justify-end gap-1.5 sm:gap-2">
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
                                        <span className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-600 select-none">
                                            •
                                        </span>
                                    )}
                                </div>

                                {/* Right Side (Conductor Side - 2 Seats or CR/Stairs) */}
                                <div className="col-span-5 flex justify-start gap-1.5 sm:gap-2">
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

                {/* Rear of Bus Indicator */}
                <div className="mt-5 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    REAR OF BUS / ENGINE
                </div>
            </div>

            {/* Selected Seat Footer Notification */}
            {hasMultiSelected ? (
                <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 p-3.5 dark:bg-blue-950/50 dark:border-blue-900">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <div>
                            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                                Selected Bus Seats ({selectedSeats!.length}):
                            </span>
                            <span className="text-[10px] text-blue-700/80 dark:text-blue-300/80 block">
                                {classification.name} ({classification.capacity} Seater)
                            </span>
                        </div>
                    </div>
                    <span className="font-mono text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 max-w-[200px] truncate text-right">
                        {selectedSeats!.map((s) => `#${s < 10 ? `0${s}` : s}`).join(", ")}
                    </span>
                </div>
            ) : selectedSeat ? (
                <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 p-3.5 dark:bg-blue-950/50 dark:border-blue-900">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <div>
                            <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                                Selected Bus Seat:
                            </span>
                            <span className="text-[10px] text-blue-700/80 dark:text-blue-300/80 block">
                                {classification.name} ({classification.capacity} Seater)
                            </span>
                        </div>
                    </div>
                    <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                        Seat #{selectedSeat < 10 ? `0${selectedSeat}` : selectedSeat}
                    </span>
                </div>
            ) : (
                <div className="text-center text-xs text-zinc-500 font-medium py-1">
                    Please pick an available seat number from the official {classification.name} layout.
                </div>
            )}
        </div>
    );
}
