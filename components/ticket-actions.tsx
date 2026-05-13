"use client";

import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toJpeg } from "html-to-image";
import { toast } from "sonner";

interface TicketActionsProps {
    reservationId: string;
    tripOrigin: string;
    tripDestination: string;
}

export function TicketActions({ reservationId, tripOrigin, tripDestination }: TicketActionsProps) {
    const [isSharing, setIsSharing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleCapture = async () => {
        const ticketElement = document.getElementById(`ticket-${reservationId}`);
        if (!ticketElement) throw new Error("Ticket element not found");
        
        // Small delay to ensure the UI is fully painted
        await new Promise(resolve => setTimeout(resolve, 100));
        const dataUrl = await toJpeg(ticketElement, {
            quality: 0.9,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            filter: (node) => {
                if (node.nodeType === 1) { // Node.ELEMENT_NODE
                    const element = node as HTMLElement;
                    if (element.hasAttribute && element.hasAttribute('data-html2canvas-ignore')) {
                        return false;
                    }
                }
                return true;
            }
        });
        
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        if (!blob) throw new Error("Could not generate image");
        
        return { blob, file: new File([blob], `ticket-${reservationId.slice(0, 8)}.jpg`, { type: 'image/jpeg' }) };
    };

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const { blob } = await handleCapture();
            const link = document.createElement('a');
            link.download = `ticket-${reservationId.slice(0, 8)}.jpg`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            toast.success("Ticket downloaded as image!");
        } catch (error) {
            console.error("Error downloading ticket:", error);
            toast.error("Failed to download ticket.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        try {
            setIsSharing(true);
            const { file } = await handleCapture();

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Digital Ticket',
                    text: `Here is my digital ticket for my trip from ${tripOrigin} to ${tripDestination}!`,
                    files: [file]
                });
                toast.success("Ticket shared successfully!");
            } else {
                // Fallback to download if Web Share API is not supported
                const link = document.createElement('a');
                link.download = `ticket-${reservationId.slice(0, 8)}.jpg`;
                link.href = URL.createObjectURL(file);
                link.click();
                URL.revokeObjectURL(link.href);
                toast.success("Ticket downloaded as image!");
            }
        } catch (error) {
            console.error("Error sharing ticket:", error);
            toast.error("Failed to share ticket.");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="bg-transparent px-6 pb-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-4 w-full">
            <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-xl h-10 border-zinc-200 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 shadow-sm" onClick={handleDownload} disabled={isDownloading || isSharing}>
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isDownloading ? "Saving..." : "Save Image"}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2 rounded-xl h-10 border-zinc-200 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 shadow-sm" onClick={handleShare} disabled={isDownloading || isSharing}>
                {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {isSharing ? "Sharing..." : "Share"}
            </Button>
        </div>
    );
}
