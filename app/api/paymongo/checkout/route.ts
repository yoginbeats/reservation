import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { reservationId } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch reservation details
        const { data: reservation, error } = await supabase
            .from('reservations')
            .select(`
                *,
                trips (
                    origin,
                    destination
                )
            `)
            .eq('id', reservationId)
            .eq('customer_id', user.id)
            .single();

        if (error || !reservation) {
            return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
        }

        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (!secretKey || secretKey === "sk_test_placeholder_key") {
            return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        send_email_receipt: true,
                        show_description: true,
                        show_line_items: true,
                        line_items: [
                            {
                                currency: 'PHP',
                                amount: Math.round(reservation.total_price * 100), // amount in centavos
                                name: `Ticket: ${reservation.trips.origin} to ${reservation.trips.destination}`,
                                quantity: 1,
                                description: `Seat Number: ${reservation.seat_number}`
                            }
                        ],
                        payment_method_types: ['gcash', 'paymaya', 'card', 'grab_pay', 'dob'],
                        success_url: `${baseUrl}/checkout/${reservationId}/success`,
                        cancel_url: `${baseUrl}/checkout/${reservationId}`,
                        description: `Reservation for ${reservation.trips.origin} to ${reservation.trips.destination}`
                    }
                }
            })
        };

        const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options);
        const data = await response.json();

        if (!response.ok) {
            console.error('PayMongo Error:', data);
            return NextResponse.json({ error: data.errors?.[0]?.detail || "Failed to create checkout session" }, { status: 400 });
        }

        // Create or update payment record
        const { error: paymentError } = await supabase
            .from('payments')
            .upsert({
                reservation_id: reservationId,
                amount: reservation.total_price,
                status: 'pending',
                transaction_id: data.data.id // Store PayMongo Checkout Session ID
            }, { onConflict: 'reservation_id' });

        if (paymentError) {
            console.error('Payment Record Error:', paymentError);
            // Non-critical, but good to log
        }

        return NextResponse.json({ checkoutUrl: data.data.attributes.checkout_url });

    } catch (err) {
        console.error('Checkout API Error:', err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
