import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        const signature = req.headers.get("paymongo-signature");
        const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

        if (!signature || !webhookSecret || webhookSecret === "whsec_placeholder_key") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify PayMongo webhook signature
        const [t, v1] = signature.split(",").map(part => part.split("=")[1]);
        const signedPayload = `${t}.${payload}`;
        const computedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(signedPayload)
            .digest("hex");

        if (computedSignature !== v1) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const data = JSON.parse(payload);
        const eventType = data.data.attributes.type;
        const resourceData = data.data.attributes.data;

        if (eventType === "checkout_session.payment.paid") {
            const checkoutSessionId = resourceData.id;
            const supabase = await createClient(); // Use service role if possible for webhooks

            // Find payment record
            const { data: payment } = await supabase
                .from('payments')
                .select('*')
                .eq('transaction_id', checkoutSessionId)
                .single();

            if (payment) {
                // Update Payment Status
                await supabase
                    .from('payments')
                    .update({ status: 'completed' })
                    .eq('id', payment.id);

                // Update Reservation Status
                await supabase
                    .from('reservations')
                    .update({ status: 'confirmed' })
                    .eq('id', payment.reservation_id);

                console.log(`Payment confirmed for reservation ${payment.reservation_id}`);
            }
        }

        return NextResponse.json({ received: true });

    } catch (err) {
        console.error('Webhook Error:', err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
