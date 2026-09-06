import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const eventType = body?.data?.attributes?.type;
        const metadata = body?.data?.attributes?.data?.attributes?.metadata;
        const bookingId = metadata?.booking_id;

        if (eventType === "checkout_session.payment.paid" && bookingId) {
            const supabase = await createClient();

            // Mark Booking as CONFIRMED
            await supabase
                .from("bookings")
                .update({ booking_status: "CONFIRMED" })
                .eq("id", bookingId);

            // Mark Payment as PAID
            await supabase
                .from("payments")
                .update({
                    payment_status: "PAID",
                    transaction_ref: body?.data?.id || "paymongo_webhook",
                })
                .eq("booking_id", bookingId);

            // Mark Ticket as VALID
            await supabase
                .from("tickets")
                .update({ ticket_status: "VALID" })
                .eq("booking_id", bookingId);

            console.log(`Successfully verified and confirmed booking #${bookingId} via PayMongo Webhook.`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("PayMongo Webhook Error:", err);
        return NextResponse.json({ error: "Webhook error" }, { status: 500 });
    }
}
