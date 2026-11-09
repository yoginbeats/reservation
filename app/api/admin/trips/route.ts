import { NextRequest, NextResponse } from "next/server";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { 
    getActiveScheduledTrips, 
    addScheduledTrip, 
    updateScheduledTrip,
    deleteScheduledTrip, 
    clearAllScheduledTrips 
} from "@/lib/trip-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/admin/trips - Return all active scheduled trips (optionally filtered by ?date=YYYY-MM-DD)
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const dateQuery = url.searchParams.get("date");
        let trips = getActiveScheduledTrips();
        
        if (dateQuery && dateQuery !== "ALL") {
            trips = trips.filter(t => t.departure_time && t.departure_time.slice(0, 10) === dateQuery);
        }

        return NextResponse.json({
            success: true,
            trips,
            count: trips.length,
        }, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });
    } catch (err: any) {
        console.error("Error fetching scheduled trips:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to fetch scheduled trips." },
            { status: 500 }
        );
    }
}

// POST /api/admin/trips - Schedule a new trip (Admin only)
export async function POST(req: NextRequest) {
    try {
        const { user, role } = await getUserWithRoleAndTerminal();

        // Security check: Only Admin can schedule trips
        if (!user || role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Access Denied: Only Administrators can create scheduled trips." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const origin = (body.origin || "Cubao").trim();
        const destination = (body.destination || "Daet").trim();
        const departure_time = body.departure_time;
        const fare_amount = Number(body.fare_amount || body.price || 850);
        const bus_number = body.bus_number || "Superlines Express";
        const bus_type = body.bus_type || "REGULAR AIRCON";
        const seat_capacity = Number(body.seat_capacity || 45);

        if (!departure_time) {
            return NextResponse.json(
                { success: false, error: "Please provide a valid departure date and time." },
                { status: 400 }
            );
        }

        const newTrip = addScheduledTrip({
            origin,
            destination,
            departure_time,
            fare_amount,
            price: fare_amount,
            status: "SCHEDULED",
            bus_id: body.bus_id || null,
            bus_number,
            bus_type,
            seat_capacity,
            route_id: body.route_id || null,
            created_by: user.id,
        });

        return NextResponse.json({
            success: true,
            message: `Trip for ${origin} ➔ ${destination} scheduled successfully!`,
            trip: newTrip,
        });
    } catch (err: any) {
        console.error("Error scheduling trip:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to schedule trip." },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/trips - Update an existing scheduled trip (Admin only)
export async function PATCH(req: NextRequest) {
    try {
        const { user, role } = await getUserWithRoleAndTerminal();

        // Security check: Only Admin can modify scheduled trips
        if (!user || role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Access Denied: Only Administrators can update scheduled trips." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing trip ID parameter to update." },
                { status: 400 }
            );
        }

        const updated = updateScheduledTrip(id, updates);
        if (!updated) {
            return NextResponse.json(
                { success: false, error: `Scheduled trip ${id} not found.` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Trip for ${updated.origin} ➔ ${updated.destination} updated successfully across all portals!`,
            trip: updated,
        });
    } catch (err: any) {
        console.error("Error updating scheduled trip:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to update trip." },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/trips - Delete single trip or clear all trips (Admin only)
export async function DELETE(req: NextRequest) {
    try {
        const { user, role } = await getUserWithRoleAndTerminal();

        // Security check: Only Admin can delete trips
        if (!user || role !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Access Denied: Only Administrators can delete scheduled trips." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const clearAll = searchParams.get("all") === "true";
        const tripId = searchParams.get("id");

        if (clearAll) {
            clearAllScheduledTrips();
            return NextResponse.json({
                success: true,
                message: "All scheduled trips have been cleared clean. Zero departures active across all portals.",
            });
        }

        if (!tripId) {
            return NextResponse.json(
                { success: false, error: "Missing trip ID parameter to delete." },
                { status: 400 }
            );
        }

        deleteScheduledTrip(tripId);
        return NextResponse.json({
            success: true,
            message: `Scheduled trip #${tripId} has been deleted.`,
        });
    } catch (err: any) {
        console.error("Error deleting trip:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to delete trip." },
            { status: 500 }
        );
    }
}
