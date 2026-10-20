import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
    rebookOnlineBooking,
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
            new_trip,
            new_seat_number,
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

        // 1. Process in resilient local booking store with automatic 20% calculation
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

        // 2. Synchronize to Supabase database
        const supabase = await createClient();
        try {
            const targetId = booking_id || localResult.booking?.id;
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
            message: rebooking.is_within_3_days
                ? `Ticket rebooked to Seat #${seatNum < 10 ? `0${seatNum}` : seatNum}! A 20% deduction (₱${rebooking.deduction_amount}.00) was automatically deducted because rebooking was requested within 3 days prior to departure.`
                : `Ticket rebooked to Seat #${seatNum < 10 ? `0${seatNum}` : seatNum}! Free rebooking (0% deduction) applied as you rebooked more than 3 days ahead.`,
            rebooking,
            booking: localResult.booking,
        });
    } catch (err: any) {
        console.error("Ticket Rebooking API Error:", err);
        return NextResponse.json({ success: false, error: err.message || "Failed to rebook ticket." }, { status: 500 });
    }
}
