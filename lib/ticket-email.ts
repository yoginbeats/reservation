import { sendLiveEmail } from "@/lib/email-service";
import { resolveAppOrigin } from "@/lib/app-url";

export interface TicketEmailPayload {
    bookingId: string;
    recipientEmail: string;
    passengerName?: string;
    trip?: {
        origin?: string;
        destination?: string;
        bus_number?: string;
        departure_time?: string;
    };
    seatNumber?: number | string;
    seatNumbers?: number[];
    totalPrice?: number | string;
    qrToken?: string;
    transactionRef?: string;
    req?: any;
}

/**
 * Dispatches an official Superlines e-Ticket & Boarding Pass directly to Gmail / Passenger inbox.
 */
export async function dispatchTicketEmail(payload: TicketEmailPayload) {
    const {
        bookingId,
        recipientEmail,
        passengerName = "Valued Passenger",
        trip,
        seatNumber = 1,
        seatNumbers = [],
        totalPrice = 0,
        qrToken,
        transactionRef = "PAID-VERIFIED",
        req,
    } = payload;

    const email = recipientEmail?.trim()?.toLowerCase();
    if (!email) {
        console.warn("[Ticket Email] No recipient email provided for booking:", bookingId);
        return { success: false, error: "No recipient email provided" };
    }

    const origin = trip?.origin || "Cubao Terminal";
    const destination = trip?.destination || "Daet Central Terminal";
    const busNumber = trip?.bus_number || "Superlines Express Aircon";
    const departureTime = trip?.departure_time
        ? new Date(trip.departure_time).toLocaleString("en-US", {
              timeZone: "Asia/Manila",
              dateStyle: "full",
              timeStyle: "short",
          })
        : "Scheduled Superlines Departure";

    const seatsDisplay =
        seatNumbers && seatNumbers.length > 0
            ? seatNumbers.map((s) => `#${s < 10 ? `0${s}` : s}`).join(", ")
            : `#${Number(seatNumber) < 10 ? `0${seatNumber}` : seatNumber}`;

    const token = qrToken || `TKT-${bookingId.slice(0, 8).toUpperCase()}`;
    const appOrigin = resolveAppOrigin(req);
    const ticketUrl = `${appOrigin}/my-tickets?booking_id=${bookingId}&ref=${encodeURIComponent(transactionRef)}`;

    const subject = `🎫 Superlines Bus e-Ticket & Boarding Pass: ${origin} ➔ ${destination} (${seatsDisplay})`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Superlines Bus e-Ticket & Boarding Pass</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 24px; color: #18181b; }
    .ticket-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 2px solid #dc2626; }
    .header { background: linear-gradient(135deg, #991b1b, #dc2626); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 600; }
    .status-badge { display: inline-block; margin-top: 12px; background: #16a34a; color: #ffffff; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 28px 24px; }
    .route-banner { display: flex; justify-content: space-between; align-items: center; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; }
    .location { font-size: 18px; font-weight: 800; color: #991b1b; }
    .arrow { font-size: 20px; color: #dc2626; font-weight: 900; padding: 0 12px; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .details-table td { padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; }
    .label { color: #71717a; font-weight: 600; }
    .value { color: #09090b; font-weight: 700; text-align: right; }
    .qr-box { background: #fafafa; border: 2px dashed #dc2626; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .token-text { font-family: monospace; font-size: 20px; font-weight: 800; letter-spacing: 4px; color: #dc2626; margin: 10px 0 4px; }
    .btn-container { text-align: center; margin: 28px 0 12px; }
    .btn { display: inline-block; background: #dc2626; color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(220,38,38,0.4); text-transform: uppercase; letter-spacing: 0.5px; }
    .instructions { background: #f4f4f5; border-radius: 12px; padding: 16px; font-size: 12px; color: #52525b; line-height: 1.6; margin-top: 20px; }
    .instructions strong { color: #18181b; }
    .footer { background: #f4f4f5; padding: 20px 24px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #e4e4e7; }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="header">
      <h1>Superlines Transportation</h1>
      <p>Official Digital e-Ticket & Electronic Boarding Pass</p>
      <div class="status-badge">&check; Confirmed &amp; Paid</div>
    </div>
    <div class="body">
      <div class="route-banner">
        <span class="location">${origin}</span>
        <span class="arrow">&rarr;</span>
        <span class="location">${destination}</span>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Passenger Name:</td>
          <td class="value">${passengerName}</td>
        </tr>
        <tr>
          <td class="label">Departure Schedule:</td>
          <td class="value">${departureTime}</td>
        </tr>
        <tr>
          <td class="label">Assigned Seat(s):</td>
          <td class="value" style="color: #dc2626; font-size: 16px;">${seatsDisplay}</td>
        </tr>
        <tr>
          <td class="label">Assigned Bus:</td>
          <td class="value">${busNumber}</td>
        </tr>
        <tr>
          <td class="label">Total Fare Paid:</td>
          <td class="value" style="color: #16a34a; font-size: 16px;">PHP ${Number(totalPrice).toLocaleString()}</td>
        </tr>
        <tr>
          <td class="label">Payment / Transaction Ref:</td>
          <td class="value" style="font-family: monospace;">${transactionRef}</td>
        </tr>
      </table>

      <div class="qr-box">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #71717a;">
          Conductor Digital Scan Token
        </div>
        <div class="token-text">${token}</div>
        <div style="font-size: 11px; color: #71717a;">Present this token or the QR code at the bus door for instant boarding</div>
      </div>

      <div class="btn-container">
        <a href="${ticketUrl}" class="btn" target="_blank">
          View &amp; Print Full Boarding Pass &rarr;
        </a>
      </div>

      <div class="instructions">
        <strong>Boarding Reminders:</strong>
        <ul style="margin: 6px 0 0; padding-left: 18px;">
          <li>Please arrive at the terminal at least <strong>30 minutes</strong> before departure.</li>
          <li>Have this e-Ticket ready on your phone screen or print a physical copy.</li>
          <li>Valid government-issued ID matching the passenger name is required upon boarding.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      Superlines Transportation Company Inc. &bull; Cubao &amp; Daet Central Terminals<br>
      Customer Support Hotlines: (02) 8414-8848 &bull; 0993 317 6559<br>
      Website: <a href="${appOrigin}" style="color: #dc2626; text-decoration: none;">superlinestransportation.com</a>
    </div>
  </div>
</body>
</html>
    `;

    console.log(`[Ticket Email] Sending live e-Ticket to ${email} for booking #${bookingId}...`);
    return await sendLiveEmail({
        to: email,
        subject,
        html: emailHtml,
        fromName: "Superlines e-Ticket Dispatch",
    });
}

