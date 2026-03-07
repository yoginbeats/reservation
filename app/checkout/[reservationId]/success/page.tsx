import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Ticket, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function PaymentSuccessPage({ params }: { params: { reservationId: string } }) {
    const { reservationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Fetch payment record to get PayMongo Session ID
    const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('reservation_id', reservationId)
        .single();

    if (payment && payment.status === 'pending') {
        // Verify with PayMongo
        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (secretKey && secretKey !== "sk_test_placeholder_key") {
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
                }
            };

            const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${payment.transaction_id}`, options);
            const sessionData = await response.json();

            if (response.ok && sessionData.data.attributes.status === 'paid') {
                // Update DB
                await supabase
                    .from('payments')
                    .update({ status: 'completed' })
                    .eq('id', payment.id);

                await supabase
                    .from('reservations')
                    .update({ status: 'confirmed' })
                    .eq('id', reservationId);

                // Potential: Create ticket record here if not automated by DB trigger
            }
        }
    }

    return (
        <div className="container mx-auto max-w-2xl py-20">
            <Card className="text-center p-8 space-y-6 border-2 border-green-500/20">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">Payment Successful!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground text-lg">
                        Thank you for your payment. Your seat has been successfully reserved and your ticket is ready.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Link href="/my-tickets" className="w-full">
                            <Button className="w-full h-12 gap-2" variant="default">
                                <Ticket className="h-5 w-5" />
                                VIEW TICKETS
                            </Button>
                        </Link>
                        <Link href="/dashboard" className="w-full">
                            <Button className="w-full h-12 gap-2" variant="outline">
                                DASHBOARD
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
