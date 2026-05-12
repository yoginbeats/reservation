"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cancelReservationAction } from "@/app/actions/reservation";
import { toast } from "sonner";
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

interface CancelTicketButtonProps {
    reservationId: string;
}

export function CancelTicketButton({ reservationId }: CancelTicketButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const result = await cancelReservationAction(reservationId);
            
            if (result.success) {
                toast.success("Trip cancelled successfully.");
                setIsOpen(false);
            } else {
                toast.error(result.error || "Failed to cancel trip.");
            }
        } catch (error) {
            console.error("Error cancelling trip:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button className="rounded-full bg-red-600 px-4 py-1 h-auto text-[10px] font-bold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg active:scale-95 uppercase tracking-widest">
                    Cancel
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Trip</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to cancel this trip? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Back</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Yes, Cancel Trip
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
