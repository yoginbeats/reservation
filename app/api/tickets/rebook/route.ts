import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    rebookOnlineBooking,
    getLocalBookingById,
    getLocalBookingByQrToken,
} from "@/lib/local-booking-store";
import { createPayMongoCheckoutSession } from "@/lib/paymongo";
import { resolveAppOrigin } from "@/lib/app-url";

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
            new_trip,
            new_seat_number,
            payment_mode = "PAYMONGO", // "PAYMONGO" | "DEMO"
        } = body || {};

        if (!booking_id && !qr_token) {
            return NextResponse.json({ success: false, error: "Missing booking ID or ticket token." }, { status: 400 });
        }

        const seatNum = Number(new_seat_number);
        if (!seatNum || seatNum < 1 || seatNum > 45) {
            return NextResponse.json({
                success: false,
                error: "Please select a valid seat number between 1 and 45.",
            }, { status: 400 });
        }

        if (!new_trip || !new_trip.departure_time || !new_trip.origin || !new_trip.destination) {
            return NextResponse.json({
                success: false,
                error: "Missing new trip destination or departure time.",
            }, { status: 400 });
        }

        const identifier = booking_id || qr_token;

        // 1. Process in resilient local booking store with automatic 20% deduction calculation
        const localResult = rebookOnlineBooking(identifier, {
            origin: new_trip.origin,
            destination: new_trip.destination,
            departure_time: new_trip.departure_time,
            bus_number: new_trip.bus_number || "Superlines Express",
            fare_amount: Number(new_trip.fare_amount || 850),
            seat_number: seatNum,
        });

        if (!localResult.success || !localResult.rebooking) {
            return NextResponse.json({
                success: false,
                error: localResult.error || "Failed to rebook ticket.",
            }, { status: 400 });
        }

        const rebooking = localResult.rebooking;
        const targetId = booking_id || localResult.booking?.id;
        const topUp = rebooking.top_up_amount || 0;

        // 2. If there is a top-up balance (e.g. ₱200) and passenger selected PayMongo GCash checkout
        if (topUp > 0 && payment_mode === "PAYMONGO") {
            const originUrl = resolveAppOrigin(req);
            const checkoutSession = await createPayMongoCheckoutSession({
                bookingId: targetId || "rebook",
                amountInCentavos: Math.round(topUp * 100),
                description: `Superlines Rebooking Top-up: Seat #${seatNum} (${new_trip.origin} to ${new_trip.destination}) - ₱${rebooking.usable_credit}.00 Usable Credit Applied`,
                passengerName: localResult.booking?.passenger_name || "Passenger",
                passengerEmail: localResult.booking?.passenger_email || "passenger@superlines.com",
                successUrl: `${originUrl}/my-tickets?rebook=success&booking_id=${targetId}&new_seat=${seatNum}&trip_id=${new_trip.id || ""}&top_up=${topUp}`,
                cancelUrl: `${originUrl}/my-tickets?rebook=cancelled&booking_id=${targetId}`,
            });

            return NextResponse.json({
                success: true,
                requires_payment: true,
                checkout_url: checkoutSession.checkout_url,
                top_up_amount: topUp,
                usable_credit: rebooking.usable_credit,
                rebooking,
                message: `Redirecting to PayMongo GCash to settle the remaining balance of ₱${topUp}.00...`,
            });
        }

        // 3. Complete rebooking and synchronize to Supabase database
        const supabase = await createClient();
        try {
            if (targetId) {
                // Free previous seat
                try {
                    await supabase
                        .from("trip_seats")
                        .update({ is_available: true, booked_by_booking_id: null })
                        .eq("booked_by_booking_id", targetId);
                } catch {}

                // Update booking with new seat and total_price
                const updatePayload: any = {
                    seat_number: seatNum,
                    total_price: rebooking.new_fare,
                    booking_status: "CONFIRMED",
                    payment_status: "PAID",
                };
                if (new_trip.id) {
                    updatePayload.trip_id = new_trip.id;
                }

                await supabase.from("bookings").update(updatePayload).eq("id", targetId);
                await supabase.from("tickets").update({ ticket_status: "VALID" }).eq("booking_id", targetId);

                // Book new seat in trip_seats if new_trip.id is provided
                if (new_trip.id) {
                    try {
                        await supabase
                            .from("trip_seats")
                            .update({ is_available: false, booked_by_booking_id: targetId })
                            .eq("trip_id", new_trip.id)
                            .eq("seat_number", seatNum);
                    } catch {}
                }
            }
        } catch (dbErr) {
            console.warn("Supabase rebook sync notice (local backup active):", dbErr);
        }

        return NextResponse.json({
            success: true,
            requires_payment: false,
            message: rebooking.is_within_3_days
                ? `Ticket successfully rebooked to Seat #${seatNum < 10 ? `0${seatNum}` : seatNum}! Your 80% usable credit (₱${rebooking.usable_credit}.00) was applied, and the 20% balance (₱${rebooking.deduction_amount}.00) has been confirmed.`
                : `Ticket rebooked to Seat #${seatNum < 10 ? `0${seatNum}` : seatNum}! Free rebooking (0% deduction) applied as you rebooked more than 3 days ahead.`,
            rebooking,
            booking: localResult.booking,
        });
    } catch (err: any) {
        console.error("Ticket Rebooking API Error:", err);
        return NextResponse.json({ success: false, error: err.message || "Failed to rebook ticket." }, { status: 500 });
    }
}
