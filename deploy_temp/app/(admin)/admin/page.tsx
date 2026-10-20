import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Ticket, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface RecentReservation {
    id: string;
    created_at: string;
    reservation_status: string;
    customers: {
        full_name: string;
    } | null;
}

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Fetch real stats
    // Note: Using 'head: true' to get count without fetching data for performance
    const { count: reservationCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

    const { count: ticketCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });

    const { count: userCount } = await supabase
        .from('profiles') // or customers/user_roles depending on preference
        .select('*', { count: 'exact', head: true });

    // Calculate revenue (sum of payments where status is paid)
    // Supabase doesn't have a simple .sum() in JS client without RPC or fetch all
    // For scalability, specific query or RPC is better.
    // For now, checking 'payments' table size might be misleading if we want AMOUNT.
    // Let's just count 'Confirmed' reservations or similar for now as a proxy or fetch all payments (careful with large data).
    // Fetch successful payments (supporting case-insensitive PAID / paid, or status column)
    let revenue = 0;
    try {
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, payment_status, status');
        
        if (payments) {
            revenue = payments
                .filter(p => (p.payment_status || p.status || '').toUpperCase() === 'PAID')
                .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        }
    } catch {}

    // Fetch recent activity (recent reservations)
    const { data: recentReservations } = await supabase
        .from('reservations')
        .select('*, customers(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">Admin Dashboard</h1>
                <p className="text-zinc-500 text-sm">
                    Welcome back! Here&apos;s an overview of your system.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600">Total Reservations</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">{reservationCount || 0}</div>
                        <p className="text-xs text-zinc-500">Lifetime bookings</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600">Issued Tickets</CardTitle>
                        <Ticket className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">{ticketCount || 0}</div>
                        <p className="text-xs text-zinc-500">Valid tickets generated</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">{userCount || 0}</div>
                        <p className="text-xs text-zinc-500">Registered accounts</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-zinc-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600">Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900">
                            {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(revenue)}
                        </div>
                        <p className="text-xs text-zinc-500">Total collected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-zinc-900">Recent Activity</CardTitle>
                    <CardDescription className="text-zinc-500">Latest reservations and ticket activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentReservations && recentReservations.length > 0 ? (
                            recentReservations.map((res: RecentReservation) => (
                                <div key={res.id} className="flex items-center gap-4 rounded-lg border border-zinc-200 p-4 bg-zinc-50/50">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                        <CalendarCheck className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-zinc-900">Reservation #{res.id.slice(0, 8)}</p>
                                        <p className="text-xs text-zinc-500">
                                            By {res.customers?.full_name || 'Unknown'} • {new Date(res.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${res.reservation_status === 'confirmed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {res.reservation_status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-sm text-zinc-500">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
