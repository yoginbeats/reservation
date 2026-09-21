"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Bus, ArrowRight, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminTripsPage() {
    const [trips, setTrips] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    // Form inputs
    const [routeId, setRouteId] = useState("");
    const [busId, setBusId] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [fareAmount, setFareAmount] = useState("850");

    const supabase = createClient();

    const fetchDropdowns = async () => {
        const { data: rData } = await supabase.from('routes').select(`id, origin:origin_terminal_id(name), destination:destination_terminal_id(name)`);
        const { data: bData } = await supabase.from('buses').select('id, bus_number');

        if (rData && rData.length > 0) {
            setRoutes(rData);
            setRouteId(rData[0].id);
        }
        if (bData && bData.length > 0) {
            setBuses(bData);
            setBusId(bData[0].id);
        }
    };

    const fetchTrips = async () => {
        setLoading(true);
        let rawData: any[] = [];

        const { data, error } = await supabase
            .from('trips')
            .select('*, bus:buses(bus_number, bus_type)')
            .order('departure_time', { ascending: true });

        if (error) {
            const { data: fallbackData } = await supabase
                .from('trips')
                .select('*')
                .order('departure_time', { ascending: true });
            if (fallbackData) rawData = fallbackData;
        } else if (data) {
            rawData = data;
        }

        const normalizedTrips = rawData.map((t: any) => ({
            ...t,
            fare_amount: t.fare_amount ?? t.price ?? 850,
            status: t.status || 'SCHEDULED',
            route: {
                origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
                destination: { name: t.destination || t.route?.destination?.name || "Daet" }
            },
            bus: t.bus || {
                bus_number: "Superlines Express"
            }
        }));

        setTrips(normalizedTrips);
        setLoading(false);
    };

    useEffect(() => {
        fetchTrips();
        fetchDropdowns();
    }, []);

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!busId || !departureTime) return;

        // Find selected route origin & dest if available
        const selectedRoute = routes.find(r => r.id === routeId);
        const originName = selectedRoute?.origin?.name || "Cubao";
        const destName = selectedRoute?.destination?.name || "Daet";

        const { data: newTrip } = await supabase.from('trips').insert({
            bus_id: busId,
            origin: originName,
            destination: destName,
            departure_time: new Date(departureTime).toISOString(),
            price: Number(fareAmount),
            created_at: new Date().toISOString()
        }).select().single();

        if (newTrip) {
            // Auto initialize 45 seats for this new trip in trip_seats table
            const seatsToInsert = Array.from({ length: 45 }, (_, i) => ({
                trip_id: newTrip.id,
                seat_number: i + 1,
                is_available: true,
            }));
            await supabase.from('trip_seats').insert(seatsToInsert);
        }

        setOpenModal(false);
        fetchTrips();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Trip & Schedule Management</h1>
                    <p className="text-muted-foreground">Schedule bus departures and initialize central seat inventory.</p>
                </div>

                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Schedule New Trip
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Schedule New Departure Trip</DialogTitle>
                            <DialogDescription>Assign a route, bus unit, and departure time.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTrip} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="tRoute">Select Route</Label>
                                <select id="tRoute" className="w-full rounded-md border p-2 bg-background" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                                    {routes.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.origin?.name} ➔ {r.destination?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tBus">Assign Bus Unit</Label>
                                <select id="tBus" className="w-full rounded-md border p-2 bg-background" value={busId} onChange={(e) => setBusId(e.target.value)}>
                                    {buses.map((b) => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tTime">Departure Date & Time</Label>
                                <Input id="tTime" type="datetime-local" required value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tFare">Fare Amount (₱)</Label>
                                <Input id="tFare" type="number" required value={fareAmount} onChange={(e) => setFareAmount(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create & Initialize Seats</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Scheduled Trips</CardTitle>
                    <CardDescription>Live trips accessible across Daet, PITX, Cubao tellers, and online passengers.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading trips...</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50 text-xs font-semibold uppercase">
                                    <tr className="text-left">
                                        <th className="p-4">Route</th>
                                        <th className="p-4">Departure Time</th>
                                        <th className="p-4">Bus Unit</th>
                                        <th className="p-4">Fare</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trips.map((t) => (
                                        <tr key={t.id} className="border-b hover:bg-muted/40">
                                            <td className="p-4 font-bold flex items-center gap-2">
                                                <span>{t.route?.origin?.name}</span>
                                                <ArrowRight className="h-4 w-4 text-blue-600" />
                                                <span>{t.route?.destination?.name}</span>
                                            </td>
                                            <td className="p-4 font-medium">
                                                {new Date(t.departure_time).toLocaleString()}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-blue-600">{t.bus?.bus_number}</td>
                                            <td className="p-4 font-bold text-emerald-600">₱{t.fare_amount || 850}</td>
                                            <td className="p-4">
                                                <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
