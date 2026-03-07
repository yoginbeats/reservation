import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { BoardingPass } from "@/components/dashboard/boarding-pass";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TicketPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
            id,
            passenger_name,
            seat_number,
            passenger_type,
            status,
            customer_id,
            trips (
                origin,
                destination,
                departure_time,
                bus_number
            )
        `)
        .eq('id', id)
        .single();

    if (error || !reservation) {
        notFound();
    }

    // Security check: ensure the reservation belongs to the logged-in user
    if (reservation.customer_id !== user.id) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-8 print:hidden">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-red-600 transition-colors font-bold uppercase text-[10px] tracking-widest"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>

            <BoardingPass reservation={reservation as any} />
        </div>
    );
}
