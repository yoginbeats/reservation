"use client";

import { Armchair, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Reservation {
    seat_number: string;
    passenger_name: string;
    passenger_type: string;
    id_number?: string;
    status: string;
}

interface VisualSeatMapProps {
    reservations: Reservation[];
    busType?: string;
}

interface LayoutRow {
    type: string;
    row: (number | null)[];
    gapLabel?: string;
    isLast?: boolean;
}

export function VisualSeatMap({ reservations, busType = "Regular Aircon" }: VisualSeatMapProps) {
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
        <TooltipProvider>
            <div className="relative mx-auto max-w-sm rounded-[3rem] border-8 border-zinc-100 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                {/* Front Labels */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="col-span-2 text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Driver</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Entrance</span>
                    </div>
                </div>

                <div className="relative space-y-4">
                    {/* Aisle Text Overlay */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-0">
                        <span className="text-[40px] font-black uppercase tracking-[0.5em] text-zinc-100 dark:text-zinc-900 print:text-zinc-400 vertical-text rotate-90 whitespace-nowrap select-none text-bold">
                            Aisle
                        </span>
                    </div>

                    {layoutRows.map((layoutRow, rowIndex) => {
                        const row = layoutRow.row;
                        const isLast = layoutRow.isLast;

                        return (
                            <div key={rowIndex} className="relative flex items-center justify-between z-10 font-bold">
                                <div className="flex gap-3">
                                    {row.slice(0, 2).map((seatNum, idx) => {
                                        if (seatNum === null) return <div key={idx} className="w-9 h-9" />;
                                        const reservation = reservations.find(r => r.seat_number === seatNum.toString());

                                        return (
                                            <SeatItem key={seatNum} seatNum={seatNum} reservation={reservation} />
                                        );
                                    })}
                                </div>

                                {isLast ? (
                                    <div className="contents">
                                        <SeatItem seatNum={row[2]!} reservation={reservations.find(r => r.seat_number === row[2]?.toString())} />
                                    </div>
                                ) : (
                                    <div className="w-6" /> // Aisle
                                )}

                                <div className="flex gap-3 relative">
                                    {layoutRow.gapLabel && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                                                {layoutRow.gapLabel}
                                            </span>
                                        </div>
                                    )}
                                    {row.slice(isLast ? 3 : 2).map((seatNum, idx) => {
                                        if (seatNum === null) return <div key={idx} className="w-9 h-9" />;
                                        const reservation = reservations.find(r => r.seat_number === seatNum.toString());

                                        return (
                                            <SeatItem key={seatNum} seatNum={seatNum} reservation={reservation} />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
}

function SeatItem({ seatNum, reservation }: { seatNum: number, reservation?: Reservation }) {
    if (!reservation) {
        return (
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-100 bg-white text-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
                <Armchair className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-[7px] font-black text-zinc-400 border border-white dark:border-zinc-950">
                    {seatNum}
                </span>
            </div>
        );
    }

    const isDiscounted = reservation.passenger_type && reservation.passenger_type !== 'regular';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={`
                    relative flex h-9 w-9 items-center justify-center rounded-lg border-2 cursor-help
                    ${isDiscounted
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-blue-600 bg-blue-50 text-blue-600'
                    }
                `}>
                    <User className="h-4 w-4" />
                    <span className={`
                        absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black text-white border border-white
                        ${isDiscounted ? 'bg-red-600' : 'bg-blue-600'}
                    `}>
                        {seatNum}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent className="p-3 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl" side="top">
                <div className="space-y-1.5 min-w-[120px]">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Passenger</p>
                    <p className="text-sm font-black text-zinc-950 dark:text-zinc-50">{reservation.passenger_name}</p>
                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${isDiscounted ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {reservation.passenger_type}
                        </span>
                        {reservation.id_number && (
                            <span className="text-[9px] font-bold text-zinc-500">#{reservation.id_number}</span>
                        )}
                    </div>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}

