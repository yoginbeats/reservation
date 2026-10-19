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

            // Mark Booking as CONFIRMED (in both tables)
            await supabase.from("bookings").update({ booking_status: "CONFIRMED" }).eq("id", bookingId);
            await supabase.from("reservations").update({ status: "CONFIRMED" }).eq("id", bookingId);

            // Mark Payment as PAID (in both columns)
            const txId = body?.data?.id || "paymongo_webhook";
            await supabase
                .from("payments")
                .update({ payment_status: "PAID", transaction_ref: txId })
                .eq("booking_id", bookingId);

            await supabase
                .from("payments")
                .update({ status: "PAID", transaction_id: txId })
                .eq("reservation_id", bookingId);

            // Mark Ticket as VALID
            await supabase
                .from("tickets")
                .update({ ticket_status: "VALID" })
                .eq("booking_id", bookingId);

            await supabase
                .from("tickets")
                .update({ ticket_status: "VALID" })
                .eq("reservation_id", bookingId);

            console.log(`Successfully verified and confirmed booking/reservation #${bookingId} via PayMongo Webhook.`);
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("PayMongo Webhook Error:", err);
        return NextResponse.json({ error: "Webhook error" }, { status: 500 });
    }
}
