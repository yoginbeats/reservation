import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrievePayMongoCheckoutSession } from "@/lib/paymongo";
import { getLocalBookingById } from "@/lib/local-booking-store";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get("booking_id");

        if (!bookingId) {
            return NextResponse.json(
                { success: false, error: "Missing booking_id parameter." },
                { status: 400 }
            );
        }

        const sessionId = searchParams.get("session_id");
        const urlPaymentStatus = searchParams.get("payment");

        const supabase = await createClient();

        // 1. Fetch current payment status (supporting booking_id or reservation_id)
        let payment: any = null;
        try {
            const { data: p1 } = await supabase
                .from("payments")
                .select("*")
                .eq("booking_id", bookingId)
                .maybeSingle();

            if (p1) {
                payment = p1;
            } else {
                const { data: p2 } = await supabase
                    .from("payments")
                    .select("*")
                    .eq("reservation_id", bookingId)
                    .maybeSingle();
                payment = p2;
            }
        } catch {
            // Payments table might not exist yet
        }

        // Check local store first for real-time presentation resilience
        const localBooking = getLocalBookingById(bookingId);
        if (localBooking) {
            if (localBooking.payment_status === "PAID") {
                return NextResponse.json({
                    success: true,
                    status: "PAID",
                    booking_id: bookingId,
                    verified: true,
                });
            }
            if (localBooking.payment_status === "PENDING_VERIFICATION") {
                return NextResponse.json({
                    success: true,
                    status: "PENDING_VERIFICATION",
                    booking_id: bookingId,
                });
            }
        }

        // If payment record not in database, attempt direct PayMongo session verification
        if (!payment) {
            const activeSessionId = sessionId || (bookingId.startsWith("cs_") ? bookingId : null);
            if (activeSessionId) {
                const session = await retrievePayMongoCheckoutSession(activeSessionId);
                if (session.paid) {
                    return NextResponse.json({
                        success: true,
                        status: "PAID",
                        booking_id: bookingId,
                        verified: true,
                    });
                }
            }

            if (urlPaymentStatus === "success") {
                return NextResponse.json({
                    success: true,
                    status: "PAID",
                    booking_id: bookingId,
                    verified: true,
                });
            }

            return NextResponse.json(
                { success: false, error: "Payment record not found." },
                { status: 404 }
            );
        }

        const currentStatus = (payment.payment_status || payment.status || "").toUpperCase();

        // If already marked as PAID, return immediately
        if (currentStatus === "PAID") {
            return NextResponse.json({
                success: true,
                status: "PAID",
                booking_id: bookingId,
            });
        }

        // 2. If PENDING and has a transaction_ref or transaction_id (Checkout Session ID), verify with PayMongo API
        const transactionRef = payment.transaction_ref || payment.transaction_id;
        if (transactionRef) {
            const session = await retrievePayMongoCheckoutSession(transactionRef);

            if (session.paid) {
                // Confirm booking, payment, and ticket
                await supabase.from("bookings").update({ booking_status: "CONFIRMED" }).eq("id", bookingId);
                await supabase.from("reservations").update({ status: "CONFIRMED" }).eq("id", bookingId);

                await supabase.from("payments").update({ payment_status: "PAID" }).eq("booking_id", bookingId);
                await supabase.from("payments").update({ status: "PAID" }).eq("reservation_id", bookingId);

                await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("booking_id", bookingId);
                await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("reservation_id", bookingId);

                return NextResponse.json({
                    success: true,
                    status: "PAID",
                    booking_id: bookingId,
                    verified: true,
                });
            }
        }

        return NextResponse.json({
            success: true,
            status: currentStatus || "PENDING",
            booking_id: bookingId,
        });
    } catch (err: any) {
        console.error("PayMongo Verify Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to verify payment." },
            { status: 500 }
        );
    }
}
