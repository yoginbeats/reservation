import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Bus, ArrowRight, Calendar, Clock, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ConductorDashboardPage() {
    const supabase = await createClient();

    // Fetch active trips for verification
    let tripsRaw: any[] = [];
    const { data: rawTrips, error } = await supabase
        .from('trips')
        .select('*, bus:buses(bus_number, bus_type)')
        .order('departure_time', { ascending: true });

    if (error) {
        const { data: fallbackTrips } = await supabase
            .from('trips')
            .select('*')
            .order('departure_time', { ascending: true });
        if (fallbackTrips) tripsRaw = fallbackTrips;
    } else if (rawTrips) {
        tripsRaw = rawTrips;
    }

    const trips = tripsRaw.map((t: any) => ({
        ...t,
        fare_amount: t.fare_amount ?? t.price ?? 850,
        status: t.status || 'SCHEDULED',
        route: {
            origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
            destination: { name: t.destination || t.route?.destination?.name || "Daet" }
        },
        bus: t.bus || { bus_number: "Superlines Express", bus_type: "REGULAR AIRCON" }
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Conductor Terminal Portal</h1>
                    <p className="text-sm text-zinc-400">Verify passenger tickets and confirm boarding status for assigned trips.</p>
                </div>
                <Button size="lg" asChild className="bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-600/30">
                    <Link href="/conductor/scan">
                        <QrCode className="mr-2 h-5 w-5" />
                        Open QR Code Camera Scanner
                    </Link>
                </Button>
            </div>

            {/* Scheduled Trips */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-200">Select Bus Schedule for Verification</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {trips && trips.length > 0 ? (
                        trips.map((t: any) => {
                            const origin = t.route?.origin?.name || "Origin";
                            const dest = t.route?.destination?.name || "Destination";
                            const busNum = t.bus?.bus_number || "Bus TBD";
                            const depTime = new Date(t.departure_time);

                            return (
                                <Card key={t.id} className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between text-xs font-mono font-bold text-red-500">
                                            <span>{busNum}</span>
                                            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] text-zinc-300 border border-zinc-800">
                                                {t.status}
                                            </span>
                                        </div>
                                        <CardTitle className="text-lg flex items-center justify-between mt-1 text-white">
                                            <span>{origin}</span>
                                            <ArrowRight className="h-4 w-4 text-zinc-500" />
                                            <span>{dest}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between text-xs text-zinc-400">
                                            <span>Date: {depTime.toLocaleDateString()}</span>
                                            <span>Time: {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-zinc-800">
                                            <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold" asChild>
                                                <Link href={`/conductor/scan?trip_id=${t.id}`}>
                                                    <QrCode className="mr-2 h-4 w-4" /> Scan Tickets
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center text-zinc-500 col-span-full">No active trip schedules found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
