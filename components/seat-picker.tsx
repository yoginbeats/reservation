"use client";

import { useState } from "react";
import { CheckCircle2, UserCheck, Armchair } from "lucide-react";

interface SeatPickerProps {
    totalSeats?: number;
    bookedSeats: number[]; // Array of seat numbers already booked
    selectedSeat: number | null;
    onSelectSeat: (seatNumber: number) => void;
    busType?: string; // "SUPER_DELUXE" | "DELUXE" | "AIRCON" | "STANDARD"
}

export function SeatPicker({
    totalSeats = 45,
    bookedSeats = [],
    selectedSeat,
    onSelectSeat,
    busType = "AIRCON",
}: SeatPickerProps) {
    const [viewBusType, setViewBusType] = useState<string>(busType);

    // Standard bus configuration: 4 seats per row (2 left, aisle, 2 right)
    // Row 5 right side has CR for DELUXE / SUPER DELUXE
    const isDeluxe = viewBusType === "DELUXE" || viewBusType === "SUPER_DELUXE";
    const crRow = 5; // Restroom row for Deluxe buses
    const rows = 10;

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
            {/* Bus Type Filter Tabs */}
            <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
                <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                        <Armchair className="h-5 w-5 text-red-600" />
                        <span>Interactive Bus Seat Map</span>
                    </h3>
                    <p className="text-xs text-zinc-500">Click an available seat to select</p>
                </div>
                <select
                    value={viewBusType}
                    onChange={(e) => setViewBusType(e.target.value)}
                    className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-500"
                >
                    <option value="AIRCON">Aircon (45 Seats)</option>
                    <option value="DELUXE">Deluxe with CR (38 Seats)</option>
                    <option value="SUPER_DELUXE">Super Deluxe with CR</option>
                </select>
            </div>

            {/* Seat Legend */}
            <div className="grid grid-cols-4 gap-2 rounded-xl bg-zinc-50 p-3 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded border border-zinc-300 bg-white dark:bg-zinc-900" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-blue-600" />
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-red-100 border border-red-300 text-red-600 dark:bg-red-950/60" />
                    <span>Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">CR</div>
                    <span>Restroom</span>
                </div>
            </div>

            {/* BUS FRAME CONTAINER */}
            <div className="relative rounded-3xl border-2 border-zinc-300 bg-zinc-100/80 p-5 dark:border-zinc-700 dark:bg-zinc-950/80 shadow-inner">
                {/* Windshield / Front of Bus Indicator */}
                <div className="mb-6 rounded-2xl bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 p-3 text-white shadow-md">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        {/* Driver Seat Indicator */}
                        <div className="flex items-center gap-1.5 bg-zinc-700/80 px-2.5 py-1 rounded-lg border border-zinc-600 text-amber-300">
                            <span>🛞</span>
                            <span>Driver</span>
                        </div>

                        <span className="text-[10px] font-extrabold text-zinc-400 tracking-widest">
                            FRONT WINDSHIELD
                        </span>

                        {/* Door Entrance Indicator */}
                        <div className="flex items-center gap-1.5 bg-emerald-800/80 px-2.5 py-1 rounded-lg border border-emerald-600 text-emerald-200">
                            <span>🚪</span>
                            <span>Entrance</span>
                        </div>
                    </div>
                </div>

                {/* Bus Seat Grid */}
                <div className="space-y-3">
                    {Array.from({ length: rows }).map((_, rowIndex) => {
                        const seat1 = rowIndex * 4 + 1;
                        const seat2 = rowIndex * 4 + 2;
                        const seat3 = rowIndex * 4 + 3;
                        const seat4 = rowIndex * 4 + 4;

                        // Restroom / CR placement for Deluxe buses at Row 5
                        const isCRRow = isDeluxe && rowIndex === crRow - 1;

                        return (
                            <div key={rowIndex} className="flex items-center justify-between gap-2">
                                {/* Left Side (2 Seats) */}
                                <div className="flex gap-2">
                                    {[seat1, seat2].map((seatNum) => {
                                        const isBooked = bookedSeats.includes(seatNum);
                                        const isSelected = selectedSeat === seatNum;

                                        return (
                                            <button
                                                key={seatNum}
                                                type="button"
                                                disabled={isBooked}
                                                onClick={() => onSelectSeat(seatNum)}
                                                className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-xl border font-mono text-xs font-black transition-all ${
                                                    isBooked
                                                        ? "cursor-not-allowed bg-red-100 border-red-200 text-red-500 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400 opacity-80"
                                                        : isSelected
                                                        ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                                                        : "border-zinc-300 bg-white text-zinc-800 hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 shadow-sm"
                                                }`}
                                            >
                                                {seatNum < 10 ? `0${seatNum}` : seatNum}
                                                {isSelected && (
                                                    <span className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-blue-600 shadow">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Aisle */}
                                <div className="text-[9px] font-mono font-black tracking-widest text-zinc-400 dark:text-zinc-600 uppercase">
                                    AISLE
                                </div>

                                {/* Right Side (2 Seats OR Restroom / CR) */}
                                <div className="flex gap-2">
                                    {isCRRow ? (
                                        <div className="flex h-11 w-24 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md gap-1.5 border border-purple-500">
                                            <span>🚽</span>
                                            <span>CR / Restroom</span>
                                        </div>
                                    ) : (
                                        [seat3, seat4].map((seatNum) => {
                                            const isBooked = bookedSeats.includes(seatNum);
                                            const isSelected = selectedSeat === seatNum;

                                            return (
                                                <button
                                                    key={seatNum}
                                                    type="button"
                                                    disabled={isBooked}
                                                    onClick={() => onSelectSeat(seatNum)}
                                                    className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-xl border font-mono text-xs font-black transition-all ${
                                                        isBooked
                                                            ? "cursor-not-allowed bg-red-100 border-red-200 text-red-500 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400 opacity-80"
                                                            : isSelected
                                                            ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                                                            : "border-zinc-300 bg-white text-zinc-800 hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 shadow-sm"
                                                    }`}
                                                >
                                                    {seatNum < 10 ? `0${seatNum}` : seatNum}
                                                    {isSelected && (
                                                        <span className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-blue-600 shadow">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Back Row (Seats 41 to 45) */}
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex justify-between gap-1.5">
                            {[41, 42, 43, 44, 45].map((seatNum) => {
                                const isBooked = bookedSeats.includes(seatNum);
                                const isSelected = selectedSeat === seatNum;

                                return (
                                    <button
                                        key={seatNum}
                                        type="button"
                                        disabled={isBooked}
                                        onClick={() => onSelectSeat(seatNum)}
                                        className={`relative flex h-11 flex-1 flex-col items-center justify-center rounded-xl border font-mono text-xs font-black transition-all ${
                                            isBooked
                                                ? "cursor-not-allowed bg-red-100 border-red-200 text-red-500 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400 opacity-80"
                                                : isSelected
                                                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                                                : "border-zinc-300 bg-white text-zinc-800 hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 shadow-sm"
                                        }`}
                                    >
                                        {seatNum}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Rear of Bus Indicator */}
                <div className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    REAR OF BUS / ENGINE
                </div>
            </div>

            {/* Selected Seat Footer Notification */}
            {selectedSeat ? (
                <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 p-4 dark:bg-blue-950/50 dark:border-blue-900">
                    <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                            Selected Bus Seat:
                        </span>
                    </div>
                    <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                        Seat #{selectedSeat < 10 ? `0${selectedSeat}` : selectedSeat}
                    </span>
                </div>
            ) : (
                <div className="text-center text-xs text-zinc-500 font-medium py-1">
                    Please pick an available seat number to continue booking.
                </div>
            )}
        </div>
    );
}
