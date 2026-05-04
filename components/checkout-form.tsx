"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, CreditCard, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Passenger {
    name: string;
    seatNumber: string;
    type: 'regular' | 'student' | 'senior' | 'pwd';
    price?: number;
    idNumber?: string;
    idPhotoUrl?: string;
}


export function CheckoutForm({ tripId, userId }: { tripId: string, userId: string }) {
    const router = useRouter();
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [bookingData, setBookingData] = useState<{ passengers: Passenger[], totalPrice: number } | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'counter' | 'gcash' | 'card'>('counter');

    useEffect(() => {
        const stored = sessionStorage.getItem('pendingBooking');
        if (stored) {
            try {
                 
                setBookingData(JSON.parse(stored));
            } catch {
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
            const reservationsToInsert = bookingData.passengers.map(p => ({
                customer_id: userId,
                trip_id: tripId,
                seat_number: p.seatNumber,
                passenger_name: p.name,
                total_price: p.price || 0,
                status: 'confirmed'
            }));

            const result = await supabase
                .from('reservations')
                .insert(reservationsToInsert);

            if (result.error) {
                // Next.js overlay triggers on console.error, so we use console.warn instead
                console.warn("Supabase returned an error:", result.error);
                setError(result.error.message || result.error.details || "Database rejected the booking.");
                setIsSubmitting(false);
                return;
            }

            sessionStorage.removeItem('pendingBooking');
            router.push('/dashboard?booking=success');
        } catch (err: unknown) {
            console.warn("Runtime exception during booking:", err);
            const errorMessage = err instanceof Error ? err.message : "A runtime exception occurred.";
            setError(errorMessage);
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
                {bookingData.passengers.map((p) => (
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
                    <h5 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Select Payment Method</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('counter')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${paymentMethod === 'counter' ? 'border-zinc-900 bg-zinc-50 text-zinc-900 dark:border-white dark:bg-zinc-800 dark:text-white' : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950'}`}
                        >
                            <ShieldCheck className="h-6 w-6" />
                            <span className="text-xs font-bold uppercase text-center">Pay at Counter</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('gcash')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${paymentMethod === 'gcash' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'border-zinc-200 bg-white text-zinc-500 hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-950'}`}
                        >
                            <div className="h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-[12px]">G</div>
                            <span className="text-xs font-bold uppercase text-center">GCash</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('card')}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${paymentMethod === 'card' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-zinc-200 bg-white text-zinc-500 hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-950'}`}
                        >
                            <CreditCard className="h-6 w-6" />
                            <span className="text-xs font-bold uppercase text-center">Credit / Debit</span>
                        </button>
                    </div>

                    {paymentMethod !== 'counter' ? (
                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 p-4 font-medium text-amber-800 dark:bg-amber-900/10 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-xs leading-relaxed">Online payments via PayMongo will be fully connected soon! For now, your reservation will be processed standardly.</p>
                        </div>
                    ) : (
                        <div className="mt-4 flex justify-between items-center py-2 px-1">
                            <span className="text-sm text-zinc-500">Transaction Fee</span>
                            <span className="text-sm font-bold text-emerald-600 uppercase">Waived</span>
                        </div>
                    )}
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
                By clicking &quot;Complete Booking&quot;, you agree to our terms of service.
            </p>
        </div>
    );
}
