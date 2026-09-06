"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Ban } from "lucide-react";

interface SeatPickerProps {
    totalSeats?: number;
    bookedSeats: number[]; // Array of seat numbers already booked
    selectedSeat: number | null;
    onSelectSeat: (seatNumber: number) => void;
}

export function SeatPicker({
    totalSeats = 45,
    bookedSeats = [],
    selectedSeat,
    onSelectSeat,
}: SeatPickerProps) {
    // Standard bus configuration: 4 seats per row (2 on left, aisle, 2 on right), 10 rows + 5 back seats = 45 seats
    const rows = 10;

    return (
        <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b pb-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded border bg-white dark:bg-zinc-800" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded bg-blue-600" />
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded bg-zinc-300 dark:bg-zinc-700" />
                    <span>Booked</span>
                </div>
            </div>

            {/* Front of Bus Indicator */}
            <div className="mb-6 flex items-center justify-between rounded-lg bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Driver Wheel 🛞</span>
                <span>Front of Bus</span>
                <span>Door 🚪</span>
            </div>

            {/* Bus Seat Grid */}
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, rowIndex) => {
                    const seat1 = rowIndex * 4 + 1;
                    const seat2 = rowIndex * 4 + 2;
                    const seat3 = rowIndex * 4 + 3;
                    const seat4 = rowIndex * 4 + 4;

                    return (
                        <div key={rowIndex} className="flex items-center justify-between gap-3">
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
                                            className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all ${
                                                isBooked
                                                    ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                                                    : isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                    : "border-zinc-200 bg-white text-zinc-800 hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                            <div className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                                AISLE
                            </div>

                            {/* Right Side (2 Seats) */}
                            <div className="flex gap-2">
                                {[seat3, seat4].map((seatNum) => {
                                    const isBooked = bookedSeats.includes(seatNum);
                                    const isSelected = selectedSeat === seatNum;

                                    return (
                                        <button
                                            key={seatNum}
                                            type="button"
                                            disabled={isBooked}
                                            onClick={() => onSelectSeat(seatNum)}
                                            className={`relative flex h-11 w-11 flex-col items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all ${
                                                isBooked
                                                    ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                                                    : isSelected
                                                    ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                    : "border-zinc-200 bg-white text-zinc-800 hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                        </div>
                    );
                })}

                {/* Back Row (Seats 41 to 45) */}
                <div className="pt-2">
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
                                    className={`relative flex h-11 flex-1 flex-col items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all ${
                                        isBooked
                                            ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                                            : isSelected
                                            ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "border-zinc-200 bg-white text-zinc-800 hover:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                    }`}
                                >
                                    {seatNum}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedSeat && (
                <div className="mt-6 flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-950/40">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        Selected Seat:
                    </span>
                    <span className="font-mono text-lg font-extrabold text-blue-600 dark:text-blue-400">
                        Seat #{selectedSeat < 10 ? `0${selectedSeat}` : selectedSeat}
                    </span>
                </div>
            )}
        </div>
    );
}
