import { NextRequest, NextResponse } from "next/server";
import { getUserWithRoleAndTerminal } from "@/lib/supabase/server";
import { getAllRoutes, getAllTerminals, addRoute, deleteRoute, resetDefaultRoutes } from "@/lib/route-store";

// GET /api/admin/routes - List all routes & terminals
export async function GET(req: NextRequest) {
    try {
        const routes = getAllRoutes();
        const terminals = getAllTerminals();

        return NextResponse.json({
            success: true,
            routes,
            terminals,
            count: routes.length,
        });
    } catch (err: any) {
        console.error("Error fetching routes:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to fetch routes." },
            { status: 500 }
        );
    }
}

// POST /api/admin/routes - Create a new travel route
export async function POST(req: NextRequest) {
    try {
        const { user, role } = await getUserWithRoleAndTerminal();

        // Ensure user is authorized
        if (user && role && role.toUpperCase() !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Access Denied: Administrator role required." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const {
            originName,
            destinationName,
            distance_km = 340,
            estimated_hours = 8.0,
            action,
        } = body;

        if (action === "RESET_DEFAULTS") {
            const routes = resetDefaultRoutes();
            return NextResponse.json({
                success: true,
                message: "Default routes successfully restored.",
                routes,
            });
        }

        if (!originName || !destinationName) {
            return NextResponse.json(
                { success: false, error: "Both Origin and Destination terminals are required." },
                { status: 400 }
            );
        }

        if (originName.trim().toLowerCase() === destinationName.trim().toLowerCase()) {
            return NextResponse.json(
                { success: false, error: "Origin and Destination terminals cannot be the same." },
                { status: 400 }
            );
        }

        const newRoute = addRoute({
            originName,
            destinationName,
            distance_km: Number(distance_km) || 340,
            estimated_hours: Number(estimated_hours) || 8.0,
        });

        return NextResponse.json({
            success: true,
            message: `Route ${newRoute.origin.name} ➔ ${newRoute.destination.name} created successfully!`,
            route: newRoute,
        });
    } catch (err: any) {
        console.error("Error creating route:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to create route." },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/routes - Delete a route
export async function DELETE(req: NextRequest) {
    try {
        const { user, role } = await getUserWithRoleAndTerminal();

        if (user && role && role.toUpperCase() !== "ADMIN") {
            return NextResponse.json(
                { success: false, error: "Access Denied: Administrator role required." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const routeId = searchParams.get("id");

        if (!routeId) {
            return NextResponse.json(
                { success: false, error: "Route ID is required for deletion." },
                { status: 400 }
            );
        }

        const success = deleteRoute(routeId);
        return NextResponse.json({
            success,
            message: success ? "Route deleted successfully." : "Route not found.",
        });
    } catch (err: any) {
        console.error("Error deleting route:", err);
        return NextResponse.json(
            { success: false, error: err?.message || "Failed to delete route." },
            { status: 500 }
        );
    }
}

