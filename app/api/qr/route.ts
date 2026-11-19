import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

/**
 * GET /api/qr?token=TKT-20261119-XXXXXX&size=240&format=png|svg&download=1
 * Public QR Code Generator API for tickets, boarding passes, and email confirmations.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rawValue =
            searchParams.get("token") ||
            searchParams.get("data") ||
            searchParams.get("text") ||
            "";

        const value = rawValue.trim();
        if (!value || value.length > 512) {
            return NextResponse.json(
                { success: false, error: "Missing or invalid 'token' query parameter." },
                { status: 400 }
            );
        }

        const sizeParam = Number(searchParams.get("size") || "240");
        const size = Number.isFinite(sizeParam)
            ? Math.min(800, Math.max(100, Math.round(sizeParam)))
            : 240;

        const format = (searchParams.get("format") || "png").toLowerCase();
        const isDownload = searchParams.get("download") === "1";

        if (format === "svg") {
            const svg = await QRCode.toString(value, {
                type: "svg",
                width: size,
                margin: 2,
                errorCorrectionLevel: "M",
                color: { dark: "#000000", light: "#FFFFFF" },
            });

            return new NextResponse(svg, {
                status: 200,
                headers: {
                    "Content-Type": "image/svg+xml; charset=utf-8",
                    "Cache-Control": "public, max-age=86400",
                    ...(isDownload
                        ? { "Content-Disposition": `attachment; filename="${value.replace(/[^a-zA-Z0-9_-]/g, "_")}.svg"` }
                        : {}),
                },
            });
        }

        const pngBuffer = await QRCode.toBuffer(value, {
            type: "png",
            width: size,
            margin: 2,
            errorCorrectionLevel: "M",
            color: { dark: "#000000", light: "#FFFFFF" },
        });

        return new NextResponse(new Uint8Array(pngBuffer), {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=86400",
                ...(isDownload
                    ? { "Content-Disposition": `attachment; filename="${value.replace(/[^a-zA-Z0-9_-]/g, "_")}.png"` }
                    : {}),
            },
        });
    } catch (error) {
        console.error("GET /api/qr error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to generate QR code." },
            { status: 500 }
        );
    }
}
