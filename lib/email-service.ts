import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    fromName?: string;
}

interface SendEmailResult {
    success: boolean;
    provider: "GMAIL_SMTP" | "CUSTOM_SMTP" | "RESEND" | "SIMULATION";
    messageId?: string;
    error?: string;
}

// Reuse pooled SMTP transporter across requests for fast, on-time delivery
let cachedTransporter: any = null;
let cachedTransporterKey = "";

function getPooledTransporter(user: string, pass: string, smtpHost?: string, forcePort587 = false) {
    const isCustomHost = Boolean(smtpHost && !smtpHost.includes("gmail"));
    const key = `${user}:${smtpHost || "gmail"}:${forcePort587 ? "587" : "465"}`;
    if (cachedTransporter && cachedTransporterKey === key && !forcePort587) {
        return { transporter: cachedTransporter, isCustomHost };
    }

    const transporter = nodemailer.createTransport(
        isCustomHost
            ? {
                  pool: true,
                  maxConnections: 5,
                  maxMessages: 100,
                  host: smtpHost,
                  port: Number(process.env.SMTP_PORT) || 465,
                  secure: (process.env.SMTP_SECURE || "true") === "true",
                  connectionTimeout: 8000,
                  greetingTimeout: 8000,
                  socketTimeout: 12000,
                  auth: { user, pass },
              }
            : {
                  pool: true,
                  maxConnections: 5,
                  maxMessages: 100,
                  host: "smtp.gmail.com",
                  port: forcePort587 ? 587 : 465,
                  secure: !forcePort587,
                  connectionTimeout: 8000,
                  greetingTimeout: 8000,
                  socketTimeout: 12000,
                  auth: { user, pass },
              }
    );

    if (!forcePort587) {
        cachedTransporter = transporter;
        cachedTransporterKey = key;
    }

    return { transporter, isCustomHost };
}

/**
 * Universal Production Email Dispatcher
 * Automatically detects whether Gmail SMTP, Custom SMTP, or Resend API is configured.
 */
export async function sendLiveEmail({
    to,
    subject,
    html,
    fromName = "Superlines Bus Co.",
}: SendEmailParams): Promise<SendEmailResult> {
    const recipients = Array.isArray(to) ? to : [to];
    const cleanRecipients = recipients.map((e) => e.trim().toLowerCase()).filter(Boolean);

    if (cleanRecipients.length === 0) {
        return {
            success: false,
            provider: "SIMULATION",
            error: "No valid recipient email address provided.",
        };
    }

    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || "djeugenerasco11@gmail.com";
    const gmailAppPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "vzhzkbebacdwprwh").replace(/\s+/g, "");
    const smtpHost = process.env.SMTP_HOST;
    const resendApiKey = process.env.RESEND_API_KEY;

    // =========================================================================
    // 1. GMAIL / CUSTOM SMTP DISPATCH (Pooled, fast, sends to ANY Gmail address)
    // =========================================================================
    if (gmailUser && gmailAppPass) {
        const senderAddress = process.env.SMTP_FROM || `"${fromName}" <${gmailUser}>`;
        const cleanPass = gmailAppPass.replace(/\s+/g, "");

        try {
            const { transporter, isCustomHost } = getPooledTransporter(gmailUser, cleanPass, smtpHost, false);
            const info = await transporter.sendMail({
                from: senderAddress,
                to: cleanRecipients.join(", "),
                subject,
                html,
            });

            console.log(`[Email Service] Live SMTP email delivered to ${cleanRecipients.join(", ")} (ID: ${info.messageId})`);
            return {
                success: true,
                provider: isCustomHost ? "CUSTOM_SMTP" : "GMAIL_SMTP",
                messageId: info.messageId,
            };
        } catch (smtpErr: any) {
            console.warn("[Email Service] Primary SMTP port 465 error, retrying port 587 STARTTLS:", smtpErr?.message || smtpErr);
            cachedTransporter = null;
            cachedTransporterKey = "";

            // Retry once via port 587 STARTTLS if not using a custom host
            if (!smtpHost || smtpHost.includes("gmail")) {
                try {
                    const { transporter } = getPooledTransporter(gmailUser, cleanPass, smtpHost, true);
                    const info = await transporter.sendMail({
                        from: senderAddress,
                        to: cleanRecipients.join(", "),
                        subject,
                        html,
                    });
                    console.log(`[Email Service] Live SMTP (587) delivered to ${cleanRecipients.join(", ")} (ID: ${info.messageId})`);
                    return {
                        success: true,
                        provider: "GMAIL_SMTP",
                        messageId: info.messageId,
                    };
                } catch (retryErr: any) {
                    console.error("[Email Service] SMTP 587 retry error:", retryErr?.message || retryErr);
                }
            }
        }
    }

    // =========================================================================
    // 2. RESEND API DISPATCH
    // =========================================================================
    if (resendApiKey) {
        try {
            const fromEmail = process.env.RESEND_FROM || "Superlines Security <onboarding@resend.dev>";
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendApiKey.trim()}`,
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: cleanRecipients,
                    subject,
                    html,
                }),
            });

            const data = await res.json();
            if (res.ok && data?.id) {
                console.log(`[Email Service] Live Resend API email delivered to ${cleanRecipients.join(", ")} (ID: ${data.id})`);
                return {
                    success: true,
                    provider: "RESEND",
                    messageId: data.id,
                };
            } else {
                console.warn("[Email Service] Resend API returned error:", data);
            }
        } catch (resendErr: any) {
            console.error("[Email Service] Resend API fetch error:", resendErr?.message || resendErr);
        }
    }

    // =========================================================================
    // 3. FALLBACK / SIMULATION (When no credentials configured in .env yet)
    // =========================================================================
    console.warn(
        `[Email Service] No live email credentials configured. To send real emails to Gmail, add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local`
    );

    return {
        success: false,
        provider: "SIMULATION",
        error: "No live email provider configured. Please set GMAIL_USER & GMAIL_APP_PASSWORD or RESEND_API_KEY in .env.local.",
    };
}
