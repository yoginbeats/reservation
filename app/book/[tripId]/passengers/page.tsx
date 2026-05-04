import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { PassengerForm } from "@/components/passenger-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import Link from "next/link";

export default async function PassengerDetailsPage({
    params,
    searchParams
}: {
    params: { tripId: string },
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { tripId } = await params;
    const { seats } = await searchParams;

    if (!seats) {
        redirect(`/book/${tripId}`);
    }

    const selectedSeats = (seats as string).split(',');
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
                href={`/book/${tripId}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-red-600 transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Return to Seat Selection
            </Link>

            <div className="">
                <PassengerForm
                    tripId={tripId}
                    selectedSeats={selectedSeats}
                    price={trip.price}
                    trip={trip}
                />
            </div>
        </div>
    );
}
