import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalBookings } from "@/lib/local-booking-store";
import { getTodayPH, buildDepartureIsoPH, isSameDatePH } from "@/lib/date-utils";
import { getBusClassification, getBusFare } from "@/lib/constants/bus-layouts";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const originQuery = (searchParams.get("origin") || "").trim();
        const destQuery = (searchParams.get("destination") || "").trim();
        const dateQuery = (searchParams.get("date") || searchParams.get("departureDate") || "").trim() || getTodayPH();
        const serviceClassQuery = (searchParams.get("serviceClass") || "").trim().toUpperCase();

        const supabase = await createClient();
        let dbTrips: any[] = [];

        try {
            const { data, error } = await supabase
                .from("trips")
                .select("*, bus:buses(bus_number, bus_type, seat_capacity)")
                .order("departure_time", { ascending: true })
                .limit(100);

            if (!error && data) {
                dbTrips = data;
            }
        } catch (e) {
            console.warn("Could not fetch trips from db:", e);
        }

        // Query occupied seats from trip_seats table
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
                if (b.seat_numbers && Array.isArray(b.seat_numbers)) {
                    b.seat_numbers.forEach(sNum => {
                        if (!occupiedSeatsMap[tripKey].includes(sNum)) {
                            occupiedSeatsMap[tripKey].push(sNum);
                        }
                    });
                }
            }
        });

        // Standard Superlines scheduled routes with accurate service classes, fleets, and daily departure times
        // Official Superlines Service Class Pricing:
        // - Regular Aircon: ₱850 (49 Seats)
        // - Super Deluxe: ₱950 (43 Seats with Onboard Restroom & Stairs)
        // - First Class: ₱1,100 (41 Seats Premier Reclining Sleeper with Onboard Restroom & Stairs)
        const dailyScheduleTemplates = [
            // Cubao -> Daet
            {
                origin: "Cubao",
                destination: "Daet",
                time: "06:00",
                busNumber: "SL-101 (Regular Aircon)",
                busType: "REGULAR AIRCON",
                fare: 850,
                capacity: 49
            },
            {
                origin: "Cubao",
                destination: "Daet",
                time: "12:00",
                busNumber: "SL-311 (Super Deluxe)",
                busType: "SUPER DELUXE",
                fare: 950,
                capacity: 43
            },
            {
                origin: "Cubao",
                destination: "Daet",
                time: "20:00",
                busNumber: "SL-102 (Regular Aircon)",
                busType: "REGULAR AIRCON",
                fare: 850,
                capacity: 49
            },
            {
                origin: "Cubao",
                destination: "Daet",
                time: "22:00",
                busNumber: "SL-330 (First Class)",
                busType: "FIRST CLASS",
                fare: 1100,
                capacity: 41
            },

            // Daet -> Cubao
            {
                origin: "Daet",
                destination: "Cubao",
                time: "07:00",
                busNumber: "SL-103 (Regular Aircon)",
                busType: "REGULAR AIRCON",
                fare: 850,
                capacity: 49
            },
            {
                origin: "Daet",
                destination: "Cubao",
                time: "13:00",
                busNumber: "SL-316 (Super Deluxe)",
                busType: "SUPER DELUXE",
                fare: 950,
                capacity: 43
            },
            {
                origin: "Daet",
                destination: "Cubao",
                time: "20:30",
                busNumber: "SL-104 (Regular Aircon)",
                busType: "REGULAR AIRCON",
                fare: 850,
                capacity: 49
            },
            {
                origin: "Daet",
                destination: "Cubao",
                time: "22:30",
                busNumber: "SL-331 (First Class)",
                busType: "FIRST CLASS",
                fare: 1100,
                capacity: 41
            },

            // PITX -> Daet
            {
                origin: "PITX",
                destination: "Daet",
                time: "08:30",
                busNumber: "SL-105 (Regular Aircon)",
                busType: "REGULAR AIRCON",
                fare: 850,
                capacity: 49
            },
            {
                origin: "PITX",
                destination: "Daet",
                time: "20:30",
                busNumber: "SL-319 (Super Deluxe)",
                busType: "SUPER DELUXE",
                fare: 950,
                capacity: 43
            },

            // Daet -> PITX
            {
                origin: "Daet",
                destination: "PITX",
                time: "09:00",
                busNumber: "SL-105 (Regular Aircon)",
                busType: "REGULAR AIRCON",
                fare: 850,
                capacity: 49
            },
            {
                origin: "Daet",
                destination: "PITX",
                time: "21:00",
                busNumber: "SL-319 (Super Deluxe)",
                busType: "SUPER DELUXE",
                fare: 950,
                capacity: 43
            },
        ];

        // Generate accurate scheduled trips for the exact requested date (and optionally neighboring days if no exact match)
        const targetDates = [dateQuery];

        const generatedTrips: any[] = [];
        for (const dateStr of targetDates) {
            for (const t of dailyScheduleTemplates) {
                const depIso = buildDepartureIsoPH(dateStr, t.time);
                const syntheticId = `sched-${t.origin.toLowerCase()}-${t.destination.toLowerCase()}-${dateStr}-${t.time.replace(":", "")}`;
                const tripKey = `${t.origin}_${t.destination}_${depIso}`;

                const occupied = occupiedSeatsMap[syntheticId] || occupiedSeatsMap[tripKey] || [3, 7, 12];

                generatedTrips.push({
                    id: syntheticId,
                    origin: t.origin,
                    destination: t.destination,
                    departure_time: depIso,
                    fare_amount: t.fare,
                    bus_number: t.busNumber,
                    bus_type: t.busType,
                    seat_capacity: t.capacity,
                    occupied_seats: occupied,
                });
            }
        }

        // DB trips matching requested date in Philippine Standard Time
        const matchingDbTrips = dbTrips
            .filter(t => t.departure_time && isSameDatePH(t.departure_time, dateQuery))
            .map(t => {
                const busClass = getBusClassification(t.bus?.bus_type || t.bus_type, t.bus?.bus_number || t.bus_number);
                return {
                    id: t.id,
                    origin: t.origin || t.route?.origin?.name || "Cubao",
                    destination: t.destination || t.route?.destination?.name || "Daet",
                    departure_time: t.departure_time,
                    fare_amount: t.fare_amount || t.price || busClass.fare || getBusFare(busClass.name),
                    bus_number: t.bus?.bus_number || t.bus_number || `SL-${busClass.assignedBuses[0]} (${busClass.name})`,
                    bus_type: busClass.alias[0] || busClass.name.toUpperCase(),
                    seat_capacity: t.bus?.seat_capacity || t.seat_capacity || busClass.capacity,
                    occupied_seats: occupiedSeatsMap[t.id] || [],
                };
            });

        // Centralized Data Flow: When Admin has scheduled trips in the DB for this date, use Admin trips exclusively
        let allTrips = matchingDbTrips.length > 0 ? matchingDbTrips : generatedTrips;

        // Filter by origin if supplied
        if (originQuery && originQuery.toLowerCase() !== "all") {
            allTrips = allTrips.filter(t => t.origin.toLowerCase().includes(originQuery.toLowerCase()));
        }

        // Filter by destination if supplied
        if (destQuery && destQuery.toLowerCase() !== "all") {
            allTrips = allTrips.filter(t => t.destination.toLowerCase().includes(destQuery.toLowerCase()));
        }

        // Filter by service class if supplied
        if (serviceClassQuery && serviceClassQuery !== "ALL") {
            allTrips = allTrips.filter(t => {
                const bType = (t.bus_type || "").toUpperCase();
                return bType.includes(serviceClassQuery) || serviceClassQuery.includes(bType);
            });
        }

        // Sort by departure_time ascending (accurate chronological order)
        allTrips.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());

        return NextResponse.json({
            success: true,
            date: dateQuery,
            origin: originQuery,
            destination: destQuery,
            serviceClass: serviceClassQuery,
            trips: allTrips,
            count: allTrips.length,
        });
    } catch (err: any) {
        console.error("Available trips API error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
