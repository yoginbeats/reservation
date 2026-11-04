import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayMongoCheckoutSession } from "@/lib/paymongo";
import { seatLock, SlotAlreadyTakenError } from "@/lib/seat-lock";
import { enforceRateLimit } from "@/lib/rate-limiter";
import { validateAndSanitizeEmail, sanitizeString, validateGuestCount } from "@/lib/validators";
import { slotHoldManager } from "@/lib/slot-hold";
import { saveLocalBooking, checkSeatOccupiedAcrossTerminals } from "@/lib/local-booking-store";

export async function POST(req: NextRequest) {
    // 🔒 Rate Limiting: Max 15 checkout attempts per 15 minutes per IP (Brute-force protection)
    const rateLimitResponse = await enforceRateLimit(req, "booking_checkout", 15, 15 * 60 * 1000);
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
            seatCount = 1,
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
            trip: passedTrip,
        } = body;

        // 🔒 Strict Input Sanitization
        const passengerName = sanitizeString(rawPassengerName);
        const passengerContact = sanitizeString(rawPassengerContact);

        let passengerEmail = "";
        if (rawPassengerEmail) {
            const emailValidation = validateAndSanitizeEmail(rawPassengerEmail);
            if (!emailValidation.isValid) {
                return NextResponse.json({ success: false, error: emailValidation.error }, { status: 400 });
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

        const seatsToCheck: number[] = seatNumbers && seatNumbers.length > 0
            ? seatNumbers.map(Number)
            : [Number(effectiveSeatNumber)];

        // Validate seats
        for (const sNum of seatsToCheck) {
            const seatValidation = validateGuestCount(sNum);
            if (!seatValidation.isValid) {
                return NextResponse.json({ success: false, error: seatValidation.error }, { status: 400 });
            }
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Check active slot holds and terminal collisions
        const busNumber = passedTrip?.bus_number || "Superlines Express";
        const departureTime = passedTrip?.departure_time;

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

        let bookingId = crypto.randomUUID();
        const qrToken = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Attempt Supabase insert with fallback
        try {
            const { data: newBooking, error: bookingErr } = await supabase
                .from("bookings")
                .insert({
                    id: bookingId,
                    trip_id: tripId,
                    passenger_id: user?.id || null,
                    passenger_name: passengerName,
                    passenger_contact: passengerContact || "",
                    seat_number: Number(effectiveSeatNumber),
                    total_price: Number(totalPrice),
                    booking_source: "ONLINE",
                    booking_terminal_id: null,
                    created_by: user?.id || null,
                    booking_status: "PENDING",
                })
                .select("id")
                .maybeSingle();

            if (bookingErr) {
                await supabase
                    .from("reservations")
                    .insert({
                        id: bookingId,
                        trip_id: tripId,
                        customer_id: user?.id || null,
                        passenger_name: passengerName,
                        seat_number: Number(effectiveSeatNumber),
                        total_price: Number(totalPrice),
                        status: "PENDING",
                    });
            }
        } catch (dbErr) {
            console.warn("DB insert fallback warning:", dbErr);
        }

        // Save to local booking store for immediate visibility in Admin Reports & Conductor Manifest
        const normalizedTrip = {
            id: tripId,
            origin: passedTrip?.origin || "Cubao",
            destination: passedTrip?.destination || "Daet",
            departure_time: passedTrip?.departure_time || new Date().toISOString(),
            bus_number: passedTrip?.bus_number || "Superlines Express",
        };

        saveLocalBooking({
            id: bookingId,
            created_at: new Date().toISOString(),
            passenger_name: passengerName,
            passenger_contact: passengerContact || "",
            passenger_email: passengerEmail || user?.email || "",
            seat_number: Number(effectiveSeatNumber),
            seat_numbers: seatsToCheck,
            total_price: Number(totalPrice),
            original_price: Number(originalPrice || totalPrice),
            discount_amount: Number(discountAmount || 0),
            passenger_type: passengerType || "REGULAR",
            discount_id: discountIdNumber || "",
            discounted_passengers: discountedPassengers || [],
            booking_source: "ONLINE",
            payment_method: "PAYMONGO",
            booking_status: "PENDING",
            payment_status: "PENDING",
            qr_token: qrToken,
            trip: normalizedTrip,
        });

        const originUrl = req.headers.get("origin") || "http://localhost:3000";

        // Create Official PayMongo Checkout Session (configured for GCash)
        const seatsDisplay = seatsToCheck.length > 1 ? `Seats #${seatsToCheck.join(", #")}` : `Seat #${effectiveSeatNumber}`;
        const checkoutSession = await createPayMongoCheckoutSession({
            bookingId: bookingId,
            amountInCentavos: Math.round(Number(totalPrice) * 100),
            description: `Superlines Bus Ticket - ${normalizedTrip.origin} to ${normalizedTrip.destination} (${seatsDisplay})`,
            passengerName: passengerName,
            passengerEmail: passengerEmail || user?.email || "passenger@superlines.com",
            successUrl: `${originUrl}/my-tickets?booking_id=${bookingId}&payment=success`,
            cancelUrl: `${originUrl}/book?booking_id=${bookingId}&payment=cancelled`,
        });

        // If simulated or immediately successful (e.g. testing mode)
        if (checkoutSession.is_simulated) {
            saveLocalBooking({
                id: bookingId,
                created_at: new Date().toISOString(),
                passenger_name: passengerName,
                passenger_contact: passengerContact || "",
                passenger_email: passengerEmail || user?.email || "",
                seat_number: Number(effectiveSeatNumber),
                seat_numbers: seatsToCheck,
                total_price: Number(totalPrice),
                original_price: Number(originalPrice || totalPrice),
                discount_amount: Number(discountAmount || 0),
                passenger_type: passengerType || "REGULAR",
                discount_id: discountIdNumber || "",
                discounted_passengers: discountedPassengers || [],
                booking_source: "ONLINE",
                payment_method: "PAYMONGO",
                booking_status: "CONFIRMED",
                payment_status: "PAID",
                qr_token: qrToken,
                trip: normalizedTrip,
            });
        }

        return NextResponse.json({
            success: true,
            booking_id: bookingId,
            qr_token: qrToken,
            checkout_url: checkoutSession.checkout_url,
            is_simulated: checkoutSession.is_simulated,
        });
    } catch (err: any) {
        console.error("PayMongo Checkout API error:", err);
        if (
            err instanceof SlotAlreadyTakenError ||
            err.message?.includes("Slot already taken") ||
            err.message?.includes("already reserved")
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: err.message || "The selected seat has just been reserved by another passenger. Please select another seat.",
                    slot_already_taken: true,
                },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { success: false, error: err.message || "Server error processing PayMongo GCash checkout." },
            { status: 500 }
        );
    }
}
