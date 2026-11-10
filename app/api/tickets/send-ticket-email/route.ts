import { NextRequest, NextResponse } from "next/server";
import { getLocalBookingById, saveLocalBooking } from "@/lib/local-booking-store";
import { sendLiveEmail } from "@/lib/email-service";
import { resolveAppOrigin } from "@/lib/app-url";

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

        const email = recipient_email?.trim();
        if (!email) {
            return NextResponse.json({ success: false, error: "Recipient email is required." }, { status: 400 });
        }

        const name = passenger_name || "Valued Passenger";
        const origin = trip?.origin || "Cubao";
        const destination = trip?.destination || "Daet";
        const busNumber = trip?.bus_number || "Superlines Express";
        const departureTime = trip?.departure_time
            ? new Date(trip.departure_time).toLocaleString("en-US", {
                  timeZone: "Asia/Manila",
                  dateStyle: "full",
                  timeStyle: "short",
              })
            : "Scheduled Departure";
        const seatsDisplay =
            seat_numbers && seat_numbers.length > 0
                ? seat_numbers.map((s: number) => `#${s < 10 ? `0${s}` : s}`).join(", ")
                : `#${seat_number || "01"}`;
        const refNo = gcash_ref || "GCASH-DIRECT";
        const token = qr_token || `TKT-${Date.now()}`;
        const appOrigin = resolveAppOrigin(req);
        const ticketUrl = `${appOrigin}/my-tickets?booking_id=${booking_id || ""}&ref=${encodeURIComponent(refNo)}`;

        // Official Superlines Electronic Bus Ticket (e-Ticket) Email HTML
        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Superlines Bus e-Ticket & Boarding Pass</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 24px; color: #18181b; }
    .ticket-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 2px solid #e11d48; }
    .header { background: linear-gradient(135deg, #991b1b, #dc2626); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; }
    .status-badge { display: inline-block; margin-top: 12px; background: #22c55e; color: #ffffff; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 28px 24px; }
    .route-box { background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 14px; padding: 18px; text-align: center; margin-bottom: 22px; }
    .route-title { font-size: 20px; font-weight: 900; color: #9f1239; margin: 0; }
    .route-sub { font-size: 13px; color: #881337; margin-top: 4px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .item { background: #f4f4f5; border-radius: 10px; padding: 12px 14px; }
    .item-label { font-size: 11px; color: #71717a; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
    .item-value { font-size: 15px; font-weight: 800; color: #09090b; }
    .seat-badge { color: #dc2626; font-size: 18px; font-weight: 900; }
    .qr-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0; }
    .qr-token { font-family: monospace; font-size: 16px; font-weight: 800; color: #09090b; letter-spacing: 2px; margin: 8px 0; }
    .btn { display: inline-block; background: #dc2626; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
    .notice { margin-top: 22px; padding: 16px; border-radius: 10px; background: #fefce8; border-left: 4px solid #eab308; font-size: 12px; color: #713f12; line-height: 1.5; }
    .footer { background: #18181b; color: #a1a1aa; padding: 18px 24px; text-align: center; font-size: 11px; }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="header">
      <h1>Superlines Bus Co.</h1>
      <p>Official Electronic Bus Boarding Pass</p>
      <div class="status-badge">&#10003; CONFIRMED & PAID</div>
    </div>
    
    <div class="body">
      <div class="route-box">
        <h2 class="route-title">${origin} &rarr; ${destination}</h2>
        <div class="route-sub">${busNumber} &bull; Daily Express Service</div>
      </div>

      <div class="grid">
        <div class="item">
          <div class="item-label">Passenger Name</div>
          <div class="item-value">${name}</div>
        </div>
        <div class="item">
          <div class="item-label">Reserved Seat(s)</div>
          <div class="item-value seat-badge">${seatsDisplay}</div>
        </div>
        <div class="item">
          <div class="item-label">Departure Schedule</div>
          <div class="item-value" style="font-size: 13px;">${departureTime}</div>
        </div>
        <div class="item">
          <div class="item-label">Total Fare Paid</div>
          <div class="item-value" style="color: #16a34a;">&#8369;${total_price || "0"}.00</div>
        </div>
        <div class="item">
          <div class="item-label">GCash Reference No.</div>
          <div class="item-value" style="font-family: monospace; font-size: 13px;">${refNo}</div>
        </div>
        <div class="item">
          <div class="item-label">Boarding Status</div>
          <div class="item-value" style="color: #2563eb;">READY TO BOARD</div>
        </div>
      </div>

      <div class="qr-box">
        <div style="font-size: 12px; color: #71717a; font-weight: 700; text-transform: uppercase;">Ticket Verification Token</div>
        <div class="qr-token">${token}</div>
        <p style="font-size: 12px; color: #71717a; margin: 4px 0 16px;">Present this digital ticket and QR token to the bus conductor upon boarding.</p>
        <a href="${ticketUrl}" class="btn" target="_blank">View / Download QR Boarding Pass &rarr;</a>
      </div>

      <div class="notice">
        <strong>Terminal Reminder:</strong><br>
        &bull; Please arrive at the terminal at least <strong>45 minutes</strong> before scheduled departure time.<br>
        &bull; For discounted tickets (Senior, Student, PWD), please present valid government/school ID upon conductor inspection.<br>
        &bull; Academic Project Demonstration Notice: This ticket was issued by the Superlines Academic Capstone Online Reservation System.
      </div>
    </div>

    <div class="footer">
      Superlines Transportation Co., Inc. &bull; Cubao & Daet Terminals<br>
      Automated Ticket Dispatch System &bull; Need help? Inquire at your departure terminal.
    </div>
  </div>
</body>
</html>`;

        // Dispatch live e-Ticket via Gmail SMTP or Resend
        const emailResult = await sendLiveEmail({
            to: email,
            subject: `Your Superlines Bus e-Ticket & Boarding Pass (${origin} ➔ ${destination})`,
            html: emailHtml,
            fromName: "Superlines Bus Ticketing",
        });
        const sentLive = emailResult.success;

        // Update local booking store email flag if booking_id is provided
        if (booking_id) {
            const b = getLocalBookingById(booking_id);
            if (b) {
                b.email_dispatched = true;
                b.email_dispatched_at = new Date().toISOString();
                saveLocalBooking(b);
            }
        }

        return NextResponse.json({
            success: true,
            sent_live: sentLive,
            recipient: email,
            passenger_name: name,
            ticket_url: ticketUrl,
            message: `Ticket successfully dispatched to ${email}`,
        });
    } catch (err: any) {
        console.error("Send Ticket Email Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to dispatch ticket email." },
            { status: 500 }
        );
    }
}
