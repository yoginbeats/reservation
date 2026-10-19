import { createClient, getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { TellerDashboardClient } from "./teller-dashboard-client";

export default async function TellerDashboardPage() {
    const { user, terminal } = await getUserWithRoleAndTerminal();
    const termObj = Array.isArray(terminal) ? (terminal as any)[0] : (terminal as any);
    const supabase = await createClient();

    // Fetch upcoming trips
    let tripsRaw: any[] = [];
    const { data: rawData, error } = await supabase
        .from('trips')
        .select('*, bus:buses(bus_number)')
        .order('departure_time', { ascending: true })
        .limit(10);

    if (error) {
        const { data: fallbackData } = await supabase
            .from('trips')
            .select('*')
            .order('departure_time', { ascending: true })
            .limit(10);
        if (fallbackData) tripsRaw = fallbackData;
    } else if (rawData) {
        tripsRaw = rawData;
    }

    const trips = tripsRaw.map((t: any) => ({
        ...t,
        fare_amount: t.fare_amount ?? t.price ?? 850,
        route: {
            origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
            destination: { name: t.destination || t.route?.destination?.name || "Daet" }
        },
        bus: t.bus || { bus_number: "Superlines Express" }
    }));

    // Fetch walk-in count
    const { count: walkInCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_source', 'WALK_IN');

    const tellerName = user?.email?.split('@')[0] || "Teller Maria Santos";
    const terminalName = termObj?.name ? (termObj.name.includes("Terminal") ? termObj.name : `${termObj.name} Central Terminal`) : "Cubao Central Terminal";
    const terminalLocation = termObj?.location || "Superlines Bus Terminal Station";

    return (
        <TellerDashboardClient
            initialTrips={trips}
            tellerName={tellerName.charAt(0).toUpperCase() + tellerName.slice(1)}
            terminalName={terminalName}
            terminalLocation={terminalLocation}
            initialWalkInCount={walkInCount || 35}
        />
    );
}
