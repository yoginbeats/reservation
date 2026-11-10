import { NextRequest, NextResponse } from "next/server";
import { getLocalBookingById } from "@/lib/local-booking-store";
import { dispatchTicketEmail } from "@/lib/ticket-email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            booking_id,
            recipient_email,
            passenger_name,
            trip,
            seat_number,
            seat_numbers = [],
            total_price,
            qr_token,
            gcash_ref,
        } = body;

        // Fallback to local store data if available
        const local = booking_id ? getLocalBookingById(booking_id) : null;
        const email = (recipient_email || local?.passenger_email || "").trim();

        if (!email) {
            return NextResponse.json({ success: false, error: "Recipient email is required." }, { status: 400 });
        }

        const emailResult = await dispatchTicketEmail({
            bookingId: booking_id || local?.id || `BK-${Date.now()}`,
            recipientEmail: email,
            passengerName: passenger_name || local?.passenger_name,
            trip: trip || local?.trip,
            seatNumber: seat_number || local?.seat_number,
            seatNumbers: seat_numbers.length > 0 ? seat_numbers : local?.seat_numbers || [],
            totalPrice: total_price || local?.total_price || 0,
            qrToken: qr_token || local?.qr_token,
            transactionRef: gcash_ref || local?.transaction_ref || "CONFIRMED-PAYMENT",
            req,
        });

        return NextResponse.json({
            success: emailResult.success,
            message: emailResult.success
                ? `e-Ticket boarding pass successfully delivered to ${email}!`
                : (emailResult.error || "Failed to dispatch email."),
            provider: (emailResult as any).provider || "GMAIL_SMTP",
            messageId: (emailResult as any).messageId || null,
            recipient: email,
        });
    } catch (err: any) {
        console.error("Error sending ticket email:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to dispatch email." },
            { status: 500 }
        );
    }
}
