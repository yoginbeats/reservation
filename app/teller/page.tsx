import { createClient, getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { getActiveScheduledTrips } from "@/lib/trip-store";
import { getLocalBookings } from "@/lib/local-booking-store";
import { TellerDashboardClient } from "./teller-dashboard-client";

export default async function TellerDashboardPage() {
    const { user, terminal } = await getUserWithRoleAndTerminal();
    const termObj = Array.isArray(terminal) ? (terminal as any)[0] : (terminal as any);
    const supabase = await createClient();

    // Centralized: ONLY active trips scheduled by Admin in trip-store appear
    const scheduledTrips = getActiveScheduledTrips();
    const localList = getLocalBookings();

    const trips = scheduledTrips.map((t, idx) => {
        const originName = t.origin;
        const destName = t.destination;
        const busNum = t.bus_number || `BUS-${101 + idx}`;
        const bayNum = `Bay 0${(idx % 4) + 1}`;
        const capacity = t.seat_capacity || 49;

        // Compute real seat occupancy from local bookings store
        const tripBookings = localList.filter((b) =>
            (b.booking_status !== "CANCELLED" && b.ticket_status !== "CANCELLED") &&
            (b.trip_id === t.id || b.trip?.id === t.id || (b.trip?.origin === t.origin && b.trip?.destination === t.destination))
        );
        let bookedSeatsCount = 0;
        for (const b of tripBookings) {
            if (b.seat_numbers && b.seat_numbers.length > 0) {
                bookedSeatsCount += b.seat_numbers.length;
            } else if (b.seat_number) {
                bookedSeatsCount += 1;
            }
        }
        const remainingSeats = Math.max(0, capacity - bookedSeatsCount);

        let boardStatus: string = t.status || "SCHEDULED";
        const depTime = new Date(t.departure_time).getTime();
        const now = Date.now();
        const minutesUntil = Math.round((depTime - now) / 60000);

        if (t.status === "SCHEDULED" && minutesUntil <= 30 && minutesUntil > 0) {
            boardStatus = "BOARDING";
        } else if (t.status === "SCHEDULED" && minutesUntil <= 0) {
            boardStatus = "FINAL CALL";
        }

        return {
            id: t.id,
            bay_number: bayNum,
            route: `${originName} ➔ ${destName}`,
            origin: originName,
            destination: destName,
            bus_number: busNum,
            bus_type: t.bus_type || "REGULAR AIRCON",
            departure_time: t.departure_time,
            fare_amount: t.fare_amount || 850,
            status: boardStatus,
            capacity: capacity,
            booked_seats: bookedSeatsCount,
            available_seats: remainingSeats,
            is_almost_full: remainingSeats <= 5,
            minutes_until: minutesUntil,
        };
    });

    // Fetch walk-in count from local bookings
    const localWalkIns = localList.filter(b => b.booking_status !== "CANCELLED" && (b.payment_method === "CASH" || (b as any).booking_source === "WALK_IN")).length;

    // Fetch DB walk-in count as well
    let dbWalkInCount = 0;
    try {
        const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('booking_source', 'WALK_IN');
        dbWalkInCount = count || 0;
    } catch {}

    const totalWalkIns = Math.max(localWalkIns, dbWalkInCount);

    const tellerName = user?.email?.split('@')[0] || "Teller Staff";
    const terminalName = termObj?.name ? (termObj.name.includes("Terminal") ? termObj.name : `${termObj.name} Central Terminal`) : "Cubao Central Terminal";
    const terminalLocation = termObj?.location || "Superlines Bus Terminal Station";

    return (
        <TellerDashboardClient
            initialTrips={trips}
            tellerName={tellerName.charAt(0).toUpperCase() + tellerName.slice(1)}
            terminalName={terminalName}
            terminalLocation={terminalLocation}
            initialWalkInCount={totalWalkIns}
        />
    );
}
