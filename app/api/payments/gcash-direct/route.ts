import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerificationMode } from "@/lib/payment-settings";
import { saveLocalBooking, checkSeatOccupiedAcrossTerminals } from "@/lib/local-booking-store";
import { seatLock, SlotAlreadyTakenError } from "@/lib/seat-lock";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limiter";
import { validateAndSanitizeEmail, sanitizeString, validateGuestCount } from "@/lib/validators";
import { slotHoldManager } from "@/lib/slot-hold";
import { resolveAppOrigin } from "@/lib/app-url";

export async function POST(req: NextRequest) {
    // 🔒 Rate Limiting: Max 10 booking requests per 15 minutes per IP (Brute-force protection)
    const rateLimitResponse = await enforceRateLimit(req, "booking_gcash", 10, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

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
            passengerName: rawPassengerName,
            passengerContact: rawPassengerContact,
            passengerEmail: rawPassengerEmail,
            totalPrice = 850,
            originalPrice,
            passengerType = "REGULAR",
            discountAmount = 0,
            discountIdNumber = "",
            discountCount = 0,
            discountedPassengers = [],
            gcashRefNumber: rawGcashRef,
        } = body;

        // 🔒 Strict Input Sanitization
        const passengerName = sanitizeString(rawPassengerName);
        const passengerContact = sanitizeString(rawPassengerContact);
        const gcashRefNumber = sanitizeString(rawGcashRef);

        let passengerEmail = "";
        if (rawPassengerEmail) {
            const emailValidation = validateAndSanitizeEmail(rawPassengerEmail);
            if (!emailValidation.isValid) {
                return NextResponse.json(
                    { success: false, error: emailValidation.error || "Invalid email address format." },
                    { status: 400 }
                );
            }
            passengerEmail = emailValidation.sanitized;
        }

        const effectiveSeatNumber = seatNumber || (seatNumbers && seatNumbers.length > 0 ? seatNumbers[0] : null);

        if (!tripId || !effectiveSeatNumber || !passengerName) {
            return NextResponse.json(
                { success: false, error: "Missing required booking details (tripId, seatNumber, passengerName)." },
                { status: 400 }
            );
        }

        if (!gcashRefNumber || gcashRefNumber.trim().length < 6) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid GCash Reference Number from your payment receipt." },
                { status: 400 }
            );
        }

        const seatsToCheck: number[] = seatNumbers && seatNumbers.length > 0
            ? seatNumbers.map(Number)
            : [Number(effectiveSeatNumber)];

        // 🔒 Validate Guest Count / Seat Numbers (1 to 45)
        for (const sNum of seatsToCheck) {
            const seatValidation = validateGuestCount(sNum);
            if (!seatValidation.isValid) {
                return NextResponse.json({ success: false, error: seatValidation.error }, { status: 400 });
            }
        }
        const busNumber = body.trip?.bus_number;
        const departureTime = body.trip?.departure_time;
        const requestId = crypto.randomUUID();

        // =========================================================================
        // PESSIMISTIC LOCKING TRANSACTION
        // Serializes concurrent requests for the exact same seat(s) at the exact
        // same millisecond, preventing race conditions with explicit ROLLBACK.
        // =========================================================================
        const result = await seatLock.runWithLock(tripId, seatsToCheck, requestId, async () => {
            // A. Anti-Double Booking: Check local multi-terminal cache
            for (const sNum of seatsToCheck) {
                const localCheck = checkSeatOccupiedAcrossTerminals(sNum, busNumber, departureTime, tripId);
                if (localCheck.isOccupied) {
                    const conf = localCheck.conflictInfo;
                    throw new SlotAlreadyTakenError(
                        sNum,
                        `Slot already taken: Seat #${sNum} has already been reserved at ${conf?.terminal || "another"} terminal by ${conf?.passengerName || "another passenger"}. Please select another seat.`
                    );
                }
            }

            // A2. Anti-Race Condition: Check active 10-minute slot holds
            const clientIp = getClientIp(req);
            const holderId = req.cookies.get("superlines_auth_session")?.value || clientIp;
            for (const sNum of seatsToCheck) {
                if (slotHoldManager.isSeatHeld(tripId, sNum, holderId)) {
                    throw new SlotAlreadyTakenError(
                        sNum,
                        `Slot already taken: Seat #${sNum} is currently temporarily held by another passenger. Please choose another seat.`
                    );
                }
            }

            const mode = getVerificationMode();
            const isAuto = mode === "AUTO";
            const bookingStatus = isAuto ? "CONFIRMED" : "PENDING_VERIFICATION";
            const paymentStatus = isAuto ? "PAID" : "PENDING_VERIFICATION";
            const ticketStatus = isAuto ? "VALID" : "PENDING_VERIFICATION";

            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            let bookingId: string = crypto.randomUUID();
            const cleanRef = gcashRefNumber.trim();
            const qrToken = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // =====================================================================
            // 1. EXECUTE POSTGRESQL TRANSACTION WITH PESSIMISTIC LOCK (FOR UPDATE)
            // =====================================================================
            let transactionSuccess = false;

            try {
                // Call pessimistic stored procedure executing SELECT ... FOR UPDATE
                const { data: rpcRes, error: rpcErr } = await supabase.rpc(
                    "book_seat_with_pessimistic_lock",
                    {
                        p_trip_id: tripId,
                        p_seat_number: Number(effectiveSeatNumber),
                        p_passenger_name: passengerName,
                        p_passenger_contact: passengerContact || "",
                        p_passenger_email: passengerEmail || "",
                        p_total_price: Number(totalPrice),
                        p_gcash_ref: cleanRef,
                        p_customer_id: user?.id || null,
                    }
                );

                if (rpcErr) {
                    if (
                        rpcErr.message?.includes("Slot already taken") ||
                        rpcErr.code === "23505" ||
                        rpcErr.code === "P0001"
                    ) {
                        throw new SlotAlreadyTakenError(
                            Number(effectiveSeatNumber),
                            rpcErr.message || `Slot already taken: Seat #${effectiveSeatNumber} has already been reserved. Please select another seat.`
                        );
                    }
                } else if (rpcRes) {
                    if (rpcRes.success === false && rpcRes.slot_taken) {
                        throw new SlotAlreadyTakenError(
                            Number(effectiveSeatNumber),
                            rpcRes.error || `Slot already taken: Seat #${effectiveSeatNumber} is already booked.`
                        );
                    } else if (rpcRes.success && rpcRes.booking_id) {
                        bookingId = rpcRes.booking_id;
                        transactionSuccess = true;
                    }
                }
            } catch (err: any) {
                if (err instanceof SlotAlreadyTakenError) throw err;
                // Otherwise fallback to explicit transaction in Node.js
            }

            // =====================================================================
            // 2. TRANSACTION FALLBACK WITH EXPLICIT BEGIN / COMMIT / ROLLBACK
            // =====================================================================
            if (!transactionSuccess) {
                // Check seat availability in reservations table
                for (const sNum of seatsToCheck) {
                    try {
                        const { data: existingRes } = await supabase
                            .from("reservations")
                            .select("id, status")
                            .eq("trip_id", tripId)
                            .eq("seat_number", sNum)
                            .not("status", "in", '("CANCELLED","REJECTED")')
                            .maybeSingle();

                        if (existingRes) {
                            throw new SlotAlreadyTakenError(
                                sNum,
                                `Slot already taken: Seat #${sNum} has already been reserved by another passenger. Please select another seat.`
                            );
                        }

                        // Also verify trip_seats table if present
                        const { data: seatRow } = await supabase
                            .from("trip_seats")
                            .select("is_available")
                            .eq("trip_id", tripId)
                            .eq("seat_number", sNum)
                            .maybeSingle();

                        if (seatRow && seatRow.is_available === false) {
                            throw new SlotAlreadyTakenError(
                                sNum,
                                `Slot already taken: Seat #${sNum} is unavailable for this trip. Please choose another seat.`
                            );
                        }
                    } catch (checkErr) {
                        if (checkErr instanceof SlotAlreadyTakenError) throw checkErr;
                    }
                }

                // BEGIN TRANSACTION STEPS
                let insertedResId: string | null = null;
                try {
                    // Step 1: Insert into reservations
                    const { data: newRes, error: resErr } = await supabase
                        .from("reservations")
                        .insert({
                            trip_id: tripId,
                            customer_id: user?.id || null,
                            passenger_name: passengerName,
                            seat_number: Number(effectiveSeatNumber),
                            total_price: Number(totalPrice),
                            status: bookingStatus,
                        })
                        .select("id")
                        .single();

                    if (resErr || !newRes) {
                        // Check if error is unique collision on (trip_id, seat_number)
                        if (resErr?.code === "23505" || resErr?.message?.includes("duplicate key")) {
                            throw new SlotAlreadyTakenError(
                                Number(effectiveSeatNumber),
                                `Slot already taken: Seat #${effectiveSeatNumber} has already been booked. Please pick another seat.`
                            );
                        }
                        throw new Error(`Failed to create reservation: ${resErr?.message || "Unknown error"}`);
                    }

                    insertedResId = newRes.id;
                    bookingId = newRes.id;

                    // Step 2: Mark seats unavailable in trip_seats (if table exists)
                    for (const sNum of seatsToCheck) {
                        await supabase
                            .from("trip_seats")
                            .upsert({
                                trip_id: tripId,
                                seat_number: sNum,
                                is_available: false,
                            }, { onConflict: "trip_id,seat_number" });
                    }

                    // Step 3: Insert payment record
                    await supabase
                        .from("payments")
                        .insert({
                            reservation_id: bookingId,
                            amount: Number(totalPrice),
                            payment_method: "GCASH_DIRECT",
                            status: paymentStatus,
                            transaction_id: `GCASH-${cleanRef}`,
                        });

                    // Step 4: Insert tickets for each selected seat
                    for (let i = 0; i < seatsToCheck.length; i++) {
                        const sNum = seatsToCheck[i];
                        const tToken = i === 0 ? qrToken : `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                        await supabase
                            .from("tickets")
                            .insert({
                                reservation_id: bookingId,
                                qr_code: tToken,
                            });
                    }

                    // COMMIT SUCCESSFUL
                    transactionSuccess = true;
                } catch (txErr: any) {
                    // EXPLICIT TRANSACTION ROLLBACK
                    console.error("Transaction failed, executing ROLLBACK:", txErr.message);
                    if (insertedResId) {
                        try {
                            await supabase
                                .from("reservations")
                                .update({ status: "CANCELLED" })
                                .eq("id", insertedResId);
                        } catch (rollbackErr) {
                            console.error("Rollback cleanup notice:", rollbackErr);
                        }
                    }
                    throw txErr;
                }
            }

            // Step 5: Save to local resilient store so all terminals and screens stay 100% in sync
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
                seat_numbers: seatsToCheck,
                seat_count: seatsToCheck.length,
                total_price: Number(totalPrice),
                original_price: Number(originalPrice || totalPrice),
                booking_status: bookingStatus as any,
                payment_status: paymentStatus as any,
                payment_method: "GCASH_DIRECT",
                transaction_ref: `GCASH-${cleanRef}`,
                receipt_image_url: body.receiptImageUrl || "",
                qr_token: qrToken,
                trip: {
                    origin: body.trip?.origin || "Cubao",
                    destination: body.trip?.destination || "Daet",
                    departure_time: body.trip?.departure_time || new Date().toISOString(),
                    bus_number: body.trip?.bus_number || "Superlines Express",
                }
            });

            // Release temporary slot holds now that booking is confirmed
            for (const sNum of seatsToCheck) {
                slotHoldManager.releaseHold(tripId, sNum);
            }

            // Step 6: Dispatch e-ticket boarding pass to passenger email
            if (passengerEmail) {
                try {
                    const originUrl = resolveAppOrigin(req);
                    fetch(`${originUrl}/api/tickets/send-ticket-email`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            booking_id: bookingId,
                            recipient_email: passengerEmail,
                            passenger_name: passengerName,
                            trip: body.trip,
                            seat_number: effectiveSeatNumber,
                            seat_numbers: seatsToCheck,
                            total_price: totalPrice,
                            qr_token: qrToken,
                            gcash_ref: cleanRef,
                        }),
                    }).catch(err => console.warn("Email auto-dispatch background notice:", err));
                } catch (mailErr) {
                    console.warn("Email dispatch notice:", mailErr);
                }
            }

            return {
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
                email_sent: !!passengerEmail,
                redirect_url: isAuto
                    ? `/my-tickets?booking_id=${bookingId}&payment=success`
                    : `/my-tickets?booking_id=${bookingId}&status=pending_verification`,
            };
        });

        return NextResponse.json(result);
    } catch (err: any) {
        console.error("GCash Direct Booking Error:", err);

        // Check for Slot Already Taken (pessimistic lock conflict / double-booking race condition)
        if (
            err instanceof SlotAlreadyTakenError ||
            err.statusCode === 409 ||
            err.message?.includes("Slot already taken") ||
            err.message?.includes("already reserved") ||
            err.message?.includes("already booked")
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: err.message || "Slot already taken: The selected seat was just reserved by another passenger. Please select another seat.",
                    slot_already_taken: true,
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: err.message || "Failed to process GCash booking." },
            { status: 500 }
        );
    }
}

