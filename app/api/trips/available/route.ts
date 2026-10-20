import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalBookings } from "@/lib/local-booking-store";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const originQuery = searchParams.get("origin") || "";
        const destQuery = searchParams.get("destination") || "";

        const supabase = await createClient();
        let dbTrips: any[] = [];

        try {
            const { data, error } = await supabase
                .from("trips")
                .select("*, bus:buses(bus_number, bus_type, seat_capacity)")
                .order("departure_time", { ascending: true })
                .limit(30);

            if (!error && data) {
                dbTrips = data;
            }
        } catch (e) {
            console.warn("Could not fetch trips from db:", e);
        }

        // Query occupied seats from trip_seats and local bookings
        const occupiedSeatsMap: Record<string, number[]> = {};
        try {
            const { data: seatsData } = await supabase
                .from("trip_seats")
                .select("trip_id, seat_number, is_available")
                .eq("is_available", false);

            if (seatsData) {
                seatsData.forEach(s => {
                    if (!occupiedSeatsMap[s.trip_id]) occupiedSeatsMap[s.trip_id] = [];
                    occupiedSeatsMap[s.trip_id].push(s.seat_number);
                });
            }
        } catch {}

        // Add local bookings' occupied seats
        const localList = getLocalBookings();
        localList.forEach(b => {
            if (b.booking_status !== "CANCELLED" && b.ticket_status !== "CANCELLED") {
                const tripKey = `${b.trip?.origin}_${b.trip?.destination}_${b.trip?.departure_time}`;
                if (!occupiedSeatsMap[tripKey]) occupiedSeatsMap[tripKey] = [];
                if (b.seat_number && !occupiedSeatsMap[tripKey].includes(b.seat_number)) {
                    occupiedSeatsMap[tripKey].push(b.seat_number);
                }
            }
        });

        // Generate synthetic scheduled trips for the next 7 days to guarantee rich availability
        const generatedTrips: any[] = [];
        const routes = [
            { origin: "Cubao", destination: "Daet", times: ["06:00", "12:00", "20:00", "22:00"], fare: 850 },
            { origin: "Daet", destination: "Cubao", times: ["07:00", "13:00", "20:30", "22:30"], fare: 850 },
            { origin: "Alabang", destination: "Daet", times: ["07:30", "21:00"], fare: 850 },
            { origin: "Daet", destination: "Alabang", times: ["08:00", "21:30"], fare: 850 },
        ];

        const today = new Date();
        for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + dayOffset);
            const dateStr = targetDate.toISOString().slice(0, 10);

            for (const r of routes) {
                for (const t of r.times) {
                    const [h, m] = t.split(":");
                    const depDate = new Date(targetDate);
                    depDate.setHours(Number(h), Number(m), 0, 0);

                    const syntheticId = `sched-${r.origin.toLowerCase()}-${r.destination.toLowerCase()}-${dateStr}-${t.replace(":", "")}`;
                    const tripKey = `${r.origin}_${r.destination}_${depDate.toISOString()}`;
                    const occupied = occupiedSeatsMap[syntheticId] || occupiedSeatsMap[tripKey] || [3, 7, 12, 18];

                    generatedTrips.push({
                        id: syntheticId,
                        origin: r.origin,
                        destination: r.destination,
                        departure_time: depDate.toISOString(),
                        fare_amount: r.fare,
                        bus_number: `SL-${r.origin === "Cubao" ? "401" : "302"} (Superlines Aircon)`,
                        bus_type: "REGULAR AIRCON",
                        seat_capacity: 45,
                        occupied_seats: occupied,
                    });
                }
            }
        }

        // Merge DB trips with generated
        let allTrips = [...dbTrips.map(t => ({
            id: t.id,
            origin: t.origin || t.route?.origin?.name || "Cubao",
            destination: t.destination || t.route?.destination?.name || "Daet",
            departure_time: t.departure_time,
            fare_amount: t.fare_amount || 850,
            bus_number: t.bus?.bus_number || "Superlines Express",
            bus_type: t.bus?.bus_type || "REGULAR AIRCON",
            seat_capacity: t.bus?.seat_capacity || 45,
            occupied_seats: occupiedSeatsMap[t.id] || [],
        })), ...generatedTrips];

        // Filter if query requested
        if (originQuery) {
            allTrips = allTrips.filter(t => t.origin.toLowerCase().includes(originQuery.toLowerCase()));
        }
        if (destQuery) {
            allTrips = allTrips.filter(t => t.destination.toLowerCase().includes(destQuery.toLowerCase()));
        }

        return NextResponse.json({
            success: true,
            trips: allTrips,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
