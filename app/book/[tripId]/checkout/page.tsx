import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Users, Ticket, Check } from "lucide-react";
import Link from "next/link";

export default async function CheckoutPage({
    params
}: {
    params: { tripId: string }
}) {
    const { tripId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch Trip Details
    const { data: trip, error } = await supabaseAdmin
        .from('trips')
        .select(`
            *,
            buses (*)
        `)
        .eq('id', tripId)
        .single();

    if (error || !trip) {
        notFound();
    }

    return (
        <div className="container mx-auto max-w-4xl py-10 space-y-8 px-4 sm:px-6">
            <Link
                href={`/book/${tripId}/passengers`}
                className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-red-600 transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Edit Passenger Info
            </Link>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Checkout Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-10 text-zinc-900 shadow-2xl dark:bg-zinc-900 dark:text-zinc-50 border border-zinc-100 dark:border-zinc-800">
                        <div className="relative z-10">
                            <h1 className="text-4xl font-black tracking-tight leading-none mb-4">Final <span className="text-red-600">Confirmation</span></h1>
                            <p className="text-zinc-500 font-medium max-w-sm">Please review your booking details before completing the reservation.</p>
                        </div>

                        <div className="mt-12 space-y-10">
                            {/* Trip Info Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Journey</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-black">{trip.origin}</span>
                                        <div className="flex h-1 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                                        <span className="text-2xl font-black">{trip.destination}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Fare Tier</div>
                                    <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-black text-red-600 dark:bg-red-900/20">
                                        <Ticket className="h-3.5 w-3.5" />
                                        {trip.buses?.bus_type}
                                    </div>
                                </div>
                            </div>

                            {/* Verification Step Component */}
                            <CheckoutForm
                                tripId={tripId}
                                userId={user.id}
                            />
                        </div>
                    </div>
                </div>

                {/* Vertical Step Guide */}
                <div className="space-y-6 lg:pt-12">
                    <div className="space-y-8 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800">
                        <div className="relative">
                            <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check className="h-4 w-4 stroke-[3]" />
                            </div>
                            <h5 className="text-xs font-black uppercase tracking-widest text-emerald-500">Seat Selected</h5>
                            <p className="text-xs text-zinc-400 font-medium mt-1">Personal space confirmed.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Check className="h-4 w-4 stroke-[3]" />
                            </div>
                            <h5 className="text-xs font-black uppercase tracking-widest text-emerald-500">Info Collected</h5>
                            <p className="text-xs text-zinc-400 font-medium mt-1">Traveler details ready.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[25px] flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white animate-pulse">
                                <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                            <h5 className="text-xs font-black uppercase tracking-widest text-red-600">Final Step</h5>
                            <p className="text-xs text-zinc-900 dark:text-zinc-100 font-bold mt-1">Review & Reserve.</p>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-zinc-950 p-8 text-white shadow-2xl">
                        <Users className="h-10 w-10 text-red-600 mb-4" />
                        <h6 className="font-black uppercase tracking-tight text-sm mb-2">Join the Club</h6>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Log in to save your traveler info for faster booking next time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
