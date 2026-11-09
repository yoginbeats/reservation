import { NextRequest, NextResponse } from "next/server";
import { generateSecurityOtp, getSecondaryEmailForUser, setSecondaryEmailForUser } from "@/lib/otp-store";
import { sendLiveEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            email,
            secondaryEmail: rawSecondary,
            action = "GOOGLE_SIGNUP",
        } = body;

        const cleanEmail = email?.trim()?.toLowerCase();
        if (!cleanEmail) {
            return NextResponse.json(
                { success: false, error: "Primary Google account email is required." },
                { status: 400 }
            );
        }

        const cleanSecondary = rawSecondary?.trim()?.toLowerCase() || getSecondaryEmailForUser(cleanEmail) || "";

        if (cleanSecondary) {
            setSecondaryEmailForUser(cleanEmail, cleanSecondary);
        }

        // Detect user agent & IP for security email details
        const userAgent = req.headers.get("user-agent") || "Web Browser (Chrome/Windows)";
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
        const nowPH = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila", dateStyle: "full", timeStyle: "medium" });

        // Generate 6-digit OTP and store
        const otpRecord = generateSecurityOtp(cleanEmail, cleanSecondary, action, {
            device: userAgent.includes("Windows") ? "Windows PC (Desktop)" : userAgent.includes("Android") ? "Android Phone" : userAgent.includes("iPhone") ? "Apple iPhone" : "Web Client",
            ip: ip.split(",")[0].trim(),
            location: "Philippines (PST / UTC+8)",
        });

        // =========================================================================
        // SECURITY ALERT EMAIL HTML TEMPLATE (Google Security Alert Style)
        // =========================================================================
        const isSignUp = action === "GOOGLE_SIGNUP";
        const subject = `🚨 Security Alert: New Google Sign-${isSignUp ? "Up" : "In"} detected for Superlines Bus Portal`;

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; margin: 0; padding: 24px; color: #18181b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 2px solid #dc2626; }
    .header { background: linear-gradient(135deg, #991b1b, #dc2626); color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .body { padding: 28px 24px; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; color: #991b1b; font-size: 13px; line-height: 1.5; }
    .otp-box { background: #f4f4f5; border: 2px dashed #dc2626; border-radius: 12px; padding: 18px; text-align: center; margin: 22px 0; }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #dc2626; margin: 6px 0; }
    .details { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 14px 16px; font-size: 12px; margin-bottom: 20px; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f4f4f5; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #71717a; font-weight: 600; }
    .val { color: #09090b; font-weight: 700; }
    .footer { background: #f4f4f5; padding: 16px 24px; text-align: center; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Superlines Bus Co.</h1>
      <p>Two-Step Double Verification & Security Alert</p>
    </div>
    <div class="body">
      <div class="alert-box">
        <strong>🚨 Google Account Security Alert:</strong><br>
        Your Google account <strong>${cleanEmail}</strong> was just used to ${isSignUp ? "sign up" : "sign in"} to the <strong>Superlines Online Reservation & Ticketing System</strong>.
        ${cleanSecondary ? `<br><br>🛡️ <em>This security notification was also dispatched to your linked secondary Google account: <strong>${cleanSecondary}</strong>.</em>` : ""}
      </div>

      <p style="font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
        Enter this 6-Digit Double Verification Code to complete your login:
      </p>

      <div class="otp-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; font-weight: 700;">One-Time Security PIN (OTP)</div>
        <div class="otp-code">${otpRecord.otp}</div>
        <div style="font-size: 11px; color: #71717a;">Valid for 10 minutes. Do NOT share this code with anyone.</div>
      </div>

      <div class="details">
        <div class="detail-row">
          <span class="label">Primary Google Account:</span>
          <span class="val">${cleanEmail}</span>
        </div>
        ${cleanSecondary ? `
        <div class="detail-row">
          <span class="label">Secondary Alert Account:</span>
          <span class="val">${cleanSecondary}</span>
        </div>
        ` : ""}
        <div class="detail-row">
          <span class="label">Date & Time (PST):</span>
          <span class="val">${nowPH}</span>
        </div>
        <div class="detail-row">
          <span class="label">Device:</span>
          <span class="val">${otpRecord.metadata?.device || "Web Browser"}</span>
        </div>
        <div class="detail-row">
          <span class="label">Action:</span>
          <span class="val">${isSignUp ? "New Account Registration" : "Sign-In Session"}</span>
        </div>
      </div>

      <p style="font-size: 12px; color: #71717a; line-height: 1.5;">
        If you did NOT initiate this action, someone may be attempting to access your account. Please secure your Google credentials immediately.
      </p>
    </div>
    <div class="footer">
      Superlines Transportation Co., Inc. &bull; Official Digital Dispatch<br>
      This is an automated 2-Step Verification alert.
    </div>
  </div>
</body>
</html>
        `;

        const recipients = [cleanEmail];
        if (cleanSecondary && cleanSecondary !== cleanEmail) {
            recipients.push(cleanSecondary);
        }

        // Send real live email via Gmail SMTP or Resend
        const emailResult = await sendLiveEmail({
            to: recipients,
            subject: subject,
            html: emailHtml,
            fromName: "Superlines Security Alert",
        });

        return NextResponse.json({
            success: true,
            email: cleanEmail,
            secondaryEmail: cleanSecondary || null,
            otpPreview: otpRecord.otp, // Available for Capstone Defense offline simulation
            emailDispatched: emailResult.success,
            emailProvider: emailResult.provider,
            recipients,
            expiresAt: otpRecord.expiresAt,
            message: cleanSecondary
                ? `Security alert & OTP dispatched to both ${cleanEmail} and ${cleanSecondary}`
                : `Security alert & OTP dispatched to ${cleanEmail}`,
        });
    } catch (err: any) {
        console.error("Error in send-security-otp API:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to dispatch security OTP." },
            { status: 500 }
        );
    }
}

