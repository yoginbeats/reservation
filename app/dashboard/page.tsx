import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Ticket, Clock, ArrowRight, User, Phone, MapPin, Calendar, ShieldCheck, Edit, AlertCircle, LayoutDashboard, Bus } from "lucide-react";
import { createClient, getUserWithRoleAndTerminal } from "@/lib/supabase/server";

export default async function ClientDashboard() {
    const supabase = await createClient();
    const { user, role, terminal } = await getUserWithRoleAndTerminal();

    if (!user) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Please log in to view your dashboard.</p>
                <Link href="/login">
                    <Button>Go to Login</Button>
                </Link>
            </div>
        );
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

    const meta = user?.user_metadata || {};
    const firstName = profile?.first_name || meta.first_name || meta.given_name || "";
    const middleName = profile?.middle_name || meta.middle_name || "";
    const lastName = profile?.last_name || meta.last_name || meta.family_name || "";
    const fullName = profile?.full_name || `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim() || user.email?.split('@')[0] || "Passenger";
    const phoneNumber = profile?.phone_number || meta.phone_number || null;
    const birthdate = profile?.birthdate || meta.birthdate || null;
    const age = profile?.age ?? meta.age ?? null;
    const address = profile?.address || meta.address || null;
    const isProfileComplete = profile?.profile_completed || (Boolean(phoneNumber) && Boolean(address));

    // Fetch upcoming reservations
    const { data: reservations } = await supabase
        .from('reservations')
        .select(`
            id,
            total_price,
            reservation_status,
            created_at,
            trips (
                destination,
                origin,
                departure_time
            )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

    return (
        <div className="space-y-8 py-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-800 p-8 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur">
                        Official Passenger Portal
                    </span>
                    <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                        Welcome to Superlines Transportation Co. Inc.
                    </h1>
                    <p className="mt-2 text-base font-medium text-red-100">
                        Hello, <span className="font-bold text-white">{fullName}</span>! Manage your online bus reservations, book trips, and view your digital tickets easily.
                    </p>
                </div>
                <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            </div>

            {/* Staff & Terminal Portal Quick Access Banner (If user has special role) */}
            {(role === 'ADMIN' || role === 'TELLER' || role === 'CONDUCTOR') && (
                <div className="rounded-xl border-2 border-blue-500/50 bg-gradient-to-r from-blue-950/60 to-zinc-900 p-4 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-600 text-white font-bold">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                                    Official Staff Account
                                </span>
                                <span className="bg-blue-600/30 text-blue-200 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    ROLE: {role}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-white mt-0.5">
                                You are signed in as an authorized Superlines {role.toLowerCase()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {role === 'ADMIN' && (
                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold text-white shadow">
                                <Link href="/admin">
                                    <LayoutDashboard className="h-4 w-4 mr-1.5" />
                                    Go to Admin Portal
                                </Link>
                            </Button>
                        )}
                        {role === 'TELLER' && (
                            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow">
                                <Link href="/teller">
                                    <Ticket className="h-4 w-4 mr-1.5" />
                                    Open Teller Counter
                                </Link>
                            </Button>
                        )}
                        {role === 'CONDUCTOR' && (
                            <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 font-bold text-white shadow">
                                <Link href="/conductor">
                                    <Bus className="h-4 w-4 mr-1.5" />
                                    Open Conductor Portal
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Profile Completion Warning (if missing fields) */}
            {!isProfileComplete && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="font-bold text-sm">Your passenger profile is incomplete</p>
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                                Please provide your middle name, age, birthdate, mobile number, and address for bus manifest regulations.
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0">
                        <Link href="/complete-profile">Complete Profile Now &rarr;</Link>
                    </Button>
                </div>
            )}

            {/* Client Profile Details Card */}
            <Card className="border-2 shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b bg-zinc-50/50 dark:bg-zinc-900/50 pb-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-red-600" />
                        <div>
                            <CardTitle className="text-lg font-bold">My Passenger Account Details</CardTitle>
                            <CardDescription className="text-xs">
                                Verified details used for your bus tickets and passenger manifests
                            </CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="gap-1.5 self-start sm:self-auto font-semibold">
                        <Link href="/complete-profile">
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit Profile</span>
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</p>
                            <p className="font-bold text-base text-foreground">{fullName}</p>
                            {(firstName || lastName) && (
                                <p className="text-xs text-muted-foreground">
                                    {firstName} {middleName ? `${middleName} ` : ""}{lastName}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</p>
                            <p className="font-semibold text-foreground">{user.email}</p>
                            <span className="inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                Verified Account
                            </span>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Phone</p>
                            <p className="font-semibold text-foreground">{phoneNumber || "Not provided yet"}</p>
                            <p className="text-xs text-muted-foreground">For ticket & SMS alerts</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age & Birthdate</p>
                            <p className="font-semibold text-foreground">
                                {age ? `${age} years old` : "Age not set"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {birthdate ? new Date(birthdate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Birthdate not set"}
                            </p>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Residential / Travel Address</p>
                            <p className="font-semibold text-foreground">{address || "Not provided yet"}</p>
                            <p className="text-xs text-muted-foreground">Registered home terminal / destination</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/book" className="block">
                    <Card className="group h-full cursor-pointer transition-all hover:border-red-500 hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                                    <CalendarCheck className="h-6 w-6 text-red-600" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2">New Reservation</CardTitle>
                            <CardDescription>Book a new trip for your upcoming travel via PayMongo.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/my-tickets" className="block">
                    <Card className="group h-full cursor-pointer transition-all hover:border-emerald-500 hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                                    <Ticket className="h-6 w-6 text-emerald-600" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2">My Digital Tickets</CardTitle>
                            <CardDescription>Access your purchased tickets and board bus via QR code.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/complete-profile" className="block">
                    <Card className="group h-full cursor-pointer transition-all hover:border-blue-500 hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardTitle className="mb-2">Account & Password</CardTitle>
                            <CardDescription>Update your personal details, phone number, and password.</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Upcoming Reservations */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Your Reservations</CardTitle>
                            <CardDescription>Your latest booking activity.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/my-tickets">View All Tickets</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {reservations && reservations.length > 0 ? (
                            reservations.map((res: any) => {
                                const trip = res.trips;
                                const tripDate = trip?.departure_time ? new Date(trip.departure_time) : new Date(res.created_at);
                                const month = tripDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                                const day = tripDate.getDate();

                                return (
                                    <div key={res.id} className="flex items-center gap-4 rounded-lg border p-4">
                                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                            <span className="text-xs font-bold text-red-600">{month}</span>
                                            <span className="text-xl font-bold text-red-600">{day}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-base">
                                                {trip ? `${trip.origin} to ${trip.destination}` : `Reservation #${res.id.slice(0, 6)}`}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {trip?.departure_time
                                                    ? new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Time TBA'}
                                                {' • ' + (trip?.bus_number || 'Superlines Express')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${res.reservation_status === 'confirmed'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {res.reservation_status}
                                            </span>
                                            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                                                <Link href="/my-tickets">Details</Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="mb-2 rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                                    <Ticket className="h-6 w-6 text-zinc-400" />
                                </div>
                                <h3 className="text-sm font-medium">No reservations yet</h3>
                                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                    You haven&apos;t made any reservations yet. Start your journey today!
                                </p>
                                <Button variant="link" asChild className="mt-2 text-red-600">
                                    <Link href="/book">Book Now</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
