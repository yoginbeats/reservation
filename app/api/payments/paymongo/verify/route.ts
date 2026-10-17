import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrievePayMongoCheckoutSession } from "@/lib/paymongo";

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

        const supabase = await createClient();

        // 1. Fetch current payment status
        const { data: payment, error: paymentError } = await supabase
            .from("payments")
            .select("id, payment_status, transaction_ref, amount")
            .eq("booking_id", bookingId)
            .maybeSingle();

        if (paymentError || !payment) {
            return NextResponse.json(
                { success: false, error: "Payment record not found." },
                { status: 404 }
            );
        }

        // If already marked as PAID, return immediately
        if (payment.payment_status === "PAID") {
            return NextResponse.json({
                success: true,
                status: "PAID",
                booking_id: bookingId,
            });
        }

        // 2. If PENDING and has a transaction_ref (Checkout Session ID), verify with PayMongo API
        if (payment.transaction_ref) {
            const session = await retrievePayMongoCheckoutSession(payment.transaction_ref);

            if (session.paid) {
                // Confirm booking, payment, and ticket
                await supabase
                    .from("bookings")
                    .update({ booking_status: "CONFIRMED" })
                    .eq("id", bookingId);

                await supabase
                    .from("payments")
                    .update({ payment_status: "PAID" })
                    .eq("booking_id", bookingId);

                await supabase
                    .from("tickets")
                    .update({ ticket_status: "VALID" })
                    .eq("booking_id", bookingId);

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
            status: payment.payment_status,
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
