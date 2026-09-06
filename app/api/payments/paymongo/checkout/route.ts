import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayMongoCheckoutSession } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            tripId,
            seatNumber,
            passengerName,
            passengerContact,
            passengerEmail,
            totalPrice = 850,
        } = body;

        if (!tripId || !seatNumber || !passengerName) {
            return NextResponse.json(
                { success: false, error: "Missing required booking details." },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Call atomic seat booking procedure in Supabase
        const { data: bookingResult, error: rpcError } = await supabase.rpc(
            "book_seat_atomic",
            {
                p_trip_id: tripId,
                p_seat_number: seatNumber,
                p_passenger_id: user?.id || null,
                p_passenger_name: passengerName,
                p_passenger_contact: passengerContact || "",
                p_total_price: totalPrice,
                p_booking_source: "ONLINE",
                p_booking_terminal_id: null, // NULL for online bookings
                p_created_by: user?.id || null,
                p_payment_method: "PAYMONGO",
                p_transaction_ref: null,
            }
        );

        if (rpcError) {
            console.error("Atomic booking RPC error:", rpcError);
            return NextResponse.json(
                { success: false, error: rpcError.message || "Seat is already taken or unavailable." },
                { status: 400 }
            );
        }

        const bookingId = bookingResult?.booking_id;
        const originUrl = req.headers.get("origin") || "http://localhost:3000";

        // Create PayMongo Checkout Session
        const checkoutSession = await createPayMongoCheckoutSession({
            bookingId: bookingId,
            amountInCentavos: Math.round(totalPrice * 100),
            description: `Superlines Bus Ticket - Seat #${seatNumber}`,
            passengerName: passengerName,
            passengerEmail: passengerEmail || user?.email || "passenger@superlines.com",
            successUrl: `${originUrl}/my-tickets?booking_id=${bookingId}&payment=success`,
            cancelUrl: `${originUrl}/book?booking_id=${bookingId}&payment=cancelled`,
        });

        // If simulated or success, update payment/booking status for instant verification
        if (checkoutSession.is_simulated) {
            await supabase.from("bookings").update({ booking_status: "CONFIRMED" }).eq("id", bookingId);
            await supabase.from("payments").update({ payment_status: "PAID", transaction_ref: checkoutSession.id }).eq("booking_id", bookingId);
            await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("booking_id", bookingId);
        }

        return NextResponse.json({
            success: true,
            booking_id: bookingId,
            ticket_id: bookingResult?.ticket_id,
            qr_token: bookingResult?.qr_token,
            checkout_url: checkoutSession.checkout_url,
        });
    } catch (err: any) {
        console.error("Checkout API error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Server error processing checkout." },
            { status: 500 }
        );
    }
}
