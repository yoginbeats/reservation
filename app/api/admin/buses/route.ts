import { NextRequest, NextResponse } from "next/server";
import { getAllBuses, addBus, resetDefaultBuses, DEFAULT_BUSES } from "@/lib/bus-store";

// GET /api/admin/buses - Return all Superlines fleet units
export async function GET(req: NextRequest) {
    try {
        const buses = getAllBuses();
        return NextResponse.json({
            success: true,
            buses,
            count: buses.length,
        });
    } catch (err: any) {
        console.error("Error fetching buses:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to fetch fleet buses.", buses: DEFAULT_BUSES },
            { status: 500 }
        );
    }
}

// POST /api/admin/buses - Add bus or reset default fleet
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (body.action === "RESET_DEFAULTS") {
            const buses = resetDefaultBuses();
            return NextResponse.json({
                success: true,
                message: "Default Superlines fleet restored successfully.",
                buses,
            });
        }

        const { bus_number, bus_type, seat_capacity, fare, has_cr, features } = body;
        if (!bus_number) {
            return NextResponse.json(
                { success: false, error: "Bus number is required." },
                { status: 400 }
            );
        }

        const newBus = addBus({
            bus_number,
            bus_type: bus_type || "REGULAR_AIRCON",
            category: bus_type === "FIRST_CLASS" ? "First Class Premier" : bus_type === "SUPER_DELUXE" ? "Super Deluxe" : "Regular Aircon",
            seat_capacity: Number(seat_capacity) || (bus_type === "FIRST_CLASS" ? 41 : bus_type === "SUPER_DELUXE" ? 43 : 49),
            fare: Number(fare) || (bus_type === "FIRST_CLASS" ? 1100 : bus_type === "SUPER_DELUXE" ? 950 : 850),
            has_cr: Boolean(has_cr ?? (bus_type !== "REGULAR_AIRCON")),
            features: features || [],
            status: "ACTIVE",
        });

        return NextResponse.json({
            success: true,
            message: `Bus unit ${bus_number} added to fleet.`,
            bus: newBus,
        });
    } catch (err: any) {
        console.error("Error creating bus:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to add bus unit." },
            { status: 500 }
        );
    }
}
