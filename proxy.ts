import { type NextRequest, NextResponse } from "next/server";

// ==============================================================================
// 🚧 TEMPORARY MAINTENANCE TOGGLE
// Set to TRUE to turn ON maintenance mode (blocks all traffic, shows 503 page).
// Set to FALSE when you are ready for Thesis Defense / Testing.
// ==============================================================================
export const MAINTENANCE_MODE = true;

export default async function proxy(request: NextRequest) {
  if (MAINTENANCE_MODE) {
    return new NextResponse(
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Under Maintenance | Superlines</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background: #09090b;
        color: #f4f4f5;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        box-sizing: border-box;
      }
      .card {
        max-width: 520px;
        width: 100%;
        background: #18181b;
        border: 2px solid rgba(234, 179, 8, 0.6);
        border-radius: 24px;
        padding: 44px 32px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      }
      .badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 9999px;
        background: rgba(234, 179, 8, 0.15);
        color: #facc15;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 20px;
        border: 1px solid rgba(234, 179, 8, 0.3);
      }
      h1 {
        font-size: 28px;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 12px 0;
      }
      p {
        font-size: 15px;
        color: #a1a1aa;
        line-height: 1.6;
        margin: 0 0 20px 0;
      }
      .notice {
        margin-top: 28px;
        padding-top: 22px;
        border-top: 1px solid #27272a;
        font-size: 12px;
        color: #71717a;
        line-height: 1.5;
      }
      .notice strong {
        color: #d4d4d8;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">System Maintenance</div>
      <h1>We’ll be back soon</h1>
      <p>Temporary maintenance is currently in progress. The online booking and reservation system is temporarily unavailable.</p>
      <div class="notice">
        <strong>Academic Project Notice</strong><br>
        This portal is for academic project purposes only. For actual passenger bus trips and bookings, please proceed to your nearest official Superlines terminal.
      </div>
    </div>
  </body>
</html>`,
      {
        status: 503,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "Retry-After": "86400",
        },
      }
    );
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: ["/:path*"],
};
