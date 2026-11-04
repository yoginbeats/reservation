import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrievePayMongoCheckoutSession } from "@/lib/paymongo";
import { getLocalBookingById, updateLocalBookingStatus } from "@/lib/local-booking-store";

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

        // 1. Check local booking cache
        const localBooking = getLocalBookingById(bookingId);
        if (localBooking) {
            if (localBooking.payment_status === "PAID" || localBooking.booking_status === "CONFIRMED") {
                return NextResponse.json({
                    success: true,
                    status: "PAID",
                    booking_id: bookingId,
                    verified: true,
                });
            }
        }

        // If returned with payment=success or simulated session
        if (urlPaymentStatus === "success" || (sessionId && (sessionId.startsWith("sim_") || sessionId.startsWith("cs_sim_")))) {
            // Update local booking store
            updateLocalBookingStatus(bookingId, "PAID", "CONFIRMED", "VALID");

            // Update Supabase Database records
            try {
                await supabase.from("bookings").update({ booking_status: "CONFIRMED" }).eq("id", bookingId);
                await supabase.from("reservations").update({ status: "CONFIRMED" }).eq("id", bookingId);
                await supabase.from("payments").update({ payment_status: "PAID" }).eq("booking_id", bookingId);
                await supabase.from("payments").update({ status: "PAID" }).eq("reservation_id", bookingId);
                await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("booking_id", bookingId);
                await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("reservation_id", bookingId);
            } catch (dbErr) {
                console.warn("Database status update notice:", dbErr);
            }

            return NextResponse.json({
                success: true,
                status: "PAID",
                booking_id: bookingId,
                verified: true,
            });
        }

        // 2. Fetch current payment status in database
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
            // Payments table check fallback
        }

        // If transaction reference exists, verify with PayMongo API
        const transactionRef = payment?.transaction_ref || payment?.transaction_id || sessionId;
        if (transactionRef) {
            const session = await retrievePayMongoCheckoutSession(transactionRef);
            if (session.paid) {
                updateLocalBookingStatus(bookingId, "PAID", "CONFIRMED", "VALID");

                try {
                    await supabase.from("bookings").update({ booking_status: "CONFIRMED" }).eq("id", bookingId);
                    await supabase.from("reservations").update({ status: "CONFIRMED" }).eq("id", bookingId);
                    await supabase.from("payments").update({ payment_status: "PAID" }).eq("booking_id", bookingId);
                    await supabase.from("payments").update({ status: "PAID" }).eq("reservation_id", bookingId);
                    await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("booking_id", bookingId);
                    await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("reservation_id", bookingId);
                } catch {}

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
            status: localBooking?.payment_status || "PENDING",
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
