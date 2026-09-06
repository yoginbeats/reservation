import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Ticket, Building, CalendarCheck, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminReportsPage() {
    const supabase = await createClient();

    // Fetch metrics
    const { count: onlineCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_source', 'ONLINE');

    const { count: walkInCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_source', 'WALK_IN');

    const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'PAID');

    const totalRevenue = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Operational Reports</h1>
                <p className="text-muted-foreground">Comprehensive analytics on reservations, terminal sales, and payment collections.</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-emerald-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Total Collected Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600">
                            ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Confirmed online & walk-in payments</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Online Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-purple-600">{onlineCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">PayMongo passenger reservations</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-600">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Walk-in Counter Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-600">{walkInCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Daet, PITX, Cubao terminal tellers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Terminal Breakdown Notice */}
            <Card>
                <CardHeader>
                    <CardTitle>Centralized Multi-Terminal Summary</CardTitle>
                    <CardDescription>Single database integration across all Superlines stations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-4 border border-blue-200 text-sm text-blue-900 dark:text-blue-200">
                        <p className="font-bold">Architecture Verification:</p>
                        <p className="text-xs mt-1">
                            All bookings from Daet, PITX, Cubao, and Online Passengers are consolidated in real time under the central PostgreSQL inventory table.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
