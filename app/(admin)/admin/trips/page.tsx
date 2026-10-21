"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
    Calendar,
    Plus,
    Bus,
    ArrowRight,
    Clock,
    Users,
    ArrowLeftRight,
    CheckCircle2,
    Ticket,
    Printer,
    Eye,
    X,
    Filter,
    RefreshCw,
    AlertCircle,
    Link as LinkIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getBusFare } from "@/lib/constants/bus-layouts";

interface TripItem {
    id: string;
    origin: string;
    destination: string;
    departure_time: string;
    fare_amount: number;
    status: string;
    bus_id?: string;
    route_id?: string;
    bus?: {
        id?: string;
        bus_number: string;
        bus_type?: string;
        seat_capacity?: number;
    };
    route?: {
        origin?: { name: string };
        destination?: { name: string };
    };
}

export default function AdminTripsPage() {
    const [trips, setTrips] = useState<TripItem[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [allBookings, setAllBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    // Form inputs for scheduling
    const [routeId, setRouteId] = useState("");
    const [selectedTerminalTab, setSelectedTerminalTab] = useState<"ALL" | "Cubao" | "Daet" | "PITX">("ALL");
    const [busId, setBusId] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [fareAmount, setFareAmount] = useState("850");
    const [autoCreateReturn, setAutoCreateReturn] = useState(true);
    const [returnDepartureTime, setReturnDepartureTime] = useState("");

    // Modal for viewing Bound Bus Manifest & Turnaround
    const [selectedTripForManifest, setSelectedTripForManifest] = useState<TripItem | null>(null);

    const supabase = createClient();

    const fetchDropdowns = async () => {
        const { data: rData } = await supabase.from('routes').select(`id, origin:origin_terminal_id(name), destination:destination_terminal_id(name)`);
        const { data: bData } = await supabase.from('buses').select('id, bus_number, bus_type, seat_capacity').order('bus_number');

        if (rData && rData.length > 0) {
            setRoutes(rData);
            setRouteId(rData[0].id);
        }
        if (bData && bData.length > 0) {
            setBuses(bData);
            setBusId(bData[0].id);
            setFareAmount(String(getBusFare(bData[0].bus_type || bData[0].bus_number)));
        }
    };

    const fetchTripsAndBookings = async () => {
        setLoading(true);
        let rawData: any[] = [];

        // 1. Fetch Trips
        const { data, error } = await supabase
            .from('trips')
            .select('*, bus:buses(id, bus_number, bus_type, seat_capacity)')
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

        const normalizedTrips: TripItem[] = rawData.map((t: any) => ({
            id: t.id,
            origin: t.origin || t.route?.origin?.name || "Cubao",
            destination: t.destination || t.route?.destination?.name || "Daet",
            departure_time: t.departure_time,
            fare_amount: t.fare_amount ?? t.price ?? getBusFare(t.bus?.bus_type || t.bus_type),
            status: t.status || 'SCHEDULED',
            bus_id: t.bus_id || t.bus?.id,
            route_id: t.route_id,
            route: {
                origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
                destination: { name: t.destination || t.route?.destination?.name || "Daet" }
            },
            bus: t.bus || {
                bus_number: "Superlines Express",
                bus_type: "REGULAR_AIRCON",
                seat_capacity: 45,
            }
        }));

        setTrips(normalizedTrips);

        // 2. Fetch all bookings to correlate bound passenger rosters
        try {
            const res = await fetch("/api/admin/payments");
            const pData = await res.json();
            if (pData?.success && Array.isArray(pData.bookings)) {
                setAllBookings(pData.bookings);
            }
        } catch (e) {
            console.warn("Could not fetch bookings for trip correlation:", e);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchTripsAndBookings();
        fetchDropdowns();
    }, []);

    // When outbound departure changes, default return trip to +24 hours
    const handleOutboundTimeChange = (timeVal: string) => {
        setDepartureTime(timeVal);
        if (timeVal) {
            try {
                const d = new Date(timeVal);
                d.setDate(d.getDate() + 1); // 24 hours turnaround
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, "0");
                const dd = String(d.getDate()).padStart(2, "0");
                const hh = String(d.getHours()).padStart(2, "0");
                const min = String(d.getMinutes()).padStart(2, "0");
                setReturnDepartureTime(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
            } catch {}
        }
    };

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!busId || !departureTime) return;

        const { data: { user } } = await supabase.auth.getUser();
        const adminId = user?.id || null;

        const selectedRoute = routes.find(r => r.id === routeId);
        const originName = selectedRoute?.origin?.name || "Cubao";
        const destName = selectedRoute?.destination?.name || "Daet";

        const selectedBus = buses.find(b => b.id === busId);
        const capacity = selectedBus?.seat_capacity || 45;

        // 1. Insert Outbound Trip with Admin ID & Route ID
        const { data: newOutbound } = await supabase.from('trips').insert({
            bus_id: busId,
            route_id: routeId || null,
            origin: originName,
            destination: destName,
            departure_time: new Date(departureTime).toISOString(),
            fare_amount: Number(fareAmount),
            price: Number(fareAmount),
            created_by: adminId,
            created_at: new Date().toISOString()
        }).select().single();

        if (newOutbound) {
            const seatsToInsert = Array.from({ length: capacity }, (_, i) => ({
                trip_id: newOutbound.id,
                seat_number: i + 1,
                is_available: true,
            }));
            await supabase.from('trip_seats').insert(seatsToInsert);
        }

        // 2. Automatically bind and insert Inbound Return Trip if enabled
        if (autoCreateReturn && returnDepartureTime) {
            // Find reverse route if available
            const reverseRoute = routes.find(r => r.origin?.name === destName && r.destination?.name === originName);

            const { data: newInbound } = await supabase.from('trips').insert({
                bus_id: busId, // Same Bus Unit
                route_id: reverseRoute?.id || null,
                origin: destName, // Return reverse direction
                destination: originName,
                departure_time: new Date(returnDepartureTime).toISOString(),
                fare_amount: Number(fareAmount),
                price: Number(fareAmount),
                created_by: adminId,
                created_at: new Date().toISOString()
            }).select().single();

            if (newInbound) {
                const seatsToInsert = Array.from({ length: capacity }, (_, i) => ({
                    trip_id: newInbound.id,
                    seat_number: i + 1,
                    is_available: true,
                }));
                await supabase.from('trip_seats').insert(seatsToInsert);
            }
        }

        setOpenModal(false);
        fetchTripsAndBookings();
    };

    // Helper: Find bookings bound to a specific trip
    const getBookingsForTrip = (trip: TripItem) => {
        return allBookings.filter((b) => {
            if (b.booking_status === "CANCELLED" || b.ticket_status === "CANCELLED") return false;
            if (b.trip?.id && b.trip.id === trip.id) return true;
            if (b.trip_id && b.trip_id === trip.id) return true;

            // Match by route and date similarity
            const bOrigin = b.trip?.origin?.toLowerCase();
            const bDest = b.trip?.destination?.toLowerCase();
            const tOrigin = trip.origin.toLowerCase();
            const tDest = trip.destination.toLowerCase();

            if (bOrigin === tOrigin && bDest === tDest) {
                const bTime = new Date(b.trip?.departure_time).getTime();
                const tTime = new Date(trip.departure_time).getTime();
                // Within 1 hour difference or matching day
                if (Math.abs(bTime - tTime) < 3600 * 1000) return true;
            }
            return false;
        });
    };

    // Helper: Find paired return turnaround trip on the same bus unit
    const getPairedReturnTrip = (trip: TripItem): TripItem | undefined => {
        return trips.find((t) => {
            if (t.id === trip.id) return false;
            const sameBus = (t.bus_id && trip.bus_id && t.bus_id === trip.bus_id) ||
                (t.bus?.bus_number && trip.bus?.bus_number && t.bus.bus_number === trip.bus.bus_number);
            const reverseRoute = t.origin.toLowerCase() === trip.destination.toLowerCase() &&
                t.destination.toLowerCase() === trip.origin.toLowerCase();
            return sameBus && reverseRoute;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        Trip & Schedule Management
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Schedule bus departures, initialize seat inventories, and inspect bound turnaround manifests.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTripsAndBookings}
                        className="text-xs font-semibold"
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    <Dialog open={openModal} onOpenChange={setOpenModal}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md text-xs">
                                <Plus className="mr-1.5 h-4 w-4" /> Schedule New Departure
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Schedule Bus Departure</DialogTitle>
                                <DialogDescription>
                                    Assign a route and bus unit. You can automatically bind the return leg (e.g. Daet ➔ Cubao).
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreateTrip} className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="tRoute">Select Primary Route</Label>
                                    <select
                                        id="tRoute"
                                        className="w-full rounded-md border p-2 bg-background text-sm font-semibold"
                                        value={routeId}
                                        onChange={(e) => setRouteId(e.target.value)}
                                    >
                                        {routes.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.origin?.name} ➔ {r.destination?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tBus">Assign Bus Unit Body #</Label>
                                    <select
                                        id="tBus"
                                        className="w-full rounded-md border p-2 bg-background font-mono font-bold text-sm"
                                        value={busId}
                                        onChange={(e) => {
                                            const bId = e.target.value;
                                            setBusId(bId);
                                            const chosenBus = buses.find(b => b.id === bId);
                                            if (chosenBus) {
                                                setFareAmount(String(getBusFare(chosenBus.bus_type || chosenBus.bus_number)));
                                            }
                                        }}
                                    >
                                        {buses.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.bus_number} — {b.bus_type ? b.bus_type.replace(/_/g, ' ') : 'REGULAR AIRCON'} ({b.seat_capacity || 45} seats)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tTime">Outbound Departure Date & Time</Label>
                                    <Input
                                        id="tTime"
                                        type="datetime-local"
                                        required
                                        value={departureTime}
                                        onChange={(e) => handleOutboundTimeChange(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tFare">Fare Amount (₱)</Label>
                                    <Input
                                        id="tFare"
                                        type="number"
                                        required
                                        value={fareAmount}
                                        onChange={(e) => setFareAmount(e.target.value)}
                                    />
                                </div>

                                {/* Bound Turnaround Return Leg Option */}
                                <div className="rounded-xl border p-4 bg-blue-50/60 dark:bg-blue-950/30 space-y-3">
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="checkbox"
                                            id="autoReturn"
                                            checked={autoCreateReturn}
                                            onChange={(e) => setAutoCreateReturn(e.target.checked)}
                                            className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="autoReturn" className="text-xs font-bold cursor-pointer text-blue-950 dark:text-blue-100">
                                            Automatically bind return turnaround trip with this same bus unit
                                        </Label>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground pl-6">
                                        When checked, the system will automatically create the return trip (e.g. Daet ➔ Cubao) bound to this exact bus unit so passengers booking from either terminal reflect together.
                                    </p>

                                    {autoCreateReturn && (
                                        <div className="space-y-1 pl-6 pt-1">
                                            <Label htmlFor="retTime" className="text-xs font-semibold">
                                                Return Leg Departure Date & Time
                                            </Label>
                                            <Input
                                                id="retTime"
                                                type="datetime-local"
                                                required={autoCreateReturn}
                                                value={returnDepartureTime}
                                                onChange={(e) => setReturnDepartureTime(e.target.value)}
                                                className="bg-white dark:bg-zinc-950 text-xs"
                                            />
                                        </div>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold">
                                        Create & Initialize Seats
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Scheduled Trips Card */}
            <Card className="shadow-sm border">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <span>Active Scheduled Departures</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold font-mono">
                                    {trips.length} Trips Total
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Live trip departures accessible across Cubao, Daet, PITX counter booths, and online passengers.
                            </CardDescription>
                        </div>
                        {/* Terminal Origin Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto bg-muted/50 p-1 rounded-xl border">
                            {(["ALL", "Cubao", "Daet", "PITX"] as const).map((term) => (
                                <button
                                    key={term}
                                    type="button"
                                    onClick={() => setSelectedTerminalTab(term)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                        selectedTerminalTab === term
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                                >
                                    {term === "ALL" ? "All Terminals" : `${term} Terminal`}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-16 text-center text-muted-foreground space-y-2">
                            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                            <p className="text-xs">Loading trips and central seat inventory...</p>
                        </div>
                    ) : trips.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground text-xs">
                            No scheduled trips found. Click &quot;Schedule New Departure&quot; above to create one.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b bg-muted/40 uppercase tracking-wider font-semibold text-muted-foreground">
                                    <tr>
                                        <th className="py-3 px-4">Route</th>
                                        <th className="py-3 px-4">Departure Time</th>
                                        <th className="py-3 px-4">Bus Chassis</th>
                                        <th className="py-3 px-4">Booked Seats</th>
                                        <th className="py-3 px-4">Fare</th>
                                        <th className="py-3 px-4">Schedule Pairing</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {trips
                                        .filter((t) => {
                                            if (selectedTerminalTab === "ALL") return true;
                                            const orig = (t.origin || t.route?.origin?.name || "").toLowerCase();
                                            return orig.includes(selectedTerminalTab.toLowerCase());
                                        })
                                        .map((t) => {
                                        const depTime = new Date(t.departure_time);
                                        const tripBookings = getBookingsForTrip(t);
                                        const bookedCount = tripBookings.length;
                                        const capacity = t.bus?.seat_capacity || 45;
                                        const pairedReturn = getPairedReturnTrip(t);

                                        return (
                                            <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                                {/* Route */}
                                                <td className="py-3.5 px-4 font-bold text-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{t.origin}</span>
                                                        <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                                                        <span>{t.destination}</span>
                                                    </div>
                                                </td>

                                                {/* Departure Time */}
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-foreground">
                                                        {depTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                                    </div>
                                                    <div className="text-[11px] font-mono font-extrabold text-blue-600">
                                                        {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>

                                                {/* Bus Chassis */}
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono font-black text-blue-700 dark:text-blue-300 block">
                                                        {t.bus?.bus_number}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                                        {t.bus?.bus_type ? t.bus.bus_type.replace(/_/g, ' ') : 'REGULAR AIRCON'}
                                                    </span>
                                                </td>

                                                {/* Booked Seats & Load */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-foreground">
                                                            {bookedCount} / {capacity}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                            bookedCount > 0
                                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                                        }`}>
                                                            {Math.round((bookedCount / capacity) * 100)}% Load
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Fare */}
                                                <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-600">
                                                    ₱{t.fare_amount}.00
                                                </td>

                                                {/* Schedule Pairing Indicator */}
                                                <td className="py-3.5 px-4">
                                                    {pairedReturn ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                                                            <LinkIcon className="h-3 w-3" />
                                                            Bound to {pairedReturn.origin} ➔ {pairedReturn.destination} ({new Date(pairedReturn.departure_time).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground italic">
                                                            One-Way Leg
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action */}
                                                <td className="py-3.5 px-4 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs font-bold border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                        onClick={() => setSelectedTripForManifest(t)}
                                                    >
                                                        <Users className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                                                        View Bound Manifest
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ========================================================================= */}
            {/* MODAL: BOUND BUS MANIFEST & ROUND-TRIP SCHEDULE TURNAROUND                */}
            {/* ========================================================================= */}
            {selectedTripForManifest && (() => {
                const outboundBookings = getBookingsForTrip(selectedTripForManifest);
                const pairedTrip = getPairedReturnTrip(selectedTripForManifest);
                const inboundBookings = pairedTrip ? getBookingsForTrip(pairedTrip) : [];
                const busNum = selectedTripForManifest.bus?.bus_number || "Superlines Express";
                const totalPass = outboundBookings.length + inboundBookings.length;
                const totalRev = outboundBookings.reduce((sum, b) => sum + (b.total_price || 850), 0) +
                    inboundBookings.reduce((sum, b) => sum + (b.total_price || 850), 0);

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 border shadow-2xl p-6 space-y-6 my-8">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Bus className="h-6 w-6 text-blue-600" />
                                        <h3 className="text-xl font-extrabold text-foreground">
                                            Bound Bus Schedule Manifest: {busNum}
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300">
                                            Fleet Synchronization Active
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Shows all passenger bookings reflecting on this bus unit across both Cubao and Daet terminals.
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTripForManifest(null)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Summary Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Bus Unit</p>
                                    <p className="text-base font-black font-mono text-foreground mt-0.5">{busNum}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Bound Passengers</p>
                                    <p className="text-base font-black font-mono text-blue-600 mt-0.5">{totalPass} Passengers</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Rotation Revenue</p>
                                    <p className="text-base font-black font-mono text-emerald-600 mt-0.5">₱{totalRev.toLocaleString()}.00</p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 border">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Dispatch Status</p>
                                    <p className="text-base font-black text-foreground mt-0.5">Ready for Boarding</p>
                                </div>
                            </div>

                            {/* Two Legs: Outbound & Turnaround Inbound */}
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Leg 1: Outbound */}
                                <Card className="border-2 border-blue-500/30">
                                    <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-950/30 border-b">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                                                <ArrowRight className="h-4 w-4 text-blue-600" />
                                                Leg 1: {selectedTripForManifest.origin} ➔ {selectedTripForManifest.destination}
                                            </span>
                                            <span className="font-mono text-xs font-bold text-blue-600">
                                                {new Date(selectedTripForManifest.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <CardDescription className="text-[11px]">
                                            Departure: {new Date(selectedTripForManifest.departure_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {outboundBookings.length} Booked
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 max-h-64 overflow-y-auto">
                                        {outboundBookings.length === 0 ? (
                                            <div className="py-8 text-center text-xs text-muted-foreground">
                                                No bookings recorded for this leg yet.
                                            </div>
                                        ) : (
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-muted/30 border-b text-[10px] font-bold uppercase text-muted-foreground">
                                                    <tr>
                                                        <th className="p-2.5">Seat</th>
                                                        <th className="p-2.5">Passenger</th>
                                                        <th className="p-2.5">Source</th>
                                                        <th className="p-2.5 text-right">Fare</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {outboundBookings.map((b) => (
                                                        <tr key={b.id} className="hover:bg-muted/30">
                                                            <td className="p-2.5 font-mono font-black text-blue-600">
                                                                #{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}
                                                            </td>
                                                            <td className="p-2.5">
                                                                <p className="font-bold text-foreground">{b.passenger_name}</p>
                                                                <p className="text-[10px] text-muted-foreground font-mono">{b.passenger_contact || "N/A"}</p>
                                                            </td>
                                                            <td className="p-2.5">
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800">
                                                                    {b.booking_source || "ONLINE"}
                                                                </span>
                                                            </td>
                                                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                                                ₱{b.total_price}.00
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Leg 2: Turnaround Return Leg */}
                                <Card className="border-2 border-indigo-500/30">
                                    <CardHeader className="pb-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                                                <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
                                                Leg 2: {pairedTrip ? `${pairedTrip.origin} ➔ ${pairedTrip.destination}` : "Turnaround Return Leg"}
                                            </span>
                                            {pairedTrip && (
                                                <span className="font-mono text-xs font-bold text-indigo-600">
                                                    {new Date(pairedTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <CardDescription className="text-[11px]">
                                            {pairedTrip
                                                ? `Departure: ${new Date(pairedTrip.departure_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • ${inboundBookings.length} Booked`
                                                : "No return leg scheduled yet for this bus unit."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0 max-h-64 overflow-y-auto">
                                        {!pairedTrip ? (
                                            <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                                                <AlertCircle className="mx-auto h-6 w-6 text-amber-500" />
                                                <p>No reverse leg currently bound to this bus.</p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        setSelectedTripForManifest(null);
                                                        setOpenModal(true);
                                                    }}
                                                >
                                                    Schedule Return Leg
                                                </Button>
                                            </div>
                                        ) : inboundBookings.length === 0 ? (
                                            <div className="py-8 text-center text-xs text-muted-foreground">
                                                No bookings recorded for return leg yet.
                                            </div>
                                        ) : (
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-muted/30 border-b text-[10px] font-bold uppercase text-muted-foreground">
                                                    <tr>
                                                        <th className="p-2.5">Seat</th>
                                                        <th className="p-2.5">Passenger</th>
                                                        <th className="p-2.5">Source</th>
                                                        <th className="p-2.5 text-right">Fare</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {inboundBookings.map((b) => (
                                                        <tr key={b.id} className="hover:bg-muted/30">
                                                            <td className="p-2.5 font-mono font-black text-indigo-600">
                                                                #{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}
                                                            </td>
                                                            <td className="p-2.5">
                                                                <p className="font-bold text-foreground">{b.passenger_name}</p>
                                                                <p className="text-[10px] text-muted-foreground font-mono">{b.passenger_contact || "N/A"}</p>
                                                            </td>
                                                            <td className="p-2.5">
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800">
                                                                    {b.booking_source || "ONLINE"}
                                                                </span>
                                                            </td>
                                                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                                                ₱{b.total_price}.00
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center pt-2 border-t text-xs">
                                <span className="text-muted-foreground">
                                    Official Superlines Central Bus Dispatch • Synchronized with Terminal Counters
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedTripForManifest(null)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 font-bold"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                                        Print Bound Manifest
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
