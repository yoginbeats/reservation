"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface TicketQrCodeProps {
    value: string;
    size?: number;
    className?: string;
}

/**
 * Renders a real, standards-compliant, scannable QR Code image encoding the ticket's qr_token.
 */
export function TicketQrCode({ value, size = 160, className = "h-full w-full" }: TicketQrCodeProps) {
    const [dataUrl, setDataUrl] = useState<string>("");

    useEffect(() => {
        let active = true;
        if (!value) {
            setDataUrl("");
            return;
        }

        QRCode.toDataURL(value.trim(), {
            width: Math.max(size, 240),
            margin: 2,
            errorCorrectionLevel: "M",
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
        })
            .then((url) => {
                if (active) setDataUrl(url);
            })
            .catch((err) => {
                console.error("Failed to generate QR code:", err);
            });

        return () => {
            active = false;
        };
    }, [value, size]);

    if (!dataUrl) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-white text-[10px] font-mono text-zinc-400">
                QR...
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={dataUrl}
            alt={`Ticket QR Code: ${value}`}
            className={`${className} object-contain bg-white select-none`}
        />
    );
}
