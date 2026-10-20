"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    QrCode,
    Bus,
    ArrowRight,
    Calendar,
    Clock,
    FileText,
    Search,
    RefreshCw,
    Edit,
    CheckCircle2,
    Info,
    X,
    Check,
    AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConductorDashboardPage() {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<"ALL" | "TODAY" | "BOARDING" | "UNASSIGNED">("ALL");

    // Reassignment Modal State
    const [modalTrip, setModalTrip] = useState<any | null>(null);
    const [fleetBuses, setFleetBuses] = useState<any[]>([]);
    const [busInputMode, setBusInputMode] = useState<"SELECT" | "CUSTOM">("SELECT");
    const [newBusNumber, setNewBusNumber] = useState("");
    const [newBusType, setNewBusType] = useState("REGULAR AIRCON");
    const [newTripStatus, setNewTripStatus] = useState("SCHEDULED");
    const [submittingBus, setSubmittingBus] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchTrips();
        fetchFleet();
    }, []);

    const fetchTrips = async () => {
        setLoading(true);
        let rawData: any[] = [];

        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*, bus:buses(bus_number, bus_type)')
                .order('departure_time', { ascending: true });

            if (!error && data) {
                rawData = data;
            } else {
                const { data: fallbackData } = await supabase
                    .from('trips')
                    .select('*')
                    .order('departure_time', { ascending: true });
                if (fallbackData) rawData = fallbackData;
            }
        } catch (err) {
            console.error("Error loading trips:", err);
        }

        const normalizedTrips = rawData.map((t: any) => ({
            ...t,
            fare_amount: t.fare_amount ?? t.price ?? 850,
            status: t.status || 'SCHEDULED',
            route: {
                origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
                destination: { name: t.destination || t.route?.destination?.name || "Daet" }
            },
            bus: t.bus || { bus_number: "Superlines Express", bus_type: "REGULAR AIRCON" }
        }));

        let finalTrips = normalizedTrips;
        if (finalTrips.length === 0) {
            try {
                const res = await fetch("/api/trips/available");
                const availData = await res.json();
                if (availData?.trips && Array.isArray(availData.trips)) {
                    finalTrips = availData.trips.map((t: any) => ({
                        ...t,
                        fare_amount: t.fare_amount ?? 850,
                        status: "SCHEDULED",
                        route: {
                            origin: { name: t.origin || "Cubao" },
                            destination: { name: t.destination || "Daet" }
                        },
                        bus: {
                            bus_number: t.bus_number || "SL-401 (Superlines Aircon)",
                            bus_type: t.bus_type || "REGULAR AIRCON"
                        }
                    }));
                }
            } catch {}
        }

        setTrips(finalTrips);
        setLoading(false);
    };

    const fetchFleet = async () => {
        try {
            const res = await fetch('/api/conductor/tickets?action=buses');
            const data = await res.json();
            if (data.buses && Array.isArray(data.buses)) {
                setFleetBuses(data.buses);
            }
        } catch (err) {
            console.error("Failed to fetch fleet buses:", err);
        }
    };

    const handleOpenAssignModal = (trip: any) => {
        setModalTrip(trip);
        setNewBusNumber(trip.bus?.bus_number || "");
        setNewBusType(trip.bus?.bus_type || "REGULAR AIRCON");
        setNewTripStatus(trip.status || "SCHEDULED");
        setSuccessMsg(null);
    };

    const handleSaveBusAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalTrip || !newBusNumber.trim()) return;

        setSubmittingBus(true);
        setSuccessMsg(null);

        try {
            const res = await fetch('/api/conductor/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_BUS_UNIT',
                    trip_id: modalTrip.id,
                    bus_number: newBusNumber.trim().toUpperCase(),
                    bus_type: newBusType,
                    trip_status: newTripStatus,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                const updatedBusNum = data.bus_number || newBusNumber.trim().toUpperCase();
                const updatedType = data.bus_type || newBusType;
                const updatedStatus = data.trip_status || newTripStatus;

                setTrips(prev => prev.map(t =>
                    t.id === modalTrip.id
                        ? {
                              ...t,
                              status: updatedStatus,
                              bus: {
                                  ...t.bus,
                                  bus_number: updatedBusNum,
                                  bus_type: updatedType,
                              }
                          }
                        : t
                ));

                setSuccessMsg(`Bus unit "${updatedBusNum}" assigned successfully!`);
                setTimeout(() => {
                    setModalTrip(null);
                    setSuccessMsg(null);
                }, 1500);
            } else {
                alert(data.error || "Failed to update bus unit.");
            }
        } catch (err: any) {
            alert("Error updating bus unit: " + err.message);
        } finally {
            setSubmittingBus(false);
        }
    };

    const filteredTrips = trips.filter((t) => {
        const origin = t.route?.origin?.name || "";
        const dest = t.route?.destination?.name || "";
        const busNum = t.bus?.bus_number || "";
        const status = t.status || "";
        const q = searchTerm.toLowerCase().trim();

        const matchesQuery = !q ||
            origin.toLowerCase().includes(q) ||
            dest.toLowerCase().includes(q) ||
            busNum.toLowerCase().includes(q) ||
            status.toLowerCase().includes(q);

        const depDate = new Date(t.departure_time);
        const isToday = depDate.toDateString() === new Date().toDateString();
        const isBoarding = t.status === "BOARDING";
        const isUnassigned = !t.bus?.bus_number || t.bus.bus_number.includes("TBD") || t.bus.bus_number.includes("Express");

        if (!matchesQuery) return false;
        if (filterCategory === "TODAY") return isToday;
        if (filterCategory === "BOARDING") return isBoarding;
        if (filterCategory === "UNASSIGNED") return isUnassigned;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <Bus className="h-7 w-7 text-red-500" />
                        Conductor Terminal Portal
                    </h1>
                    <p className="text-xs text-zinc-400">
                        Operational trip roster, manifest access, QR passenger boarding, and bay fleet assignment.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setRefreshing(true);
                            fetchTrips().finally(() => setRefreshing(false));
                        }}
                        disabled={refreshing}
                        className="border-zinc-700 text-zinc-300 hover:text-white"
                    >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button size="sm" asChild className="bg-red-600 hover:bg-red-700 font-bold shadow-md shadow-red-600/30">
                        <Link href="/conductor/scan">
                            <QrCode className="mr-1.5 h-4 w-4" />
                            Open QR Scanner
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Operational Guidance Card for Dynamic Bus Assignment */}
            <div className="rounded-2xl border-2 border-red-900/30 bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 p-4 sm:p-5 shadow-xl text-zinc-300 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Info className="h-4 w-4 text-red-500 shrink-0" />
                    <span>How Conductors Locate Their Trip Manifest & Assigned Vehicle</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                    In Superlines operations, passenger seat reservations, GCash tickets, and QR tokens are permanently bound to the <strong className="text-zinc-200">Trip Schedule (Route & Departure Time)</strong>. Because physical bus chassis change depending on maintenance and terminal bay availability, conductors should select their trip by <strong className="text-red-400">Departure Time & Route</strong>. You can view the live manifest immediately, or click <strong className="text-zinc-200">&ldquo;Assign / Swap Bus Unit&rdquo;</strong> on any schedule to designate which physical vehicle is running that trip.
                </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search by Origin, Destination, Bus #, or Status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
                        />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto">
                        {(["ALL", "TODAY", "BOARDING", "UNASSIGNED"] as const).map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                                    filterCategory === cat
                                        ? "bg-red-600 text-white border-red-600 shadow"
                                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                                }`}
                            >
                                {cat === "ALL" && `All Schedules (${trips.length})`}
                                {cat === "TODAY" && `Today's Runs`}
                                {cat === "BOARDING" && `Boarding Now`}
                                {cat === "UNASSIGNED" && `Fleet TBD`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scheduled Trip Cards Grid */}
                {loading ? (
                    <div className="py-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-red-500" />
                        <span className="text-xs">Loading operational trip schedules...</span>
                    </div>
                ) : filteredTrips.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredTrips.map((t) => {
                            const origin = t.route?.origin?.name || "Cubao";
                            const dest = t.route?.destination?.name || "Daet";
                            const busNum = t.bus?.bus_number || "TBD (Assign at Bay)";
                            const busType = t.bus?.bus_type || "REGULAR AIRCON";
                            const depTime = new Date(t.departure_time);
                            const isBoarding = t.status === "BOARDING";

                            return (
                                <Card key={t.id} className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-lg hover:border-zinc-700 transition-all">
                                    <CardHeader className="pb-3 border-b border-zinc-800/70">
                                        <div className="flex items-center justify-between text-xs font-mono">
                                            <div className="flex items-center gap-1.5 font-bold text-red-400">
                                                <Bus className="h-4 w-4 text-red-500" />
                                                <span>{busNum}</span>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono border ${
                                                isBoarding
                                                    ? 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse'
                                                    : t.status === 'DEPARTED'
                                                    ? 'bg-blue-950/80 text-blue-300 border-blue-600'
                                                    : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <CardTitle className="text-lg flex items-center justify-between mt-2 text-white">
                                            <span>{origin}</span>
                                            <ArrowRight className="h-4 w-4 text-red-500" />
                                            <span>{dest}</span>
                                        </CardTitle>
                                        <CardDescription className="text-[11px] font-mono text-zinc-400">
                                            {busType} • Fare: ₱{t.fare_amount || 850}.00
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between text-xs text-zinc-300 font-mono bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                                                {depTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1 font-bold text-emerald-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenAssignModal(t)}
                                                className="border-zinc-700 text-zinc-300 hover:text-white text-xs h-8"
                                            >
                                                <Edit className="h-3.5 w-3.5 mr-1 text-red-400" />
                                                Assign / Swap Bus
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className="flex-1 border-zinc-700 text-zinc-200 hover:text-white text-xs h-8"
                                            >
                                                <Link href={`/conductor/manifest?trip_id=${t.id}`}>
                                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                                    Manifest & 45 Seats
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                asChild
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 shadow-sm"
                                            >
                                                <Link href={`/conductor/scan?trip_id=${t.id}`}>
                                                    <QrCode className="h-3.5 w-3.5 mr-1" />
                                                    QR Boarding
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-16 text-center text-zinc-500 bg-zinc-950/40 rounded-2xl border border-zinc-800">
                        No trip schedules matching your search or filter.
                    </div>
                )}
            </div>

            {/* Quick Bus Reassignment Modal from Dashboard */}
            {modalTrip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-6 text-zinc-100 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Bus className="h-5 w-5 text-red-500" />
                                <h3 className="text-lg font-bold text-white">Assign Physical Bus Unit</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalTrip(null)}
                                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="text-xs text-zinc-400 bg-zinc-900/70 p-3 rounded-xl border border-zinc-800 space-y-1">
                            <p className="font-bold text-zinc-200">
                                {modalTrip.route?.origin?.name} ➔ {modalTrip.route?.destination?.name}
                            </p>
                            <p className="font-mono text-[11px]">
                                Departure: {new Date(modalTrip.departure_time).toLocaleDateString()} at {new Date(modalTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {successMsg && (
                            <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/50 p-3 text-emerald-200 text-xs flex items-center gap-2 font-semibold">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveBusAssignment} className="space-y-4">
                            <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setBusInputMode("SELECT")}
                                    className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                                        busInputMode === "SELECT"
                                            ? "bg-red-600 text-white shadow"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    Select from Fleet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBusInputMode("CUSTOM")}
                                    className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                                        busInputMode === "CUSTOM"
                                            ? "bg-red-600 text-white shadow"
                                            : "text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    Custom / New Unit
                                </button>
                            </div>

                            {busInputMode === "SELECT" ? (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-300">Choose Fleet Bus Unit</label>
                                    <select
                                        value={newBusNumber}
                                        onChange={(e) => {
                                            const selectedNum = e.target.value;
                                            setNewBusNumber(selectedNum);
                                            const found = fleetBuses.find(b => b.bus_number === selectedNum);
                                            if (found?.bus_type) setNewBusType(found.bus_type);
                                        }}
                                        className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        required
                                    >
                                        <option value="">-- Choose Bus from Available Fleet --</option>
                                        {fleetBuses.map((b) => (
                                            <option key={b.id || b.bus_number} value={b.bus_number}>
                                                {b.bus_number} — {b.bus_type || "REGULAR AIRCON"} ({b.capacity || 45} seats)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-300">Enter Bus Unit Number / Plate</label>
                                    <Input
                                        placeholder="e.g., BUS-305, SL-901, EXPRESS-77"
                                        value={newBusNumber}
                                        onChange={(e) => setNewBusNumber(e.target.value.toUpperCase())}
                                        className="bg-zinc-900 border-zinc-700 text-white font-mono text-xs uppercase"
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">Bus Type</label>
                                <select
                                    value={newBusType}
                                    onChange={(e) => setNewBusType(e.target.value)}
                                    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="REGULAR AIRCON">REGULAR AIRCON (2x2 standard seating)</option>
                                    <option value="DELUXE AIRCON">DELUXE AIRCON (Aircon with onboard Wi-Fi & USB)</option>
                                    <option value="SUPER DELUXE">SUPER DELUXE (Comfort Class 2x1 seating)</option>
                                    <option value="EXECUTIVE SLEEPER">EXECUTIVE SLEEPER (Bed / Sleeper configuration)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-300">Operational Status</label>
                                <select
                                    value={newTripStatus}
                                    onChange={(e) => setNewTripStatus(e.target.value)}
                                    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="SCHEDULED">SCHEDULED (Awaiting bus at bay)</option>
                                    <option value="BOARDING">BOARDING (Active QR ticket scanning at gate)</option>
                                    <option value="DEPARTED">DEPARTED (Bus rolled out from terminal)</option>
                                    <option value="IN_TRANSIT">IN TRANSIT (On expressway / highway)</option>
                                    <option value="COMPLETED">COMPLETED (Arrived at destination)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setModalTrip(null)}
                                    className="border-zinc-700 text-zinc-300 hover:text-white"
                                    disabled={submittingBus}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submittingBus || !newBusNumber.trim()}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                >
                                    {submittingBus ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                                    ) : (
                                        <Check className="h-4 w-4 mr-1.5" />
                                    )}
                                    Confirm Bus Assignment
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
