"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
    Route as RouteIcon, 
    Plus, 
    ArrowRight, 
    CalendarPlus, 
    Trash2, 
    MapPin, 
    Clock, 
    Bus, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    Sparkles, 
    ShieldCheck, 
    ExternalLink 
} from "lucide-react";

interface TerminalItem {
    id: string;
    name: string;
    location: string;
    code: string;
}

interface RouteItem {
    id: string;
    origin_terminal_id: string;
    destination_terminal_id: string;
    origin: { name: string; location?: string };
    destination: { name: string; location?: string };
    distance_km: number;
    estimated_hours: number;
    status: string;
    created_at?: string;
}

const GUARANTEED_TERMINALS: TerminalItem[] = [
    { id: "term-cubao", name: "Cubao", location: "Superlines Cubao Terminal, EDSA, Quezon City", code: "CUB" },
    { id: "term-daet", name: "Daet", location: "Daet Central Terminal, Camarines Norte", code: "DAE" },
    { id: "term-pitx", name: "PITX", location: "Parañaque Integrated Terminal Exchange, Metro Manila", code: "PTX" },
];

export default function AdminRoutesPage() {
    const [routes, setRoutes] = useState<RouteItem[]>([]);
    const [terminals, setTerminals] = useState<TerminalItem[]>(GUARANTEED_TERMINALS);
    const [loading, setLoading] = useState(true);

    // Modal 1: Create Route
    const [openAddRouteModal, setOpenAddRouteModal] = useState(false);
    const [originName, setOriginName] = useState("Cubao");
    const [destinationName, setDestinationName] = useState("Daet");
    const [distance, setDistance] = useState("340");
    const [estimatedHours, setEstimatedHours] = useState("8.0");
    const [routeSubmitting, setRouteSubmitting] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [routeSuccess, setRouteSuccess] = useState<string | null>(null);

    // Modal 2: Interconnected Trip Scheduling based on Route
    const [selectedRouteForTrip, setSelectedRouteForTrip] = useState<RouteItem | null>(null);
    const [openScheduleTripModal, setOpenScheduleTripModal] = useState(false);
    const [tripDepartureDate, setTripDepartureDate] = useState("");
    const [tripDepartureTime, setTripDepartureTime] = useState("06:00");
    const [tripBusType, setTripBusType] = useState("REGULAR AIRCON");
    const [tripBusNumber, setTripBusNumber] = useState("SL-101 (Regular Aircon)");
    const [tripFare, setTripFare] = useState("850");
    const [tripSeatCapacity, setTripSeatCapacity] = useState("49");
    const [tripSubmitting, setTripSubmitting] = useState(false);
    const [tripError, setTripError] = useState<string | null>(null);
    const [tripSuccess, setTripSuccess] = useState<string | null>(null);

    // Initialize default departure date to today
    useEffect(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        setTripDepartureDate(todayStr);
    }, []);

    // 1. Fetch Routes & Terminals
    const fetchRoutesAndTerminals = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/routes");
            const data = await res.json();
            if (data?.success) {
                if (Array.isArray(data.routes)) setRoutes(data.routes);
                if (Array.isArray(data.terminals) && data.terminals.length > 0) {
                    setTerminals(data.terminals);
                }
            }
        } catch (err) {
            console.error("Error fetching routes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutesAndTerminals();
    }, []);

    // 2. Destination filtering: When Origin is selected, Destination cannot be the same!
    const handleOriginChange = (newOrigin: string) => {
        setOriginName(newOrigin);

        // If current destination matches new origin, switch to first non-matching terminal
        if (destinationName.toLowerCase() === newOrigin.toLowerCase()) {
            const validOptions = terminals.filter(t => t.name.toLowerCase() !== newOrigin.toLowerCase());
            const fallback = validOptions[0]?.name || "Daet";
            setDestinationName(fallback);
            updateEstimatedDistance(newOrigin, fallback);
        } else {
            updateEstimatedDistance(newOrigin, destinationName);
        }
    };

    const handleDestinationChange = (newDestination: string) => {
        setDestinationName(newDestination);
        updateEstimatedDistance(originName, newDestination);
    };

    const updateEstimatedDistance = (orig: string, dest: string) => {
        const o = orig.toLowerCase();
        const d = dest.toLowerCase();

        if ((o.includes("cubao") && d.includes("daet")) || (o.includes("daet") && d.includes("cubao"))) {
            setDistance("340");
            setEstimatedHours("8.0");
        } else if ((o.includes("pitx") && d.includes("daet")) || (o.includes("daet") && d.includes("pitx"))) {
            setDistance("355");
            setEstimatedHours("8.5");
        } else if ((o.includes("cubao") && d.includes("pitx")) || (o.includes("pitx") && d.includes("cubao"))) {
            setDistance("25");
            setEstimatedHours("1.5");
        } else {
            setDistance("340");
            setEstimatedHours("8.0");
        }
    };

    // 3. Create Route Submission
    const handleCreateRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        setRouteError(null);
        setRouteSuccess(null);

        if (originName.toLowerCase() === destinationName.toLowerCase()) {
            setRouteError("Origin and Destination cannot be the same terminal.");
            return;
        }

        setRouteSubmitting(true);
        try {
            const res = await fetch("/api/admin/routes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originName,
                    destinationName,
                    distance_km: Number(distance) || 340,
                    estimated_hours: Number(estimatedHours) || 8.0,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to create route.");
            }

            setRouteSuccess(`Route ${originName} ➔ ${destinationName} successfully added!`);
            await fetchRoutesAndTerminals();
            setTimeout(() => {
                setOpenAddRouteModal(false);
                setRouteSuccess(null);
            }, 1200);
        } catch (err: any) {
            setRouteError(err.message || "Failed to create route.");
        } finally {
            setRouteSubmitting(false);
        }
    };

    // 4. Delete Route
    const handleDeleteRoute = async (routeId: string, routeName: string) => {
        if (!confirm(`Are you sure you want to delete route "${routeName}"?`)) return;

        try {
            const res = await fetch(`/api/admin/routes?id=${encodeURIComponent(routeId)}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                fetchRoutesAndTerminals();
            } else {
                alert(data.error || "Failed to delete route.");
            }
        } catch (err) {
            console.error("Delete route error:", err);
        }
    };

    // 5. Open Interconnected Trip Scheduling Modal for a Route
    const handleOpenScheduleForRoute = (r: RouteItem) => {
        setSelectedRouteForTrip(r);
        setTripError(null);
        setTripSuccess(null);
        setTripDepartureTime("06:00");
        setTripBusType("REGULAR AIRCON");
        setTripBusNumber("SL-101 (Regular Aircon)");
        setTripFare("850");
        setTripSeatCapacity("49");
        setOpenScheduleTripModal(true);
    };

    // Update Bus & Fare Selection in Trip Scheduling
    const handleBusTypeChange = (bType: string) => {
        setTripBusType(bType);
        if (bType === "REGULAR AIRCON") {
            setTripBusNumber("SL-101 (Regular Aircon)");
            setTripFare("850");
            setTripSeatCapacity("49");
        } else if (bType === "SUPER DELUXE") {
            setTripBusNumber("SL-311 (Super Deluxe)");
            setTripFare("950");
            setTripSeatCapacity("43");
        } else if (bType === "FIRST CLASS") {
            setTripBusNumber("SL-501 (First Class Premier)");
            setTripFare("1100");
            setTripSeatCapacity("41");
        }
    };

    // 6. Submit Interconnected Trip based on Route
    const handleScheduleTripSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRouteForTrip) return;

        if (!tripDepartureDate || !tripDepartureTime) {
            setTripError("Please specify a departure date and time.");
            return;
        }

        const fullIsoDeparture = `${tripDepartureDate}T${tripDepartureTime}:00+08:00`;
        setTripSubmitting(true);
        setTripError(null);
        setTripSuccess(null);

        try {
            const res = await fetch("/api/admin/trips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    route_id: selectedRouteForTrip.id,
                    origin: selectedRouteForTrip.origin.name,
                    destination: selectedRouteForTrip.destination.name,
                    departure_time: fullIsoDeparture,
                    fare_amount: Number(tripFare),
                    bus_number: tripBusNumber,
                    bus_type: tripBusType,
                    seat_capacity: Number(tripSeatCapacity),
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to schedule trip.");
            }

            setTripSuccess(
                `Trip for ${selectedRouteForTrip.origin.name} ➔ ${selectedRouteForTrip.destination.name} (${tripDepartureDate} ${tripDepartureTime}) added to Dispatch & Online Booking!`
            );

            setTimeout(() => {
                setOpenScheduleTripModal(false);
                setTripSuccess(null);
            }, 1800);
        } catch (err: any) {
            setTripError(err.message || "Failed to schedule trip.");
        } finally {
            setTripSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                        <RouteIcon className="h-8 w-8 text-blue-600" />
                        <span>Route Management</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Configure travel routes between terminals (Cubao, Daet, PITX) and schedule linked bus departures.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchRoutesAndTerminals}
                        disabled={loading}
                        className="text-xs font-semibold"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    {/* Add Route Dialog */}
                    <Dialog open={openAddRouteModal} onOpenChange={setOpenAddRouteModal}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 shadow-sm">
                                <Plus className="mr-1.5 h-4 w-4" /> Add New Route
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
                                    <RouteIcon className="h-5 w-5 text-blue-600" />
                                    <span>Create Superlines Travel Route</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    Define origin and destination terminals. The destination dropdown automatically excludes the selected origin terminal.
                                </DialogDescription>
                            </DialogHeader>

                            {routeError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{routeError}</span>
                                </div>
                            )}

                            {routeSuccess && (
                                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>{routeSuccess}</span>
                                </div>
                            )}

                            <form onSubmit={handleCreateRoute} className="space-y-4 pt-2">
                                {/* Origin Terminal Dropdown */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                        <span>Origin Terminal (Saan Mangagaling) *</span>
                                    </Label>
                                    <select
                                        value={originName}
                                        onChange={(e) => handleOriginChange(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border-2 border-input bg-background text-sm font-bold focus:border-blue-600 focus:outline-none transition"
                                    >
                                        {terminals.map((t) => (
                                            <option key={t.id} value={t.name}>
                                                {t.name} Terminal ({t.location})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Destination Terminal Dropdown (Excludes selected origin!) */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Destination Terminal (Pupuntahan) *</span>
                                    </Label>
                                    <select
                                        value={destinationName}
                                        onChange={(e) => handleDestinationChange(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border-2 border-input bg-background text-sm font-bold focus:border-emerald-600 focus:outline-none transition"
                                    >
                                        {terminals
                                            .filter((t) => t.name.toLowerCase() !== originName.toLowerCase())
                                            .map((t) => (
                                                <option key={t.id} value={t.name}>
                                                    {t.name} Terminal ({t.location})
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-[11px] text-muted-foreground italic">
                                        * Ang {originName} ay hindi maaaring piliin bilang destination dahil parehong terminal.
                                    </p>
                                </div>

                                {/* Distance & Estimated Duration */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="rDist" className="text-xs font-semibold">
                                            Distance (km)
                                        </Label>
                                        <Input
                                            id="rDist"
                                            type="number"
                                            required
                                            value={distance}
                                            onChange={(e) => setDistance(e.target.value)}
                                            className="font-mono h-10 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="rHours" className="text-xs font-semibold">
                                            Est. Travel Time (hrs)
                                        </Label>
                                        <Input
                                            id="rHours"
                                            type="number"
                                            step="0.5"
                                            required
                                            value={estimatedHours}
                                            onChange={(e) => setEstimatedHours(e.target.value)}
                                            className="font-mono h-10 text-xs"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={routeSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10"
                                    >
                                        {routeSubmitting ? "Saving Route..." : `Create Route (${originName} ➔ ${destinationName})`}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Interconnected Scheduling Advisory Banner */}
            <div className="rounded-2xl border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0">
                        ⚡
                    </div>
                    <div>
                        <p className="font-bold text-blue-950 dark:text-blue-100">
                            Interconnected Route &amp; Trip Scheduling System
                        </p>
                        <p className="text-blue-800/80 dark:text-blue-300/80">
                            Lahat ng ruta dito ay konektado sa Trip Scheduling. Maaari kang mag-click ng <strong>&ldquo;+ Schedule Trip&rdquo;</strong> sa alinmang ruta sa ibaba upang mag-add agad ng biyahe na automatic lalabas sa online booking at conductor manifest.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300">
                    <Link href="/admin/trips" className="flex items-center gap-1.5">
                        <span>View Trips &amp; Dispatch</span>
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </Button>
            </div>

            {/* Active Routes Table Card */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">Active Superlines Travel Routes</CardTitle>
                            <CardDescription className="text-xs">
                                Verified transit corridors connecting Cubao, Daet, and PITX terminals.
                            </CardDescription>
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {routes.length} Active Route{routes.length > 1 ? "s" : ""}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                            <span>Loading Superlines routes and terminals...</span>
                        </div>
                    ) : routes.length === 0 ? (
                        <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                            <p>No routes configured yet.</p>
                            <Button size="sm" onClick={() => setOpenAddRouteModal(true)} className="text-xs">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Route
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <tr className="text-left">
                                        <th className="p-4">Transit Path</th>
                                        <th className="p-4">Distance</th>
                                        <th className="p-4">Est. Duration</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Interconnected Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {routes.map((r) => (
                                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-bold text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{r.origin?.name}</span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{r.destination?.name}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-normal">
                                                    Route ID: {r.id}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-xs">{r.distance_km} km</td>
                                            <td className="p-4 font-mono text-xs">{r.estimated_hours || 8} hrs</td>
                                            <td className="p-4">
                                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                                    {r.status || "ACTIVE"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* + Schedule Trip for this Route Button */}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenScheduleForRoute(r)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <CalendarPlus className="h-3.5 w-3.5" />
                                                        <span>+ Schedule Trip</span>
                                                    </Button>

                                                    {/* Delete Route */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteRoute(r.id, `${r.origin?.name} ➔ ${r.destination?.name}`)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs h-8 px-2"
                                                        title="Delete Route"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal 2: Interconnected Trip Scheduling Modal */}
            <Dialog open={openScheduleTripModal} onOpenChange={setOpenScheduleTripModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
                            <Bus className="h-5 w-5 text-emerald-600" />
                            <span>Schedule Bus Trip for {selectedRouteForTrip?.origin?.name} ➔ {selectedRouteForTrip?.destination?.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Directly add departure schedules for this route. This will immediately reflect in the Passenger Booking portal and Conductor Manifest.
                        </DialogDescription>
                    </DialogHeader>

                    {tripError && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{tripError}</span>
                        </div>
                    )}

                    {tripSuccess && (
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{tripSuccess}</span>
                        </div>
                    )}

                    {selectedRouteForTrip && (
                        <form onSubmit={handleScheduleTripSubmit} className="space-y-4 pt-1 text-xs">
                            {/* Route Path Highlight Bar */}
                            <div className="rounded-xl bg-muted/60 p-3 flex items-center justify-between border">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Selected Route:</span>
                                    <div className="flex items-center gap-2 font-black text-sm">
                                        <span className="text-blue-600">{selectedRouteForTrip.origin.name}</span>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-emerald-600">{selectedRouteForTrip.destination.name}</span>
                                    </div>
                                </div>
                                <div className="text-right font-mono">
                                    <span className="text-xs font-bold">{selectedRouteForTrip.distance_km} km</span>
                                    <p className="text-[10px] text-muted-foreground">~{selectedRouteForTrip.estimated_hours} hrs travel</p>
                                </div>
                            </div>

                            {/* Departure Date & Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">Departure Date *</Label>
                                    <Input
                                        type="date"
                                        required
                                        value={tripDepartureDate}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setTripDepartureDate(e.target.value)}
                                        className="h-10 text-xs font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">Departure Time (24h) *</Label>
                                    <Input
                                        type="time"
                                        required
                                        value={tripDepartureTime}
                                        onChange={(e) => setTripDepartureTime(e.target.value)}
                                        className="h-10 text-xs font-bold font-mono"
                                    />
                                </div>
                            </div>

                            {/* Service Class & Bus Unit */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">Service Class &amp; Assigned Bus *</Label>
                                <select
                                    value={tripBusType}
                                    onChange={(e) => handleBusTypeChange(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border-2 border-input bg-background font-bold text-xs"
                                >
                                    <option value="REGULAR AIRCON">Regular Aircon (49 Seats) - ₱850.00</option>
                                    <option value="SUPER DELUXE">Super Deluxe w/ Restroom (43 Seats) - ₱950.00</option>
                                    <option value="FIRST CLASS">First Class Premier Sleeper (41 Seats) - ₱1,100.00</option>
                                </select>
                            </div>

                            {/* Bus Number & Seat Capacity */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">Assigned Bus Unit</Label>
                                    <Input
                                        value={tripBusNumber}
                                        onChange={(e) => setTripBusNumber(e.target.value)}
                                        className="h-10 text-xs"
                                        placeholder="e.g. SL-101"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold">Fare Amount (₱)</Label>
                                    <Input
                                        type="number"
                                        required
                                        value={tripFare}
                                        onChange={(e) => setTripFare(e.target.value)}
                                        className="h-10 text-xs font-mono font-bold"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={tripSubmitting}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-11 rounded-xl shadow-md flex items-center justify-center gap-2"
                                >
                                    {tripSubmitting ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Adding Trip to Dispatch...
                                        </>
                                    ) : (
                                        <>
                                            <CalendarPlus className="h-4 w-4" />
                                            Confirm &amp; Add Trip to Dispatch &rarr;
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
