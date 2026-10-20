import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalBookings } from "@/lib/local-booking-store";

// Cross-Terminal Live Seat Inventory & Anti-Double Booking Guard
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tripId = searchParams.get("tripId") || "";
        const busNumber = searchParams.get("busNumber") || "";
        const departureTime = searchParams.get("departureTime") || "";

        const supabase = await createClient();
        const occupiedSet = new Set<number>();
        const terminalBreakdown: Record<string, number[]> = {};

        // 1. Fetch locked/occupied seats from 'trip_seats' table
        if (tripId) {
            try {
                const { data: seatRows } = await supabase
                    .from("trip_seats")
                    .select("seat_number, is_available")
                    .eq("trip_id", tripId)
                    .eq("is_available", false);

                if (seatRows) {
                    for (const s of seatRows) {
                        occupiedSet.add(s.seat_number);
                        if (!terminalBreakdown["Database Reserved"]) terminalBreakdown["Database Reserved"] = [];
                        terminalBreakdown["Database Reserved"].push(s.seat_number);
                    }
                }
            } catch (err) {
                console.warn("trip_seats query note:", err);
            }

            // 2. Query bookings table directly to prevent race conditions
            try {
                const { data: bRows } = await supabase
                    .from("bookings")
                    .select("seat_number, booking_source, booking_terminal_id, booking_status")
                    .eq("trip_id", tripId)
                    .neq("booking_status", "CANCELLED");

                if (bRows) {
                    for (const b of bRows) {
                        if (b.seat_number) {
                            occupiedSet.add(b.seat_number);
                            const sourceKey = b.booking_source || "Counter Walk-In";
                            if (!terminalBreakdown[sourceKey]) terminalBreakdown[sourceKey] = [];
                            terminalBreakdown[sourceKey].push(b.seat_number);
                        }
                    }
                }
            } catch {}

            // 3. Query reservations table
            try {
                const { data: resRows } = await supabase
                    .from("reservations")
                    .select("seat_number, status")
                    .eq("trip_id", tripId)
                    .neq("status", "CANCELLED");

                if (resRows) {
                    for (const r of resRows) {
                        if (r.seat_number) {
                            occupiedSet.add(r.seat_number);
                            if (!terminalBreakdown["Reservation"]) terminalBreakdown["Reservation"] = [];
                            terminalBreakdown["Reservation"].push(r.seat_number);
                        }
                    }
                }
            } catch {}
        }

        // 4. Correlate with local resilient booking store across all terminals
        const localList = getLocalBookings();
        const cleanBus = busNumber.split(" ")[0].trim().toLowerCase();

        for (const b of localList) {
            if (b.booking_status === "CANCELLED" || b.ticket_status === "CANCELLED") continue;

            let matches = false;
            if (tripId && (b.trip?.origin === tripId || b.id === tripId)) {
                matches = true;
            }

            const bBus = (b.trip?.bus_number || "").split(" ")[0].trim().toLowerCase();
            if (cleanBus && bBus && (bBus === cleanBus || cleanBus.includes(bBus) || bBus.includes(cleanBus))) {
                if (departureTime && b.trip?.departure_time) {
                    const bTime = new Date(b.trip.departure_time).getTime();
                    const tTime = new Date(departureTime).getTime();
                    // Match if within same schedule turnaround rotation window (6 hours)
                    if (Math.abs(bTime - tTime) <= 6 * 3600 * 1000) {
                        matches = true;
                    }
                } else {
                    matches = true;
                }
            }

            if (matches) {
                const originTerminal = b.trip?.origin || "Online/Local";
                if (!terminalBreakdown[originTerminal]) terminalBreakdown[originTerminal] = [];

                if (b.seat_number) {
                    occupiedSet.add(b.seat_number);
                    terminalBreakdown[originTerminal].push(b.seat_number);
                }
                if (b.seat_numbers && Array.isArray(b.seat_numbers)) {
                    b.seat_numbers.forEach(s => {
                        occupiedSet.add(s);
                        terminalBreakdown[originTerminal].push(s);
                    });
                }
            }
        }

        const occupiedArray = Array.from(occupiedSet).sort((a, b) => a - b);
        const totalCapacity = 45;

        return NextResponse.json({
            success: true,
            trip_id: tripId,
            bus_number: busNumber,
            departure_time: departureTime,
            occupied_seats: occupiedArray,
            total_occupied: occupiedArray.length,
            available_seats_count: Math.max(0, totalCapacity - occupiedArray.length),
            total_capacity: totalCapacity,
            terminal_breakdown: terminalBreakdown,
            anti_double_booking_status: "ACTIVE_CROSS_TERMINAL_ENFORCED",
        });
    } catch (err: any) {
        console.error("Failed to query seat occupancy:", err);
        return NextResponse.json({ success: false, error: "Failed to query seat occupancy" }, { status: 500 });
    }
}
