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

        // Check if user is admin
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (roleData?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // Fetch payment details
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('reservation_id', reservationId)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        if (payment.status !== 'completed') {
            return NextResponse.json({ error: "Only completed payments can be refunded" }, { status: 400 });
        }

        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (!secretKey || secretKey === "sk_test_placeholder_key") {
            return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
        }

        // In PayMongo, to refund a Checkout Session, you first need to find the Payment ID associated with it.
        // The transaction_id we stored is the Checkout Session ID (cs_...).

        // 1. Get the Payment ID from the Checkout Session
        const sessionResponse = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${payment.transaction_id}`, {
            method: 'GET',
            headers: {
                accept: 'application/json',
                authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
            }
        });

        const sessionData = await sessionResponse.json();
        if (!sessionResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch checkout session" }, { status: 400 });
        }

        const payments = sessionData.data.attributes.payments;
        if (!payments || payments.length === 0) {
            return NextResponse.json({ error: "No successful payment found for this session" }, { status: 400 });
        }

        const paymongoPaymentId = payments[0].id; // Get the actual payment ID (pay_...)

        const refundAmount = Math.round(payment.amount * 0.8 * 100); // 80% of total price in centavos

        // 2. Create the Refund
        const refundResponse = await fetch('https://api.paymongo.com/v1/refunds', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
                authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        amount: refundAmount,
                        payment_id: paymongoPaymentId,
                        reason: 'requested_by_customer',
                        notes: `Partial refund (80%) for reservation ${reservationId}. 20% deducted as management fee.`
                    }
                }
            })
        });

        const refundData = await refundResponse.json();

        if (!refundResponse.ok) {
            console.error('PayMongo Refund Error:', refundData);
            return NextResponse.json({ error: refundData.errors?.[0]?.detail || "Failed to process refund" }, { status: 400 });
        }

        // 3. Update Database
        await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('id', payment.id);

        await supabase
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', reservationId);

        return NextResponse.json({ success: true, refundId: refundData.data.id });

    } catch (err) {
        console.error('Refund API Error:', err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
