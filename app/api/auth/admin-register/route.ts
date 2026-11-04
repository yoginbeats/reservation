import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json(
        {
            success: false,
            error: "Access Denied: Public administrator registration is permanently disabled. Administrator credentials are provisioned exclusively by System Developers. Operational staff (Tellers and Conductors) must be issued credentials by an authorized Administrator inside the Superlines Admin Portal.",
        },
        { status: 403 }
    );
}

export async function GET() {
    return NextResponse.json(
        {
            success: false,
            error: "Method not allowed.",
        },
        { status: 405 }
    );
}
