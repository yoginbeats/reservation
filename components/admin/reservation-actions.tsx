"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, RotateCcw, Printer, AlertTriangle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import jsPDF from "jspdf";
import htmlToImage, { toPng } from "html-to-image";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TicketViewDialog } from "@/components/admin/ticket-view-dialog";
import { TicketBoardingPass } from "@/components/admin/ticket-boarding-pass";

interface ReservationActionsProps {
    reservationId: string;
    status: string;
    role: string;
    branch?: string | null;
    tripOrigin?: string;
    reservation?: any;
}

export function ReservationActions({ reservationId, status, role, branch, tripOrigin, reservation }: ReservationActionsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();
    const ticketRef = useRef<HTMLDivElement>(null);

    const isAdmin = role === 'admin';
    const isBranchAdmin = role === 'branch_admin';
    const isLocalTrip = branch && tripOrigin && branch.toLowerCase() === tripOrigin.toLowerCase();

    // Permissions logic
    const canCancel = isAdmin || (isBranchAdmin && isLocalTrip);
    const canPrintTicket = isAdmin || (isBranchAdmin && isLocalTrip);

    const handleRefund = async () => {
        setLoading('refund');
        try {
            const response = await fetch("/api/paymongo/refund", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reservationId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process refund");
            }

            toast.success("Refund processed and reservation cancelled!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Refund failed");
        } finally {
            setLoading(null);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setLoading(newStatus);

        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status: newStatus })
                .eq('id', reservationId);

            if (error) throw error;

            toast.success(`Reservation ${newStatus} successfully!`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update reservation status");
        } finally {
            setLoading(null);
        }
    };

    const generatePDF = async () => {
        if (!reservation || !ticketRef.current) {
            toast.error("Reservation details not available for printing");
            return;
        }

        const toastId = toast.loading("Generating high-quality PDF...");

        try {
            // Temporarily make it visible to take a snapshot, but keep it off-screen
            const element = ticketRef.current;
            element.style.display = "block";

            // Allow time for display: block to apply and any fonts to render
            await new Promise(resolve => setTimeout(resolve, 50));

            const dataUrl = await toPng(element, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: "#ffffff",
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                }
            });

            element.style.display = "none";

            // Get original dimensions to scale down the PDF so it's sharp
            const img = new Image();
            img.src = dataUrl;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // Calculate dimensions based on the 3x scaled image
            const pdfWidth = img.width / 3;
            const pdfHeight = img.height / 3;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`ticket-${reservation.id.slice(0, 8)}.pdf`);

            toast.success("PDF Ticket generated successfully!", { id: toastId });
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error("Failed to generate PDF. Please try again.", { id: toastId });
        }
    };

    return (
        <div className="flex items-center gap-2 shrink-0">
            {status === 'pending' && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    disabled={!!loading}
                    onClick={() => handleUpdateStatus('confirmed')}
                >
                    {loading === 'confirmed' ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Confirm
                </Button>
            )}

            {(status === 'pending' || status === 'confirmed') && canCancel && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={!!loading}
                        >
                            {loading === 'cancelled' ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Cancel
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                WARNING: Cancel Reservation
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-600 text-sm mt-2">
                                Are you absolutely sure you want to cancel this reservation? This will free up Seat {reservation?.seat_number} for other passengers. This action CANNOT be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUpdateStatus('cancelled')} className="bg-red-600 hover:bg-red-700 text-white">
                                <Trash2 className="h-4 w-4 mr-2" /> Yes, Cancel Reservation
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {status === 'confirmed' && isAdmin && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            disabled={!!loading}
                        >
                            {loading === 'refund' ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <RotateCcw className="h-4 w-4 mr-1" />
                            )}
                            Refund
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="h-5 w-5" />
                                WARNING: Refund Transaction
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-600 text-sm mt-2">
                                Are you absolutely sure you want to refund this transaction? The reservation will be cancelled and a 20% management fee will be deducted (80% will be refunded to the customer). This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRefund} className="bg-orange-600 hover:bg-orange-700 text-white">
                                <RotateCcw className="h-4 w-4 mr-2" /> Yes, Refund Transaction
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {canPrintTicket && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={generatePDF}
                >
                    <Printer className="h-4 w-4 mr-1" />
                    Print Ticket
                </Button>
            )}

            {reservation ? (
                <TicketViewDialog
                    ticket={reservation}
                    trigger={
                        <Button variant="ghost" size="sm" className="h-8 text-zinc-600 hover:text-zinc-900">
                            Details
                        </Button>
                    }
                />
            ) : (
                <Button variant="ghost" size="sm" className="h-8 text-zinc-600 hover:text-zinc-900">
                    Details
                </Button>
            )}

            {reservation && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '450px' }}>
                    <div ref={ticketRef} style={{ display: 'none', width: '450px' }}>
                        <TicketBoardingPass ticket={reservation} />
                    </div>
                </div>
            )}
        </div>
    );
}
