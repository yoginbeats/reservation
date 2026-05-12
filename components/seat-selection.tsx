"use client";

import { useState } from "react";
import { Armchair, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Seat {
    id: string;
    label: string;
    isTaken: boolean;
}

interface SeatSelectionProps {
    seats: Seat[];
    tripId: string;
    price: number;
    userId: string;
    busType?: string;
    passengerCount: number;
    returnDate?: string;
    returnOrigin?: string;
    returnDestination?: string;
}

interface LayoutRow {
    type: string;
    row: (number | null)[];
    gapLabel?: string;
    isLast?: boolean;
}

export function SeatSelection({ seats, tripId, price, userId, busType = "Regular Aircon", passengerCount, returnDate, returnOrigin, returnDestination }: SeatSelectionProps) {
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSeatClick = (seatId: string) => {
        if (selectedSeats.includes(seatId)) {
            // Deselect the seat
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
        } else {
            // Check if we've reached the passenger limit
            if (selectedSeats.length >= passengerCount) {
                toast(`You can only select up to ${passengerCount} seat${passengerCount > 1 ? 's' : ''}.`);
                return;
            }
            // Select the seat
            setSelectedSeats(prev => [...prev, seatId]);
        }
    };

    const handleContinue = () => {
        if (selectedSeats.length === 0) return;
        setIsSubmitting(true);
        let url = `/book/${tripId}/passengers?seats=${selectedSeats.join(',')}`;
        if (returnDate) {
            url += `&returnDate=${returnDate}&returnOrigin=${returnOrigin}&returnDestination=${returnDestination}`;
        }
        router.push(url);
    };

    const totalPrice = selectedSeats.length * price;

    // Custom layout rows for Deluxe/First Class (45 seats with CR)
    const deluxeLayoutRows: LayoutRow[] = [
        { type: 'seats', row: [1, 2, 3, 4] },
        { type: 'seats', row: [5, 6, 7, 8] },
        { type: 'seats', row: [9, 10, 11, 12] },
        { type: 'seats', row: [13, 14, 15, 16] },
        { type: 'seats', row: [17, 18, 19, 20] },
        { type: 'seats', row: [21, 22, null, null], gapLabel: 'Comfort Room' },
        { type: 'seats', row: [23, 24, null, null] },
        { type: 'seats', row: [25, 26, 27, 28] },
        { type: 'seats', row: [29, 30, 31, 32] },
        { type: 'seats', row: [33, 34, 35, 36] },
        { type: 'seats', row: [37, 38, 39, 40] },
        { type: 'seats', row: [41, 42, 43, 44, 45], isLast: true }
    ];

    // Custom layout rows for Regular Aircon (49 seats, no CR)
    const regularLayoutRows: LayoutRow[] = [
        { type: 'seats', row: [1, 2, 3, 4] },
        { type: 'seats', row: [5, 6, 7, 8] },
        { type: 'seats', row: [9, 10, 11, 12] },
        { type: 'seats', row: [13, 14, 15, 16] },
        { type: 'seats', row: [17, 18, 19, 20] },
        { type: 'seats', row: [21, 22, 23, 24] },
        { type: 'seats', row: [25, 26, 27, 28] },
        { type: 'seats', row: [29, 30, 31, 32] },
        { type: 'seats', row: [33, 34, 35, 36] },
        { type: 'seats', row: [37, 38, 39, 40] },
        { type: 'seats', row: [41, 42, 43, 44] },
        { type: 'seats', row: [45, 46, 47, 48, 49], isLast: true }
    ];

    const isRegular = busType.toLowerCase().includes('regular');
    const layoutRows = isRegular ? regularLayoutRows : deluxeLayoutRows;

    return (
        <div className="space-y-10">
            {/* Bus Layout Container */}
            <div className="relative mx-auto max-w-sm rounded-[3rem] border-8 border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

                {/* Front Labels */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="col-span-2 text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Driver Seat</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Entrance</span>
                    </div>
                </div>

                {/* Seats Grid */}
                <div className="relative space-y-4">
                    {/* Centered Aisle Label Overlay */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-0">
                        <span className="text-[40px] font-black uppercase tracking-[0.5em] text-zinc-600 vertical-text rotate-90 whitespace-nowrap select-none">
                            Aisle
                        </span>
                    </div>

                    {layoutRows.map((layoutRow, rowIndex) => {
                        if (layoutRow.type === 'label') return null;

                        const row = layoutRow.row as (number | null)[];
                        const isLast = layoutRow.isLast;

                        return (
                            <div key={rowIndex} className="relative flex items-center justify-between z-10">
                                <div className="flex gap-3">
                                    {row.slice(0, 2).map((seatNum, idx) => {
                                        if (seatNum === null) return <div key={idx} className="w-10 h-10" />;
                                        const seat = seats.find(s => s.id === seatNum.toString());
                                        if (!seat) return <div key={idx} className="w-10 h-10" />;

                                        const isSelected = selectedSeats.includes(seat.id);
                                        return (
                                            <button
                                                key={seat.id}
                                                disabled={seat.isTaken || isSubmitting}
                                                onClick={() => handleSeatClick(seat.id)}
                                                className={`
                                                    group relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all duration-200
                                                    ${seat.isTaken
                                                        ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20'
                                                        : isSelected
                                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg'
                                                            : 'border-blue-200 bg-white text-blue-600 hover:border-blue-400 dark:border-blue-800 dark:bg-zinc-900'
                                                    }
                                                `}
                                            >
                                                <Armchair className={`h-4 w-4 ${isSelected ? 'scale-110' : ''}`} />
                                                <span className={`absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black border ${isSelected ? 'bg-emerald-600 border-emerald-400 text-white' : seat.isTaken ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
                                                    {seat.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Aisle / Middle Seat */}
                                {isLast ? (
                                    <div className="contents">
                                        {(() => {
                                            const seatNum = row[2];
                                            if (seatNum === null) return <div className="w-10 h-10" />;
                                            const seat = seats.find(s => s.id === seatNum.toString());
                                            if (!seat) return <div className="w-10 h-10" />;
                                            const isSelected = selectedSeats.includes(seat.id);
                                            return (
                                                <button
                                                    disabled={seat.isTaken || isSubmitting}
                                                    onClick={() => handleSeatClick(seat.id)}
                                                    className={`group relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all duration-200 ${seat.isTaken ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-600' : isSelected ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg' : 'border-blue-200 bg-white text-blue-600 hover:border-blue-400'}`}
                                                >
                                                    <Armchair className="h-4 w-4" />
                                                    <span className={`absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black border ${isSelected ? 'bg-emerald-600 border-emerald-400 text-white' : seat.isTaken ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
                                                        {seat.label}
                                                    </span>
                                                </button>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="w-6" /> // Aisle space
                                )}

                                <div className="flex gap-3 relative">
                                    {layoutRow.gapLabel && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 whitespace-nowrap">
                                                {layoutRow.gapLabel}
                                            </span>
                                        </div>
                                    )}
                                    {row.slice(isLast ? 3 : 2).map((seatNum, idx) => {
                                        if (seatNum === null) return <div key={idx} className="w-10 h-10" />;
                                        const seat = seats.find(s => s.id === seatNum.toString());
                                        if (!seat) return <div key={idx} className="w-10 h-10" />;

                                        const isSelected = selectedSeats.includes(seat.id);
                                        return (
                                            <button
                                                key={seat.id}
                                                disabled={seat.isTaken || isSubmitting}
                                                onClick={() => handleSeatClick(seat.id)}
                                                className={`
                                                    group relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all duration-200
                                                    ${seat.isTaken
                                                        ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20'
                                                        : isSelected
                                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg'
                                                            : 'border-blue-200 bg-white text-blue-600 hover:border-blue-400 dark:border-blue-800 dark:bg-zinc-900'
                                                    }
                                                `}
                                            >
                                                <Armchair className={`h-4 w-4 ${isSelected ? 'scale-110' : ''}`} />
                                                <span className={`absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black border ${isSelected ? 'bg-emerald-600 border-emerald-400 text-white' : seat.isTaken ? 'bg-red-600 border-red-400 text-white' : 'bg-blue-600 border-blue-400 text-white'}`}>
                                                    {seat.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selection Summary & Legend */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-blue-600" />
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-red-600" />
                        <span>Reserved</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-emerald-600" />
                        <span>Selected</span>
                    </div>
                </div>

                <div className="rounded-3xl bg-zinc-50 p-6 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Selection</p>
                            <h4 className="text-sm font-bold">
                                {selectedSeats.length > 0
                                    ? `${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''} (${selectedSeats.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')})`
                                    : "No seats selected"
                                }
                            </h4>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Fare</p>
                            <p className="text-xl font-black text-red-600">₱{totalPrice.toLocaleString()}</p>
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-black hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all active:scale-[0.98]"
                        size="lg"
                        disabled={selectedSeats.length === 0 || isSubmitting}
                        onClick={handleContinue}
                    >
                        {isSubmitting ? "Processing..." : "Continue to Passenger Details"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
