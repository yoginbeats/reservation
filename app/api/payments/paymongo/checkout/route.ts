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

        // Ensure seats exist for this trip in trip_seats table before booking
        const { count } = await supabase
            .from("trip_seats")
            .select("id", { count: "exact", head: true })
            .eq("trip_id", tripId);

        if (!count || count === 0) {
            const seatsToInsert = Array.from({ length: 45 }, (_, i) => ({
                trip_id: tripId,
                seat_number: i + 1,
                is_available: true,
            }));
            await supabase.from("trip_seats").insert(seatsToInsert);
        }

        let bookingId: string | null = null;
        let qrToken: string | null = null;
        let ticketId: string | null = null;

        // Attempt atomic seat booking procedure in Supabase
        const { data: bookingResult, error: rpcError } = await supabase.rpc(
            "book_seat_atomic",
            {
                p_trip_id: tripId,
                p_seat_number: seatNumber,
                p_passenger_id: user?.id || null,
                p_passenger_name: passengerName,
                p_passenger_contact: passengerContact || "",
                p_total_price: Number(totalPrice),
                p_booking_source: "ONLINE",
                p_booking_terminal_id: null, // NULL for online bookings
                p_created_by: user?.id || null,
                p_payment_method: "PAYMONGO",
                p_transaction_ref: null,
            }
        );

        if (!rpcError && bookingResult?.booking_id) {
            bookingId = bookingResult.booking_id;
            qrToken = bookingResult.qr_token;
            ticketId = bookingResult.ticket_id;
        } else {
            console.warn("Atomic RPC unavailable or error, executing table fallback:", rpcError?.message || rpcError);

            // 1. Verify seat availability
            const { data: seatRecord } = await supabase
                .from("trip_seats")
                .select("*")
                .eq("trip_id", tripId)
                .eq("seat_number", seatNumber)
                .maybeSingle();

            if (seatRecord && !seatRecord.is_available) {
                return NextResponse.json(
                    { success: false, error: `Seat #${seatNumber} is already taken for this trip.` },
                    { status: 400 }
                );
            }

            // 2. Generate unique QR Token
            qrToken = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // 3. Create Booking
            const { data: newBooking, error: bookingErr } = await supabase
                .from("bookings")
                .insert({
                    trip_id: tripId,
                    passenger_id: user?.id || null,
                    passenger_name: passengerName,
                    passenger_contact: passengerContact || "",
                    seat_number: seatNumber,
                    total_price: Number(totalPrice),
                    booking_source: "ONLINE",
                    booking_terminal_id: null,
                    created_by: user?.id || null,
                    booking_status: "PENDING",
                })
                .select("id")
                .single();

            if (bookingErr || !newBooking) {
                console.error("Fallback booking insert error:", bookingErr);
                return NextResponse.json(
                    { success: false, error: bookingErr?.message || "Failed to create booking record." },
                    { status: 500 }
                );
            }

            bookingId = newBooking.id;

            // 4. Mark seat as occupied
            if (seatRecord) {
                await supabase
                    .from("trip_seats")
                    .update({ is_available: false, booked_by_booking_id: bookingId })
                    .eq("id", seatRecord.id);
            }

            // 5. Create Payment record
            await supabase
                .from("payments")
                .insert({
                    booking_id: bookingId,
                    amount: Number(totalPrice),
                    payment_method: "PAYMONGO",
                    payment_status: "PENDING",
                });

            // 6. Create Ticket record
            const { data: newTicket } = await supabase
                .from("tickets")
                .insert({
                    booking_id: bookingId,
                    qr_token: qrToken,
                    ticket_status: "PENDING",
                })
                .select("id")
                .maybeSingle();

            ticketId = newTicket?.id || null;
        }

        if (!bookingId) {
            return NextResponse.json(
                { success: false, error: "Failed to create or retrieve booking record." },
                { status: 500 }
            );
        }

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

        // Always update payments with the checkout session ID
        await supabase
            .from("payments")
            .update({ transaction_ref: checkoutSession.id })
            .eq("booking_id", bookingId);

        // If simulated or success, update payment/booking status for instant verification
        if (checkoutSession.is_simulated) {
            await supabase.from("bookings").update({ booking_status: "CONFIRMED" }).eq("id", bookingId);
            await supabase.from("payments").update({ payment_status: "PAID", transaction_ref: checkoutSession.id }).eq("booking_id", bookingId);
            await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("booking_id", bookingId);
        }

        return NextResponse.json({
            success: true,
            booking_id: bookingId,
            ticket_id: ticketId,
            qr_token: qrToken,
            checkout_url: checkoutSession.checkout_url,
            is_simulated: checkoutSession.is_simulated,
        });
    } catch (err: any) {
        console.error("Checkout API error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Server error processing checkout." },
            { status: 500 }
        );
    }
}
