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
    const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid');

    const revenue = payments?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

    // Fetch recent activity (recent reservations)
    const { data: recentReservations } = await supabase
        .from('reservations')
        .select('*, profiles:customer_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Admin Dashboard</h1>
                <p className="text-muted-foreground italic">
                    Welcome back! Here&apos;s an overview of the Superlines reservation system.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm shadow-zinc-200 dark:shadow-none bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Reservations</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tighter">{reservationCount || 0}</div>
                        <p className="text-xs text-muted-foreground italic pt-1">Lifetime bookings</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-zinc-200 dark:shadow-none bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Issued Tickets</CardTitle>
                        <Ticket className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tighter">{ticketCount || 0}</div>
                        <p className="text-xs text-muted-foreground italic pt-1">Valid tickets generated</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-zinc-200 dark:shadow-none bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tighter">{userCount || 0}</div>
                        <p className="text-xs text-muted-foreground italic pt-1">Registered accounts</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-zinc-200 dark:shadow-none bg-white dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tighter text-red-600">
                            ₱{revenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground italic pt-1">Total collected</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b">
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest reservations and ticket activity across the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {recentReservations && recentReservations.length > 0 ? (
                            recentReservations.map((res: any) => {
                                const customer = Array.isArray(res.profiles) ? res.profiles[0] : res.profiles;
                                return (
                                    <div key={res.id} className="flex items-center gap-6 p-6 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                                            <CalendarCheck className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold uppercase tracking-tight">Reservation #{res.id.slice(0, 8)}</p>
                                            <p className="text-xs text-muted-foreground italic">
                                                By <span className="font-medium text-blue-600">{customer?.full_name || 'Unknown'}</span> • {new Date(res.created_at).toLocaleDateString()} at {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${res.status === 'confirmed'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : res.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {res.status}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-20 text-center text-muted-foreground italic">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
