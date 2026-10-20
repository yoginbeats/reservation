import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    requestLocalRefund,
    getAllLocalRefunds,
    updateLocalRefundStatus,
    getLocalBookingById,
    getLocalBookingByQrToken,
} from "@/lib/local-booking-store";

export async function POST(req: NextRequest) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON format." }, { status: 400 });
    }

    try {
        const {
            booking_id,
            qr_token,
            gcash_mobile,
            gcash_name,
            reason,
        } = body || {};

        if (!booking_id && !qr_token) {
            return NextResponse.json({ success: false, error: "Missing booking ID or ticket token." }, { status: 400 });
        }

        const cleanMobile = gcash_mobile ? String(gcash_mobile).trim().replace(/[^0-9]/g, "") : "";
        if (!cleanMobile || cleanMobile.length < 10) {
            return NextResponse.json({
                success: false,
                error: "Please enter a valid 11-digit GCash mobile number (e.g. 09171234567).",
            }, { status: 400 });
        }

        const cleanName = gcash_name ? String(gcash_name).trim() : "";
        if (!cleanName || cleanName.length < 2) {
            return NextResponse.json({
                success: false,
                error: "Please enter the registered GCash account owner's full name.",
            }, { status: 400 });
        }

        const identifier = booking_id || qr_token;

        // 1. Process in resilient local store
        const localResult = requestLocalRefund(
            identifier,
            cleanMobile,
            cleanName,
            reason || "Passenger requested online cancellation/refund"
        );

        if (!localResult.success && localResult.error) {
            return NextResponse.json({ success: false, error: localResult.error }, { status: 400 });
        }

        const refundData = localResult.refund;

        // 2. Synchronize to Supabase if database connection is available
        const supabase = await createClient();
        try {
            const targetId = booking_id || localResult.booking?.id;
            if (targetId) {
                // Cancel booking
                await supabase.from("bookings").update({ booking_status: "CANCELLED" }).eq("id", targetId);
                // Flag payment as refund pending
                await supabase.from("payments").update({ payment_status: "REFUND_PENDING" }).eq("booking_id", targetId);
                // Flag ticket as cancelled
                await supabase.from("tickets").update({ ticket_status: "CANCELLED" }).eq("booking_id", targetId);
                // Release seat in trip_seats so other passengers can book it
                await supabase.from("trip_seats").update({ is_available: true, booked_by_booking_id: null }).eq("booked_by_booking_id", targetId);
            }
        } catch (dbErr) {
            console.warn("Supabase refund sync notice (local backup active):", dbErr);
        }

        return NextResponse.json({
            success: true,
            message: "Online GCash Refund request successfully filed! Estimated settlement is 3 business days to 1 week.",
            refund: refundData,
            booking: localResult.booking,
        });
    } catch (err: any) {
        console.error("Ticket Refund API Error:", err);
        return NextResponse.json({ success: false, error: err.message || "Failed to process refund request." }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const ref = searchParams.get("refund_ref");
        const bookingId = searchParams.get("booking_id");
        const all = searchParams.get("all");

        if (all === "true") {
            const refunds = getAllLocalRefunds();
            return NextResponse.json({ success: true, refunds });
        }

        if (ref) {
            const allRefunds = getAllLocalRefunds();
            const matched = allRefunds.find(r => r.refund_ref.toUpperCase() === ref.trim().toUpperCase());
            if (matched) {
                return NextResponse.json({ success: true, refund: matched });
            }
            return NextResponse.json({ success: false, error: "Refund reference not found." }, { status: 404 });
        }

        if (bookingId) {
            const booking = getLocalBookingById(bookingId);
            if (booking && booking.refund_info) {
                return NextResponse.json({ success: true, refund: booking.refund_info });
            }
            return NextResponse.json({ success: false, error: "No refund requested for this booking." }, { status: 404 });
        }

        return NextResponse.json({ success: true, refunds: getAllLocalRefunds() });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    // Admin / Finance status update
    try {
        const body = await req.json();
        const { refund_ref, new_status, gcash_dispatched_ref, notes } = body;

        if (!refund_ref || !new_status) {
            return NextResponse.json({ success: false, error: "Missing refund_ref or new_status." }, { status: 400 });
        }

        const updated = updateLocalRefundStatus(refund_ref, new_status, gcash_dispatched_ref, notes);
        if (!updated) {
            return NextResponse.json({ success: false, error: "Refund record not found." }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Refund status updated to ${new_status}`,
            refund: updated.refund_info,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
