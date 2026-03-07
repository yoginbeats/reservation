"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, CreditCard, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Passenger {
    name: string;
    seatNumber: string;
    type: 'regular' | 'student' | 'senior' | 'pwd';
    price?: number;
    idNumber?: string;
    idPhotoUrl?: string;
}

interface CheckoutFormProps {
    tripId: string;
    passengers: Passenger[];
    totalPrice: number;
    userId: string;
}

export function CheckoutForm({ tripId, userId }: { tripId: string, userId: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookingData, setBookingData] = useState<{ passengers: Passenger[], totalPrice: number } | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('pendingBooking');
        if (stored) {
            try {
                setBookingData(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse booking data");
            }
        }
    }, []);

    if (!bookingData) {
        return <div className="animate-pulse h-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />;
    }

    const handleCompleteBooking = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Insert reservations for each passenger
            const reservations = bookingData.passengers.map(p => ({
                customer_id: userId,
                trip_id: tripId,
                seat_number: p.seatNumber,
                passenger_name: p.name,
                passenger_type: p.type,
                id_number: p.idNumber,
                id_photo_url: p.idPhotoUrl,
                total_price: p.price,
                status: 'confirmed'
            }));

            const { error: insertError } = await supabase
                .from('reservations')
                .insert(reservations);

            if (insertError) throw insertError;

            sessionStorage.removeItem('pendingBooking');
            router.push('/dashboard?booking=success');
        } catch (err: any) {
            console.error("Booking error:", err);
            setError(err.message || "An unexpected error occurred.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Travelers</span>
                </div>
                {bookingData.passengers.map((p, i) => (
                    <div key={p.seatNumber} className="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0">
                        <div className="space-y-0.5">
                            <span className="font-bold text-zinc-600 dark:text-zinc-400">Seat {p.seatNumber}</span>
                            <div className="text-[10px] font-black uppercase text-red-600 flex items-center gap-1.5">
                                {p.type === 'regular' ? 'Regular Fare' : `${p.type} Discount (20% Off)`}
                                {p.idNumber && (
                                    <>
                                        <span className="text-zinc-300">•</span>
                                        <span className="text-zinc-500 uppercase">ID: {p.idNumber}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <span className="font-black text-zinc-900 dark:text-zinc-50">{p.name}</span>
                    </div>
                ))}
            </div>
            {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="rounded-3xl bg-zinc-50 p-8 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-black uppercase tracking-tight">Secure Checkout</h4>
                        <p className="text-xs text-zinc-500 font-medium">Your data is encrypted and protected.</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm text-zinc-500">Payment Method</span>
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-zinc-400" />
                            <span className="text-sm font-bold">Pay at Counter / Reservation only</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-zinc-500">Transaction Fee</span>
                        <span className="text-sm font-bold text-emerald-600 uppercase">Waived</span>
                    </div>
                </div>

                <Button
                    className="w-full h-16 rounded-2xl bg-zinc-900 text-white font-black text-xl hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-tighter"
                    disabled={isSubmitting}
                    onClick={handleCompleteBooking}
                >
                    {isSubmitting ? (
                        "Processing Reservation..."
                    ) : (
                        <>
                            <CheckCircle2 className="h-6 w-6 stroke-[3]" />
                            Complete Booking
                        </>
                    )}
                </Button>
            </div>

            <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                By clicking "Complete Booking", you agree to our terms of service.
            </p>
        </div>
    );
}
