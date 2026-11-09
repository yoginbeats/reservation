import { NextRequest, NextResponse } from "next/server";
import { getActiveScheduledTrips } from "@/lib/trip-store";
import { getLocalBookings } from "@/lib/local-booking-store";
import { getTodayPH, isSameDatePH } from "@/lib/date-utils";
import { getBusClassification, getBusFare } from "@/lib/constants/bus-layouts";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const originQuery = (searchParams.get("origin") || "").trim();
        const destQuery = (searchParams.get("destination") || "").trim();
        const dateQuery = (searchParams.get("date") || searchParams.get("departureDate") || "").trim();
        const serviceClassQuery = (searchParams.get("serviceClass") || "").trim().toUpperCase();

        // 1. Fetch strictly active scheduled trips created by the Admin
        const scheduledTrips = getActiveScheduledTrips();

        // If Admin has cleared all trips or not scheduled any yet, return clean empty list
        if (scheduledTrips.length === 0) {
            return NextResponse.json({
                success: true,
                date: dateQuery,
                origin: originQuery,
                destination: destQuery,
                serviceClass: serviceClassQuery,
                trips: [],
                count: 0,
                message: "No scheduled trips currently active. Please check back once departures are scheduled by Administration."
            });
        }

        // 2. Query occupied seats from local bookings
        const occupiedSeatsMap: Record<string, number[]> = {};
        const localList = getLocalBookings();
        localList.forEach(b => {
            if (b.booking_status !== "CANCELLED" && b.ticket_status !== "CANCELLED") {
                const tripKey = b.trip_id || `${b.trip?.origin}_${b.trip?.destination}_${b.trip?.departure_time}`;
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

        // 3. Normalize trips and filter by date, origin, destination
        let allTrips = scheduledTrips.map(t => {
            const busClass = getBusClassification(t.bus_type, t.bus_number);
            const tripKey = t.id;
            return {
                id: t.id,
                origin: t.origin,
                destination: t.destination,
                departure_time: t.departure_time,
                fare_amount: t.fare_amount || t.price || busClass.fare || getBusFare(busClass.name),
                bus_number: t.bus_number || `SL-${busClass.assignedBuses[0]} (${busClass.name})`,
                bus_type: busClass.alias[0] || busClass.name.toUpperCase(),
                seat_capacity: t.seat_capacity || busClass.capacity || 45,
                occupied_seats: occupiedSeatsMap[tripKey] || [],
            };
        });

        // Filter by date (if dateQuery provided)
        if (dateQuery) {
            allTrips = allTrips.filter(t => isSameDatePH(t.departure_time, dateQuery));
        }

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

        // Sort by departure_time ascending
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
