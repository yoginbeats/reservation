import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalBookingByQrToken, updateLocalTicketStatus, getLocalBookings } from "@/lib/local-booking-store";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token")?.trim();
        const tripId = searchParams.get("trip_id")?.trim();

        const supabase = await createClient();

        // 1. LOOKUP SINGLE TICKET BY TOKEN
        if (token) {
            const cleanToken = token.toUpperCase();
            let matchedTicket: any = null;

            // Step A: Check Supabase
            try {
                const { data: dbTicket, error: tErr } = await supabase
                    .from("tickets")
                    .select(`
                        id,
                        qr_token,
                        ticket_status,
                        created_at,
                        booking:bookings(
                            id,
                            passenger_name,
                            passenger_contact,
                            seat_number,
                            total_price,
                            booking_status,
                            booking_source,
                            payment:payments(payment_status),
                            trip:trips(
                                id,
                                departure_time,
                                bus:buses(bus_number),
                                route:routes(
                                    origin:origin_terminal_id(name),
                                    destination:destination_terminal_id(name)
                                )
                            )
                        )
                    `)
                    .ilike("qr_token", cleanToken)
                    .maybeSingle();

                if (!tErr && dbTicket) {
                    const booking = dbTicket.booking as any;
                    const trip = booking?.trip as any;
                    const paymentStatus = booking?.payment?.[0]?.payment_status || booking?.payment?.payment_status || "PAID";

                    matchedTicket = {
                        id: dbTicket.id,
                        qr_token: dbTicket.qr_token || cleanToken,
                        ticket_status: dbTicket.ticket_status || "VALID",
                        created_at: dbTicket.created_at,
                        passenger_name: booking?.passenger_name || "Passenger",
                        passenger_contact: booking?.passenger_contact || "",
                        seat_number: booking?.seat_number || 1,
                        seat_numbers: [booking?.seat_number || 1],
                        total_price: booking?.total_price || 850,
                        booking_status: booking?.booking_status || "CONFIRMED",
                        payment_status: paymentStatus,
                        booking_source: booking?.booking_source || "ONLINE",
                        is_discounted: false,
                        discounted_passengers: [],
                        trip: {
                            id: trip?.id || "",
                            origin: trip?.route?.origin?.name || "Cubao",
                            destination: trip?.route?.destination?.name || "Daet",
                            departure_time: trip?.departure_time || new Date().toISOString(),
                            bus_number: trip?.bus?.bus_number || "Superlines Express",
                        },
                    };
                }
            } catch (err) {
                console.warn("Supabase ticket query encountered error:", err);
            }

            // Step B: Check Local Store Fallback (or enrich discount info)
            const localBooking = getLocalBookingByQrToken(cleanToken);
            if (localBooking) {
                if (!matchedTicket) {
                    matchedTicket = {
                        id: localBooking.id,
                        qr_token: localBooking.qr_token,
                        ticket_status: localBooking.ticket_status || "VALID",
                        created_at: localBooking.created_at,
                        passenger_name: localBooking.passenger_name,
                        passenger_contact: localBooking.passenger_contact,
                        passenger_email: localBooking.passenger_email,
                        seat_number: localBooking.seat_number,
                        seat_numbers: localBooking.seat_numbers || [localBooking.seat_number],
                        total_price: localBooking.total_price,
                        booking_status: localBooking.booking_status,
                        payment_status: localBooking.payment_status,
                        booking_source: "ONLINE (GCASH DIRECT)",
                        is_discounted: (localBooking.discounted_passengers && localBooking.discounted_passengers.length > 0) || (localBooking.discount_amount && localBooking.discount_amount > 0),
                        passenger_type: localBooking.passenger_type || "REGULAR",
                        discount_id: localBooking.discount_id || "",
                        discount_count: localBooking.discount_count || localBooking.discounted_passengers?.length || 0,
                        discount_amount: localBooking.discount_amount || 0,
                        discounted_passengers: localBooking.discounted_passengers || [],
                        trip: {
                            id: "",
                            origin: localBooking.trip.origin,
                            destination: localBooking.trip.destination,
                            departure_time: localBooking.trip.departure_time,
                            bus_number: localBooking.trip.bus_number,
                        },
                    };
                } else {
                    // Enrich existing with local discount beneficiary details if available
                    matchedTicket.is_discounted = (localBooking.discounted_passengers && localBooking.discounted_passengers.length > 0) || Boolean(localBooking.discount_amount);
                    matchedTicket.passenger_type = localBooking.passenger_type;
                    matchedTicket.discount_id = localBooking.discount_id;
                    matchedTicket.discount_count = localBooking.discount_count;
                    matchedTicket.discount_amount = localBooking.discount_amount;
                    matchedTicket.discounted_passengers = localBooking.discounted_passengers || [];
                    if (localBooking.seat_numbers) {
                        matchedTicket.seat_numbers = localBooking.seat_numbers;
                    }
                    if (localBooking.ticket_status) {
                        matchedTicket.ticket_status = localBooking.ticket_status;
                    }
                }
            }

            if (!matchedTicket) {
                return NextResponse.json({
                    success: false,
                    found: false,
                    message: `Ticket token "${cleanToken}" not found in system or manifest.`,
                }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                found: true,
                ticket: matchedTicket,
            });
        }

        // 2. FETCH ENTIRE TRIP MANIFEST
        if (tripId) {
            let manifestBookings: any[] = [];

            // A: Query Supabase bookings for this trip
            try {
                const { data: dbBookings } = await supabase
                    .from("bookings")
                    .select(`
                        id,
                        passenger_name,
                        passenger_contact,
                        seat_number,
                        total_price,
                        booking_status,
                        booking_source,
                        created_at,
                        ticket:tickets(qr_token, ticket_status),
                        payment:payments(payment_status)
                    `)
                    .eq("trip_id", tripId);

                if (dbBookings) {
                    manifestBookings = dbBookings.map((b: any) => ({
                        id: b.id,
                        seat_number: b.seat_number,
                        passenger_name: b.passenger_name,
                        passenger_contact: b.passenger_contact,
                        booking_source: b.booking_source || "ONLINE",
                        booking_status: b.booking_status || "CONFIRMED",
                        payment_status: b.payment?.[0]?.payment_status || "PAID",
                        ticket_status: b.ticket?.[0]?.ticket_status || "VALID",
                        qr_token: b.ticket?.[0]?.qr_token || "",
                        created_at: b.created_at,
                        discounted_passengers: [],
                    }));
                }
            } catch (err) {
                console.warn("Error querying trip bookings:", err);
            }

            // B: Merge with local cached bookings
            const localList = getLocalBookings();
            for (const lb of localList) {
                const seats = lb.seat_numbers && lb.seat_numbers.length > 0 ? lb.seat_numbers : [lb.seat_number];
                for (const seatNum of seats) {
                    const alreadyExists = manifestBookings.some(m => m.seat_number === seatNum);
                    if (!alreadyExists) {
                        manifestBookings.push({
                            id: `${lb.id}-${seatNum}`,
                            seat_number: seatNum,
                            passenger_name: lb.passenger_name,
                            passenger_contact: lb.passenger_contact,
                            booking_source: "ONLINE (GCASH)",
                            booking_status: lb.booking_status || "CONFIRMED",
                            payment_status: lb.payment_status || "PAID",
                            ticket_status: lb.ticket_status || "VALID",
                            qr_token: lb.qr_token,
                            created_at: lb.created_at,
                            is_discounted: Boolean(lb.discounted_passengers?.length || lb.discount_amount),
                            passenger_type: lb.passenger_type,
                            discount_id: lb.discount_id,
                            discounted_passengers: lb.discounted_passengers || [],
                        });
                    }
                }
            }

            // Sort by seat number
            manifestBookings.sort((a, b) => a.seat_number - b.seat_number);

            return NextResponse.json({
                success: true,
                bookings: manifestBookings,
                total_booked: manifestBookings.length,
                total_boarded: manifestBookings.filter(b => b.ticket_status === "USED").length,
            });
        }

        return NextResponse.json({ error: "Missing token or trip_id parameter." }, { status: 400 });
    } catch (err: any) {
        console.error("Conductor ticket route error:", err);
        return NextResponse.json({ error: err.message || "Failed to process ticket request." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, action } = body;

        if (!token) {
            return NextResponse.json({ error: "Missing QR ticket token." }, { status: 400 });
        }

        const cleanToken = token.trim().toUpperCase();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Update in Local Store
        const updatedLocal = updateLocalTicketStatus(cleanToken, "USED");

        // 2. Update in Supabase Tickets Table
        let dbUpdated = false;
        try {
            const { data: ticketRecord, error: tktErr } = await supabase
                .from("tickets")
                .update({ ticket_status: "USED" })
                .ilike("qr_token", cleanToken)
                .select("id, booking:bookings(trip_id)")
                .single();

            if (!tktErr && ticketRecord) {
                dbUpdated = true;

                // 3. Log Audit in ticket_verifications
                const tripId = (ticketRecord.booking as any)?.trip_id;
                if (user && tripId) {
                    await supabase.from("ticket_verifications").insert({
                        ticket_id: ticketRecord.id,
                        conductor_id: user.id,
                        trip_id: tripId,
                        status: "SUCCESS",
                        reason: "Verified and Boarded via Conductor Scanner",
                    });
                }
            }
        } catch (dbErr) {
            console.warn("Could not record to Supabase tickets table, verified via local cache:", dbErr);
        }

        return NextResponse.json({
            success: true,
            message: "Passenger ticket verified and marked as BOARDED (USED).",
            token: cleanToken,
            database_synced: dbUpdated,
            local_synced: Boolean(updatedLocal),
        });
    } catch (err: any) {
        console.error("Conductor boarding confirmation error:", err);
        return NextResponse.json({ error: err.message || "Failed to confirm boarding." }, { status: 500 });
    }
}
