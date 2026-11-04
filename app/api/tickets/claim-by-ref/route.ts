import { NextRequest, NextResponse } from "next/server";
import { getLocalBookingByGcashRef, getLocalBookings } from "@/lib/local-booking-store";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { gcashRefNumber, contactNumber } = body;

        const ref = (gcashRefNumber || "").trim();
        if (!ref || ref.length < 5) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid GCash Reference Number (at least 6 digits)." },
                { status: 400 }
            );
        }

        // 1. Check local booking store by GCash reference
        const booking = getLocalBookingByGcashRef(ref);

        if (booking) {
            return NextResponse.json({
                success: true,
                found: true,
                booking: {
                    id: booking.id,
                    passenger_name: booking.passenger_name,
                    passenger_contact: booking.passenger_contact,
                    passenger_email: booking.passenger_email,
                    passenger_type: booking.passenger_type || "REGULAR",
                    discount_amount: booking.discount_amount || 0,
                    seat_number: booking.seat_number,
                    seat_numbers: booking.seat_numbers || [booking.seat_number],
                    total_price: booking.total_price,
                    booking_status: booking.booking_status,
                    payment_status: booking.payment_status,
                    ticket_status: booking.ticket_status || "VALID",
                    transaction_ref: booking.transaction_ref,
                    qr_token: booking.qr_token,
                    trip: booking.trip,
                    created_at: booking.created_at,
                },
            });
        }

        // 2. Also search by contact number in local store if provided
        if (contactNumber && contactNumber.trim().length >= 7) {
            const cleanPhone = contactNumber.trim().replace(/\D/g, "");
            const allBookings = getLocalBookings();
            const byPhone = allBookings.find((b) => {
                const bPhone = (b.passenger_contact || "").replace(/\D/g, "");
                return bPhone.includes(cleanPhone) || cleanPhone.includes(bPhone);
            });

            if (byPhone) {
                return NextResponse.json({
                    success: true,
                    found: true,
                    booking: {
                        id: byPhone.id,
                        passenger_name: byPhone.passenger_name,
                        passenger_contact: byPhone.passenger_contact,
                        passenger_email: byPhone.passenger_email,
                        passenger_type: byPhone.passenger_type || "REGULAR",
                        discount_amount: byPhone.discount_amount || 0,
                        seat_number: byPhone.seat_number,
                        seat_numbers: byPhone.seat_numbers || [byPhone.seat_number],
                        total_price: byPhone.total_price,
                        booking_status: byPhone.booking_status,
                        payment_status: byPhone.payment_status,
                        ticket_status: byPhone.ticket_status || "VALID",
                        transaction_ref: byPhone.transaction_ref,
                        qr_token: byPhone.qr_token,
                        trip: byPhone.trip,
                        created_at: byPhone.created_at,
                    },
                });
            }
        }

        // 3. Fallback: Search in Supabase database (payments table)
        try {
            const supabase = await createClient();
            const cleanRefDigits = ref.replace(/\D/g, "");

            // Search payments with transaction_id containing the ref
            const { data: payments } = await supabase
                .from("payments")
                .select("*")
                .or(`transaction_id.ilike.%${ref}%,transaction_id.ilike.%${cleanRefDigits}%`)
                .limit(5);

            if (payments && payments.length > 0) {
                const payment = payments[0];
                const targetId = payment.reservation_id || payment.booking_id;

                // Fetch reservation details
                let reservation: any = null;
                if (payment.reservation_id) {
                    const { data: resData } = await supabase
                        .from("reservations")
                        .select("*, trip:trips(*, bus:buses(*))")
                        .eq("id", payment.reservation_id)
                        .maybeSingle();
                    reservation = resData;
                }
                if (!reservation && targetId) {
                    const { data: bkData } = await supabase
                        .from("bookings")
                        .select("*, trip:trips(*, bus:buses(*))")
                        .eq("id", targetId)
                        .maybeSingle();
                    reservation = bkData;
                }

                // Fetch ticket QR
                const { data: ticket } = await supabase
                    .from("tickets")
                    .select("*")
                    .or(`reservation_id.eq.${targetId},booking_id.eq.${targetId}`)
                    .maybeSingle();

                if (reservation) {
                    return NextResponse.json({
                        success: true,
                        found: true,
                        booking: {
                            id: reservation.id,
                            passenger_name: reservation.passenger_name || "Valued Passenger",
                            passenger_contact: reservation.passenger_contact || "N/A",
                            passenger_email: reservation.passenger_email || "N/A",
                            passenger_type: reservation.passenger_type || "REGULAR",
                            discount_amount: reservation.discount_amount || 0,
                            seat_number: reservation.seat_number,
                            seat_numbers: [reservation.seat_number],
                            total_price: Number(reservation.total_price || payment.amount || 850),
                            booking_status: reservation.status || reservation.booking_status || "CONFIRMED",
                            payment_status: payment.status || payment.payment_status || "PAID",
                            ticket_status: ticket?.ticket_status || (reservation.status === "CONFIRMED" ? "VALID" : "PENDING"),
                            transaction_ref: payment.transaction_id || `GCASH-${ref}`,
                            qr_token: ticket?.qr_code || ticket?.qr_token || `TKT-${reservation.id.slice(0, 8).toUpperCase()}`,
                            trip: {
                                id: reservation.trip?.id,
                                origin: reservation.trip?.origin || "Cubao",
                                destination: reservation.trip?.destination || "Daet",
                                departure_time: reservation.trip?.departure_time || new Date().toISOString(),
                                bus_number: reservation.trip?.bus?.bus_number || "Superlines Express",
                            },
                            created_at: reservation.created_at,
                        },
                    });
                }
            }
        } catch (dbErr) {
            console.warn("Supabase payment claim lookup notice:", dbErr);
        }

        return NextResponse.json(
            {
                success: false,
                found: false,
                error: `No booking found for GCash Reference Number "${ref}". Please ensure the number matches your GCash SMS or receipt.`,
            },
            { status: 404 }
        );
    } catch (err: any) {
        console.error("Claim Ticket API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to search for booking." },
            { status: 500 }
        );
    }
}
