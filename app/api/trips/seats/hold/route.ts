import { NextRequest, NextResponse } from "next/server";
import { slotHoldManager } from "@/lib/slot-hold";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limiter";
import { validateGuestCount } from "@/lib/validators";
import { SlotAlreadyTakenError } from "@/lib/seat-lock";

export async function POST(req: NextRequest) {
    // 1. Rate Limiting: Max 30 requests per 15 minutes per IP on sensitive seat operations
    const rateLimitResponse = await enforceRateLimit(req, "seat_hold", 30, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    try {
        const { tripId, seatNumber, action = "HOLD" } = body;

        if (!tripId) {
            return NextResponse.json({ success: false, error: "tripId is required." }, { status: 400 });
        }

        const seatValidation = validateGuestCount(seatNumber);
        if (!seatValidation.isValid) {
            return NextResponse.json({ success: false, error: seatValidation.error }, { status: 400 });
        }

        const clientIp = getClientIp(req);
        const holderId = req.cookies.get("superlines_auth_session")?.value || clientIp;

        if (action === "RELEASE") {
            slotHoldManager.releaseHold(tripId, seatValidation.count, holderId);
            return NextResponse.json({
                success: true,
                message: `Seat #${seatValidation.count} hold released.`,
                status: "available",
            });
        }

        // Action: HOLD - Sets status to 'pending' with hold_expires_at = NOW() + 10 minutes
        const holdResult = await slotHoldManager.holdSlot(tripId, seatValidation.count, holderId);

        return NextResponse.json({
            success: true,
            status: "pending",
            seatNumber: seatValidation.count,
            hold_expires_at: new Date(holdResult.holdExpiresAt).toISOString(),
            remaining_seconds: holdResult.remainingSeconds,
            message: `Seat #${seatValidation.count} temporarily held for 10 minutes. Complete booking before timer expires.`,
        });
    } catch (err: any) {
        if (err instanceof SlotAlreadyTakenError || err.statusCode === 409 || err.message?.includes("Slot already taken")) {
            return NextResponse.json(
                {
                    success: false,
                    error: err.message,
                    slot_already_taken: true,
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: err.message || "Failed to process seat hold." },
            { status: 500 }
        );
    }
}
