import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CreditCard, Wallet, Smartphone, ArrowRight, CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { PayNowButton } from "@/components/checkout/PayNowButton";

export default async function CheckoutPage({ params }: { params: { reservationId: string } }) {
    const { reservationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch Reservation and Trip Details
    const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
            *,
            trips (
                *,
                buses (*)
            )
        `)
        .eq('id', reservationId)
        .eq('customer_id', user.id)
        .single();

    if (error || !reservation) {
        notFound();
    }

    if (reservation.status !== 'pending') {
        redirect("/dashboard"); // Already processed
    }

    const trip = reservation.trips;

    return (
        <div className="container mx-auto max-w-4xl py-10 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Complete Your Payment</h1>
                <p className="text-muted-foreground italic text-sm">Your seat {reservation.seat_number} is reserved for 15 minutes. Please complete payment to secure your ticket.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Payment Methods */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Payment Method</CardTitle>
                            <CardDescription>All transactions are secured and encrypted.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <button className="group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                        <Smartphone className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="text-center text-sm font-bold">GCash</div>
                                    <div className="text-[10px] text-muted-foreground">Mobile Wallet</div>
                                </button>

                                <button className="group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                        <Wallet className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="text-center text-sm font-bold">Maya</div>
                                    <div className="text-[10px] text-muted-foreground">Digital Bank</div>
                                </button>

                                <button className="group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                        <CreditCard className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="text-center text-sm font-bold">Credit/Debit</div>
                                    <div className="text-[10px] text-muted-foreground">Visa, Mastercard</div>
                                </button>

                                <button className="group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                        <Smartphone className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="text-center text-sm font-bold">GrabPay</div>
                                    <div className="text-[10px] text-muted-foreground">Wallet & Points</div>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <span>Secure checkout powered by Superlines Payment Gateway.</span>
                    </div>
                </div>

                {/* Booking Order Summary */}
                <div className="space-y-6">
                    <Card className="border-2 border-red-500/20">
                        <CardHeader className="bg-red-50/50 dark:bg-red-900/10">
                            <CardTitle className="text-lg">Booking Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Reservation ID</span>
                                    <span className="font-mono text-[10px] font-bold">#{reservationId.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Route</span>
                                    <span className="font-bold">{trip.origin} → {trip.destination}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Seat</span>
                                    <span className="font-bold text-red-600 uppercase">Seat {reservation.seat_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Departure</span>
                                    <span className="font-bold">
                                        {new Date(trip.departure_time).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-dashed pt-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold text-red-600">₱{reservation.total_price?.toLocaleString()}</span>
                                </div>
                                <div className="rounded-lg bg-orange-50 p-3 text-[11px] text-orange-800 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50">
                                    <p className="font-bold flex items-center gap-1 mb-1">
                                        <ShieldCheck className="h-3 w-3" />
                                        REFUND POLICY
                                    </p>
                                    <p>Please note that a <strong>20% management fee</strong> will be deducted from your total amount in case of cancellations or refunds.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <PayNowButton reservationId={reservationId} />
                        </CardFooter>
                    </Card>

                    <Link href={`/book/${trip.id}`} className="block text-center text-sm text-muted-foreground hover:text-red-600 transition-colors">
                        Cancel and change seat
                    </Link>
                </div>
            </div>
        </div>
    );
}
