import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerificationMode } from "@/lib/payment-settings";
import { saveLocalBooking, checkSeatOccupiedAcrossTerminals } from "@/lib/local-booking-store";

export async function POST(req: NextRequest) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON in request body." }, { status: 400 });
    }

    try {
        const {
            tripId,
            seatNumber,
            seatNumbers = [],
            passengerName,
            passengerContact,
            passengerEmail,
            totalPrice = 850,
            originalPrice,
            passengerType = "REGULAR",
            discountAmount = 0,
            discountIdNumber = "",
            discountCount = 0,
            discountedPassengers = [],
            gcashRefNumber,
        } = body;

        const effectiveSeatNumber = seatNumber || (seatNumbers && seatNumbers.length > 0 ? seatNumbers[0] : null);

        if (!tripId || !effectiveSeatNumber || !passengerName) {
            return NextResponse.json(
                { success: false, error: "Missing required booking details." },
                { status: 400 }
            );
        }

        if (!gcashRefNumber || gcashRefNumber.trim().length < 6) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid GCash Reference Number from your payment receipt." },
                { status: 400 }
            );
        }

        // =========================================================================
        // ANTI-DOUBLE BOOKING GUARD: VERIFY SEAT IS NOT TAKEN ACROSS ALL TERMINALS
        // =========================================================================
        const seatsToCheck = seatNumbers && seatNumbers.length > 0 ? seatNumbers : [Number(effectiveSeatNumber)];
        const busNumber = body.trip?.bus_number;
        const departureTime = body.trip?.departure_time;

        for (const sNum of seatsToCheck) {
            // A. Check local multi-terminal cache
            const localCheck = checkSeatOccupiedAcrossTerminals(sNum, busNumber, departureTime, tripId);
            if (localCheck.isOccupied) {
                const conf = localCheck.conflictInfo;
                return NextResponse.json(
                    {
                        success: false,
                        error: `Anti-Double Booking Alert: Seat #${sNum} has already been booked at ${conf?.terminal || "another"} terminal by ${conf?.passengerName || "another passenger"}. Please select an open seat.`
                    },
                    { status: 409 }
                );
            }
        }

        const mode = getVerificationMode();
        const isAuto = mode === "AUTO";
        const bookingStatus = isAuto ? "CONFIRMED" : "PENDING_VERIFICATION";
        const paymentStatus = isAuto ? "PAID" : "PENDING_VERIFICATION";
        const ticketStatus = isAuto ? "VALID" : "PENDING_VERIFICATION";

        const supabase = await createClient();

        // B. Check Supabase database seats directly
        for (const sNum of seatsToCheck) {
            try {
                const { data: seatRow } = await supabase
                    .from("trip_seats")
                    .select("is_available")
                    .eq("trip_id", tripId)
                    .eq("seat_number", sNum)
                    .maybeSingle();

                if (seatRow && seatRow.is_available === false) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: `Anti-Double Booking Alert: Seat #${sNum} has already been reserved. Please pick another seat.`
                        },
                        { status: 409 }
                    );
                }

                const { data: bRow } = await supabase
                    .from("bookings")
                    .select("id, booking_source")
                    .eq("trip_id", tripId)
                    .eq("seat_number", sNum)
                    .neq("booking_status", "CANCELLED")
                    .maybeSingle();

                if (bRow) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: `Anti-Double Booking Alert: Seat #${sNum} was already booked via ${bRow.booking_source || "counter terminal"}. Please select another seat.`
                        },
                        { status: 409 }
                    );
                }
            } catch {}
        }

        const { data: { user } } = await supabase.auth.getUser();

        let bookingId: string = crypto.randomUUID();
        const cleanRef = gcashRefNumber.trim();
        const qrToken = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // 1. Try atomic booking procedure with GCASH payment
        let atomicSuccess = false;
        try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                "book_seat_atomic",
                {
                    p_trip_id: tripId,
                    p_seat_number: seatNumber,
                    p_passenger_id: user?.id || null,
                    p_passenger_name: passengerName,
                    p_passenger_contact: passengerContact || "",
                    p_total_price: Number(totalPrice),
                    p_booking_source: "ONLINE",
                    p_booking_terminal_id: null,
                    p_created_by: user?.id || null,
                    p_payment_method: "GCASH_DIRECT",
                    p_transaction_ref: `GCASH-${cleanRef}`,
                }
            );

            if (!rpcErr && rpcRes?.booking_id) {
                bookingId = rpcRes.booking_id;
                atomicSuccess = true;
            }
        } catch {
            // Fall through to table inserts
        }

        if (!atomicSuccess) {
            // 2. Try inserting into 'bookings' table first
            let isUsingReservations = false;
            try {
                const { data: newBooking, error: bErr } = await supabase
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
                        booking_status: bookingStatus,
                    })
                    .select("id")
                    .single();

                if (newBooking && !bErr) {
                    bookingId = newBooking.id;
                } else {
                    // Try fallback to 'reservations'
                    const { data: newRes, error: resErr } = await supabase
                        .from("reservations")
                        .insert({
                            trip_id: tripId,
                            customer_id: user?.id || null,
                            passenger_name: passengerName,
                            seat_number: seatNumber,
                            total_price: Number(totalPrice),
                            status: bookingStatus,
                        })
                        .select("id")
                        .single();

                    if (newRes && !resErr) {
                        bookingId = newRes.id;
                        isUsingReservations = true;
                    }
                }
            } catch (err) {
                console.warn("Direct booking insert notice:", err);
            }

            // 3. Mark all selected seats in trip_seats
            try {
                for (const sNum of seatsToCheck) {
                    await supabase
                        .from("trip_seats")
                        .upsert({
                            trip_id: tripId,
                            seat_number: sNum,
                            is_available: false,
                            booked_by_booking_id: bookingId,
                        }, { onConflict: "trip_id,seat_number" });
                }
            } catch {}

            // 4. Create Payment record
            try {
                if (!isUsingReservations) {
                    const { error: payErr } = await supabase
                        .from("payments")
                        .insert({
                            booking_id: bookingId,
                            amount: Number(totalPrice),
                            payment_method: "GCASH_DIRECT",
                            payment_status: paymentStatus,
                            transaction_ref: `GCASH-${cleanRef}`,
                        });
                    if (payErr) {
                        await supabase
                            .from("payments")
                            .insert({
                                reservation_id: bookingId,
                                amount: Number(totalPrice),
                                payment_method: "GCASH_DIRECT",
                                status: paymentStatus,
                                transaction_id: `GCASH-${cleanRef}`,
                            });
                    }
                } else {
                    await supabase
                        .from("payments")
                        .insert({
                            reservation_id: bookingId,
                            amount: Number(totalPrice),
                            payment_method: "GCASH_DIRECT",
                            status: paymentStatus,
                            transaction_id: `GCASH-${cleanRef}`,
                        });
                }
            } catch {}

            // 5. Create Ticket record for each selected seat
            try {
                for (let i = 0; i < seatsToCheck.length; i++) {
                    const sNum = seatsToCheck[i];
                    const tToken = i === 0 ? qrToken : `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                    if (!isUsingReservations) {
                        const { error: tktErr } = await supabase
                            .from("tickets")
                            .insert({
                                booking_id: bookingId,
                                qr_token: tToken,
                                ticket_status: ticketStatus,
                                seat_number: sNum,
                            });
                        if (tktErr) {
                            await supabase
                                .from("tickets")
                                .insert({
                                    reservation_id: bookingId,
                                    qr_code: tToken,
                                });
                        }
                    } else {
                        await supabase
                            .from("tickets")
                            .insert({
                                reservation_id: bookingId,
                                qr_code: tToken,
                            });
                    }
                }
            } catch {}
        }

        // 6. Save to local resilient store so admin & user screens sync 100% reliably
        saveLocalBooking({
            id: bookingId,
            created_at: new Date().toISOString(),
            passenger_name: passengerName,
            passenger_contact: passengerContact || "",
            passenger_email: passengerEmail || "",
            passenger_type: passengerType as any,
            discount_amount: Number(discountAmount || 0),
            discount_id: discountIdNumber || (discountedPassengers[0]?.id_number || ""),
            discount_count: Number(discountCount || discountedPassengers.length || 0),
            discounted_passengers: discountedPassengers,
            seat_number: Number(effectiveSeatNumber),
            seat_numbers: seatNumbers.length > 0 ? seatNumbers : [Number(effectiveSeatNumber)],
            seat_count: seatNumbers.length > 0 ? seatNumbers.length : 1,
            total_price: Number(totalPrice),
            original_price: Number(originalPrice || totalPrice),
            booking_status: bookingStatus as any,
            payment_status: paymentStatus as any,
            payment_method: "GCASH_DIRECT",
            transaction_ref: `GCASH-${cleanRef}`,
            qr_token: qrToken,
            trip: {
                origin: body.trip?.origin || "Cubao",
                destination: body.trip?.destination || "Daet",
                departure_time: body.trip?.departure_time || new Date().toISOString(),
                bus_number: body.trip?.bus_number || "Superlines Express",
            }
        });

        return NextResponse.json({
            success: true,
            booking_id: bookingId,
            qr_token: qrToken,
            payment_status: paymentStatus,
            passenger_type: passengerType,
            discount_amount: discountAmount,
            discount_count: discountCount,
            discounted_passengers: discountedPassengers,
            total_price: totalPrice,
            verification_mode: mode,
            redirect_url: isAuto
                ? `/my-tickets?booking_id=${bookingId}&payment=success`
                : `/my-tickets?booking_id=${bookingId}&status=pending_verification`,
        });
    } catch (err: any) {
        console.error("GCash Direct Booking Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process GCash booking." },
            { status: 500 }
        );
    }
}
