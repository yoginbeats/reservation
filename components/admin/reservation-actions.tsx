"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Terminal, Printer } from "lucide-react";

interface ReservationActionsProps {
    reservationId: string;
    status: string;
    role: string;
    branch?: string | null;
    tripOrigin?: string;
}

export function ReservationActions({ reservationId, status, role, branch, tripOrigin }: ReservationActionsProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const isAdmin = role === 'admin';
    const isBranchAdmin = role === 'branch_admin';
    const isLocalTrip = branch && tripOrigin && branch.toLowerCase() === tripOrigin.toLowerCase();

    // Permissions logic
    const canCancel = isAdmin || (isBranchAdmin && isLocalTrip);
    const canPrintManifest = isAdmin || (isBranchAdmin && isLocalTrip);

    const handleUpdateStatus = async (newStatus: string) => {
        setLoading(newStatus);

        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status: newStatus })
                .eq('id', reservationId);

            if (error) throw error;

            toast.success(`Reservation ${newStatus} successfully!`);
            router.refresh(); // Refresh the server component data
        } catch (error: any) {
            toast.error(error.message || "Failed to update reservation status");
        } finally {
            setLoading(null);
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
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={!!loading}
                    onClick={() => {
                        if (confirm("Are you sure you want to CANCEL this reservation? This cannot be undone.")) {
                            handleUpdateStatus('cancelled');
                        }
                    }}
                >
                    {loading === 'cancelled' ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                    )}
                    Cancel
                </Button>
            )}

            {canPrintManifest && (
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                        toast.info("Opening manifest for printing...");
                        // In a real app, this would route to a printable manifest page
                        window.open(`/admin/reservations/${reservationId}/manifest`, '_blank');
                    }}
                >
                    <Printer className="h-4 w-4 mr-1" />
                    Print Manifest
                </Button>
            )}

            <Button variant="ghost" size="sm" className="h-8">Details</Button>
        </div>
    );
}
