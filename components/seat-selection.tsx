"use client";

import { useState } from "react";
import { Armchair, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
}

export function SeatSelection({ seats, tripId, price, userId }: SeatSelectionProps) {
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSeatClick = (seatId: string) => {
        if (selectedSeat === seatId) {
            setSelectedSeat(null);
        } else {
            setSelectedSeat(seatId);
        }
    };

    const handleCheckout = async () => {
        if (!selectedSeat) return;

        setIsSubmitting(true);
        try {
            // 1. Create Reservation
            const { data: reservation, error } = await supabase
                .from('reservations')
                .insert({
                    customer_id: userId,
                    trip_id: tripId,
                    seat_number: selectedSeat,
                    total_price: price,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Redirect to Checkout
            router.push(`/checkout/${reservation.id}`);
        } catch (error) {
            console.error("Booking failed:", error);
            alert("Failed to create reservation. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-4 gap-4 max-w-xs mx-auto">
                {seats.map((seat) => (
                    <div key={seat.id} className="relative flex items-center justify-center">
                        <button
                            disabled={seat.isTaken || isSubmitting}
                            onClick={() => handleSeatClick(seat.id)}
                            className={`
                                group relative flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-all
                                ${seat.isTaken
                                    ? 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-600'
                                    : selectedSeat === seat.id
                                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                        : 'border-zinc-300 bg-white hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900'
                                }
                            `}
                        >
                            <Armchair className={`h-5 w-5 ${selectedSeat === seat.id ? 'animate-pulse' : ''}`} />
                            <span className={`
                                absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border
                                ${selectedSeat === seat.id
                                    ? 'bg-blue-600 border-blue-400 text-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800'
                                }
                            `}>
                                {seat.label}
                            </span>
                            {selectedSeat === seat.id && (
                                <Check className="absolute h-3 w-3 text-white" />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <div className="border-t pt-8 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-medium text-muted-foreground italic">
                        {selectedSeat ? `Seat ${selectedSeat} Selected` : "Please select a seat"}
                    </span>
                    {selectedSeat && (
                        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/20">
                            ₱{price.toLocaleString()}
                        </span>
                    )}
                </div>
                <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedSeat || isSubmitting}
                    onClick={handleCheckout}
                >
                    {isSubmitting ? "Processing..." : "Confirm & Proceed to Checkout"}
                </Button>
            </div>
        </div>
    );
}
