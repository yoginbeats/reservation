import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Ticket, Users, Plus, ArrowRight, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
interface AdminDashboardProps {
    branchName?: string;
}

export default async function AdminDashboard({ branchName }: AdminDashboardProps) {
    const supabase = await createClient();

    // 1. Total Reservations (Global)
    const { count: reservationCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

    // 2. Issued Tickets (Global)
    const { count: ticketCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });

    // 3. Total Users (Global)
    const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });


    // 5. Recent Activity (Global - View all available seats)
    const { data: recentReservations } = await supabase
        .from('reservations')
        .select('*, profiles:customer_id(full_name), trips:trip_id(origin, destination)')
        .order('created_at', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {branchName ? `${branchName} Terminal Dashboard` : 'Admin Dashboard'}
                </h1>
                <p className="text-muted-foreground italic">
                    Welcome back! {branchName ? `Managing Superlines ${branchName} operations.` : "Here's an overview of the Superlines reservation system."}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-0 border-l-4 border-blue-500 shadow-md rounded-lg bg-white dark:bg-zinc-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Reservations</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tighter">{reservationCount || 0}</div>
                        <p className="text-xs text-muted-foreground italic pt-1">Lifetime bookings (Global)</p>
                    </CardContent>
                </Card>
                <Card className="border-0 border-l-4 border-green-500 shadow-md rounded-lg bg-white dark:bg-zinc-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Issued Tickets</CardTitle>
                        <Ticket className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tighter">{ticketCount || 0}</div>
                        <p className="text-xs text-muted-foreground italic pt-1">Valid tickets (Global)</p>
                    </CardContent>
                </Card>
                <Card className="border-0 border-l-4 border-purple-500 shadow-md rounded-lg bg-white dark:bg-zinc-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tighter">{userCount || 0}</div>
                        <p className="text-xs text-muted-foreground italic pt-1">Registered accounts</p>
                    </CardContent>
                </Card>

            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3 mt-6">
                <Link href="/admin/reservations" className="block">
                    <Card className="group h-full cursor-pointer border-2 border-transparent transition-all hover:border-red-600 hover:shadow-xl bg-white dark:bg-zinc-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-red-50 p-4 transition-colors group-hover:bg-red-600 group-hover:text-white dark:bg-red-900/20">
                                    <Plus className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
                                </div>
                                <ArrowRight className="h-6 w-6 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2 text-xl">Manual Reservation</CardTitle>
                            <CardDescription className="text-base text-zinc-500">Create a new booking manually.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/tickets" className="block">
                    <Card className="group h-full cursor-pointer border-2 border-transparent transition-all hover:border-red-600 hover:shadow-xl bg-white dark:bg-zinc-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-red-50 p-4 transition-colors group-hover:bg-red-600 group-hover:text-white dark:bg-red-900/20">
                                    <Ticket className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
                                </div>
                                <ArrowRight className="h-6 w-6 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2 text-xl">New Ticket</CardTitle>
                            <CardDescription className="text-base text-zinc-500">Issue a new ticket for a passenger.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/users" className="block">
                    <Card className="group h-full cursor-pointer border-2 border-transparent transition-all hover:border-red-600 hover:shadow-xl bg-white dark:bg-zinc-900">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-2xl bg-red-50 p-4 transition-colors group-hover:bg-red-600 group-hover:text-white dark:bg-red-900/20">
                                    <UserPlus className="h-7 w-7 text-red-600 group-hover:text-white transition-colors" />
                                </div>
                                <ArrowRight className="h-6 w-6 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2 text-xl">Add User</CardTitle>
                            <CardDescription className="text-base text-zinc-500">Register a new system user.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-md rounded-lg bg-white dark:bg-zinc-900 mt-6 overflow-hidden">
                <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 py-4">
                    <CardTitle className="text-base font-bold text-red-700 dark:text-red-500 m-0">Global Activity</CardTitle>
                    <CardDescription className="m-0 mt-1">Latest reservations and ticket activity across all terminals.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {recentReservations && recentReservations.length > 0 ? (
                            recentReservations.map((res: any) => {
                                const customer = Array.isArray(res.profiles) ? res.profiles[0] : res.profiles;
                                const trip = Array.isArray(res.trips) ? res.trips[0] : res.trips;
                                return (
                                    <div key={res.id} className="flex items-center gap-6 p-6 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0">
                                            <CalendarCheck className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold uppercase tracking-tight">Reservation #{res.id.slice(0, 8)}</p>
                                                {trip && (
                                                    <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                                                        {trip.origin} → {trip.destination}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground italic">
                                                By <span className="font-medium text-blue-600">{customer?.full_name || 'Unknown'}</span> • {new Date(res.created_at).toLocaleDateString()}
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
