"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";

interface PayNowButtonProps {
    reservationId: string;
}

export function PayNowButton({ reservationId }: PayNowButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/paymongo/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reservationId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to initiate payment");
            }

            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error("Checkout URL not found");
            }
        } catch (error: any) {
            console.error("Payment error:", error);
            toast.error(error.message || "Something went wrong with the payment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            className="w-full h-12 text-lg font-bold"
            variant="destructive"
            onClick={handlePayment}
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    PROCESSING...
                </>
            ) : (
                <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    PAY NOW
                </>
            )}
        </Button>
    );
}
