import { createClient } from "@/lib/supabase/server";
import { TicketList } from "@/components/admin/ticket-list";

export default async function TicketsPage() {
    const supabase = await createClient();

    // Fetch 'confirmed' reservations which act as issued tickets
    const { data: tickets, error } = await supabase
        .from('reservations')
        .select(`
            *,
            trips (
                origin,
                destination,
                departure_time,
                buses (
                    bus_type,
                    bus_number
                )
            ),
            profiles:customer_id (
                full_name,
                email
            )
        `)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                    <p className="text-muted-foreground">Issue and validate event tickets seamlessly.</p>
                </div>
            </div>

            <TicketList initialTickets={tickets || []} />
        </div>
    );
}
