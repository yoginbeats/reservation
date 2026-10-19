"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Bus,
    QrCode,
    Search,
    Printer,
    CheckCircle2,
    Clock,
    User,
    ArrowRight,
    RefreshCw,
    ShieldCheck,
    Check,
    AlertCircle,
    Edit,
    X,
    Info
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ManifestPassenger {
    id: string;
    seat_number: number;
    passenger_name: string;
    passenger_contact: string;
    booking_source: string;
    booking_status: string;
    payment_status: string;
    ticket_status: string;
    qr_token: string;
    created_at: string;
    is_discounted?: boolean;
    passenger_type?: string;
    discount_id?: string;
    discounted_passengers?: Array<{
        name: string;
        classification: string;
        id_number: string;
    }>;
}

function ConductorManifestContent() {
    const searchParams = useSearchParams();
    const initialTripId = searchParams?.get("trip_id");

    const [trips, setTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<any>(null);
    const [bookings, setBookings] = useState<ManifestPassenger[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [tripSearch, setTripSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "BOARDED" | "PENDING" | "DISCOUNTED">("ALL");
    const [selectedSeatPreview, setSelectedSeatPreview] = useState<ManifestPassenger | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Dynamic Bus Unit Reassignment State
    const [showBusModal, setShowBusModal] = useState(false);
    const [fleetBuses, setFleetBuses] = useState<any[]>([]);
    const [busInputMode, setBusInputMode] = useState<"SELECT" | "CUSTOM">("SELECT");
    const [newBusNumber, setNewBusNumber] = useState("");
    const [newBusType, setNewBusType] = useState("REGULAR AIRCON");
    const [newTripStatus, setNewTripStatus] = useState("SCHEDULED");
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchTrips();
    }, []);

    useEffect(() => {
        if (selectedTrip) {
            fetchManifest(selectedTrip.id);
        }
    }, [selectedTrip]);

    const fetchFleetBuses = async () => {
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

    const handleOpenBusModal = () => {
        fetchFleetBuses();
        const currentBusNum = selectedTrip?.bus?.bus_number || "";
        setNewBusNumber(currentBusNum);
        setNewBusType(selectedTrip?.bus?.bus_type || "REGULAR AIRCON");
        setNewTripStatus(selectedTrip?.status || "SCHEDULED");
        setAssignSuccessMsg(null);
        setShowBusModal(true);
    };

    const handleSaveBusAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip || !newBusNumber.trim()) return;

        setAssignSubmitting(true);
        setAssignSuccessMsg(null);
        try {
            const res = await fetch('/api/conductor/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_BUS_UNIT',
                    trip_id: selectedTrip.id,
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

                // Update selectedTrip
                setSelectedTrip((prev: any) => ({
                    ...prev,
                    status: updatedStatus,
                    bus: {
                        ...prev.bus,
                        bus_number: updatedBusNum,
                        bus_type: updatedType,
                    }
                }));

                // Update trips list
                setTrips((prevTrips) =>
                    prevTrips.map((t) =>
                        t.id === selectedTrip.id
                            ? {
                                  ...t,
                                  status: updatedStatus,
                                  bus: {
                                      ...t.bus,
                                      bus_number: updatedBusNum,
                                      bus_type: updatedType,
                                  },
                              }
                            : t
                    )
                );

                setAssignSuccessMsg(`Physical Bus Unit updated to "${updatedBusNum}" (${updatedType})! Manifest & QR Scanner are now synchronized.`);
                setTimeout(() => {
                    setShowBusModal(false);
                    setAssignSuccessMsg(null);
                }, 1800);
            } else {
                alert(data.error || "Failed to update bus unit.");
            }
        } catch (err: any) {
            alert("Error updating bus unit: " + err.message);
        } finally {
            setAssignSubmitting(false);
        }
    };

    const fetchTrips = async () => {
        setLoading(true);
        let rawData: any[] = [];

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

        setTrips(normalizedTrips);

        if (initialTripId) {
            const found = normalizedTrips.find((t: any) => t.id === initialTripId);
            if (found) setSelectedTrip(found);
            else if (normalizedTrips.length > 0) setSelectedTrip(normalizedTrips[0]);
        } else if (normalizedTrips.length > 0) {
            setSelectedTrip(normalizedTrips[0]);
        }

        setLoading(false);
    };

    const fetchManifest = async (tripId: string) => {
        setRefreshing(true);
        try {
            const res = await fetch(`/api/conductor/tickets?trip_id=${encodeURIComponent(tripId)}`);
            const data = await res.json();
            if (data.bookings) {
                setBookings(data.bookings);
            }
        } catch (err) {
            console.error("Error fetching manifest:", err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleMarkBoarded = async (token: string, seatNum: number) => {
        if (!token) return;
        setActionLoading(token);
        try {
            const res = await fetch('/api/conductor/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, action: 'CONFIRM_BOARDING' }),
            });
            const data = await res.json();
            if (res.ok) {
                setBookings(prev => prev.map(b => (b.qr_token === token || b.seat_number === seatNum) ? { ...b, ticket_status: 'USED' } : b));
                if (selectedSeatPreview && (selectedSeatPreview.qr_token === token || selectedSeatPreview.seat_number === seatNum)) {
                    setSelectedSeatPreview(prev => prev ? { ...prev, ticket_status: 'USED' } : null);
                }
            } else {
                alert(data.error || "Failed to mark as boarded.");
            }
        } catch (err: any) {
            alert("Error confirming boarding: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const totalSeats = 45;
    const boardedCount = bookings.filter(b => b.ticket_status === 'USED').length;
    const bookedCount = bookings.length;
    const pendingCount = bookedCount - boardedCount;
    const availableCount = Math.max(0, totalSeats - bookedCount);
    const boardingPercentage = bookedCount > 0 ? Math.round((boardedCount / bookedCount) * 100) : 0;

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.seat_number.toString().includes(searchTerm) ||
            b.qr_token.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "BOARDED" && b.ticket_status === "USED") ||
            (statusFilter === "PENDING" && b.ticket_status !== "USED") ||
            (statusFilter === "DISCOUNTED" && (b.is_discounted || (b.discounted_passengers && b.discounted_passengers.length > 0)));

        return matchesSearch && matchesStatus;
    });

    const filteredTrips = trips.filter((t) => {
        const origin = t.route?.origin?.name || "";
        const dest = t.route?.destination?.name || "";
        const busNum = t.bus?.bus_number || "";
        const q = tripSearch.toLowerCase().trim();
        if (!q) return true;
        return origin.toLowerCase().includes(q) || dest.toLowerCase().includes(q) || busNum.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <Bus className="h-7 w-7 text-red-500" />
                        Conductor Trip Manifest & Boarding Control
                    </h1>
                    <p className="text-xs text-zinc-400">Live seat check-in, passenger list, statutory discount inspection, and dynamic bus fleet assignment.</p>
                </div>

                <div className="flex items-center gap-2">
                    {selectedTrip && (
                        <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 font-bold text-white shadow-md shadow-red-600/30">
                            <Link href={`/conductor/scan?trip_id=${selectedTrip.id}`}>
                                <QrCode className="mr-1.5 h-4 w-4" />
                                Open QR Scanner
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="border-zinc-700 text-zinc-200">
                        <Printer className="mr-1.5 h-4 w-4" />
                        Print Manifest
                    </Button>
                </div>
            </div>

            {/* Official Printable Header */}
            <div className="hidden border-b pb-4 print:block text-black">
                <h1 className="text-2xl font-black uppercase text-red-600">SUPERLINES TRANSPORTATION CO., INC.</h1>
                <p className="text-sm font-bold">OFFICIAL TRIP PASSENGER MANIFEST & SEAT BOARDING AUDIT</p>
                {selectedTrip && (
                    <div className="mt-3 grid grid-cols-4 gap-4 text-xs font-mono border-t pt-2 border-black">
                        <div>ROUTE: {selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name}</div>
                        <div>BUS #: {selectedTrip.bus?.bus_number}</div>
                        <div>DATE: {new Date(selectedTrip.departure_time).toLocaleDateString()}</div>
                        <div>TIME: {new Date(selectedTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                )}
            </div>

            {/* Trip Selector Buttons with Schedule Search */}
            <div className="print:hidden space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Select Scheduled Departure Run</span>
                        <span className="text-[10px] text-zinc-500 font-normal">({filteredTrips.length} active)</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="relative w-48 sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                            <Input
                                placeholder="Filter route or bus #..."
                                value={tripSearch}
                                onChange={(e) => setTripSearch(e.target.value)}
                                className="h-7 pl-8 pr-2 text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectedTrip && fetchManifest(selectedTrip.id)}
                            disabled={refreshing}
                            className="text-xs text-zinc-400 hover:text-white h-7 px-2"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {filteredTrips.map((t) => {
                        const isSelected = selectedTrip?.id === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setSelectedTrip(t)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left ${
                                    isSelected
                                        ? "bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-500/20"
                                        : "bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-900"
                                }`}
                            >
                                <div className="font-extrabold flex items-center justify-between gap-2">
                                    <span>{t.route?.origin?.name} ➔ {t.route?.destination?.name}</span>
                                    {t.status === 'BOARDING' && (
                                        <span className="text-[9px] bg-amber-500 text-zinc-950 px-1.5 py-0.2 rounded font-black">
                                            BOARDING
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] font-normal opacity-80 font-mono mt-0.5">
                                    🚍 {t.bus?.bus_number} • {new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedTrip && (
                <>
                    {/* Trip & Bus Unit Dispatch Banner */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-lg print:hidden space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-red-600/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase font-mono tracking-wider">
                                        SCHEDULED RUN
                                    </span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono border ${
                                        selectedTrip.status === 'BOARDING'
                                            ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                                            : selectedTrip.status === 'DEPARTED'
                                            ? 'bg-blue-950/80 text-blue-300 border-blue-600'
                                            : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                                    }`}>
                                        STATUS: {selectedTrip.status || "SCHEDULED"}
                                    </span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
                                    <span>{selectedTrip.route?.origin?.name}</span>
                                    <ArrowRight className="h-5 w-5 text-red-500" />
                                    <span>{selectedTrip.route?.destination?.name}</span>
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                                    <span>📅 {new Date(selectedTrip.departure_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span>⏰ {new Date(selectedTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>🎫 Fare: ₱{selectedTrip.fare_amount || 850}.00</span>
                                </div>
                            </div>

                            {/* Physical Bus Assignment Box */}
                            <div className="rounded-xl border-2 border-red-900/40 bg-zinc-900/90 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-[280px]">
                                <div>
                                    <p className="text-[10px] uppercase font-mono font-bold text-zinc-400">Physical Bus Unit Assigned</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Bus className="h-5 w-5 text-red-500" />
                                        <div>
                                            <div className="font-mono text-base font-black text-white">
                                                {selectedTrip.bus?.bus_number || "NO BUS ASSIGNED (TBD)"}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 uppercase font-mono">
                                                {selectedTrip.bus?.bus_type || "REGULAR AIRCON"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleOpenBusModal}
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md whitespace-nowrap"
                                >
                                    <Edit className="h-3.5 w-3.5 mr-1" />
                                    Reassign Bus Unit
                                </Button>
                            </div>
                        </div>

                        {/* Operational Notice Box */}
                        <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5 text-[11px] text-zinc-400 flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                            <p>
                                <strong className="text-zinc-200">Conductor & Dispatcher Operational Notice:</strong> Passenger seat reservations, QR codes, and GCash payments are permanently tied to this <strong>Scheduled Departure ({selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name})</strong>. If a bus breakdown or replacement unit is dispatched at the terminal bay, click <strong className="text-red-400">&ldquo;Reassign Bus Unit&rdquo;</strong> to update the manifest and QR scanner immediately without disrupting passenger bookings.
                            </p>
                        </div>
                    </div>

                    {/* Dynamic Bus Unit Reassignment Modal */}
                    {showBusModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="w-full max-w-md rounded-2xl border-2 border-zinc-700 bg-zinc-950 p-6 text-zinc-100 shadow-2xl space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Bus className="h-5 w-5 text-red-500" />
                                        <h3 className="text-lg font-bold text-white">Assign Physical Bus Unit</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowBusModal(false)}
                                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="text-xs text-zinc-400 bg-zinc-900/70 p-3 rounded-xl border border-zinc-800 space-y-1">
                                    <p className="font-bold text-zinc-200">
                                        Trip: {selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name}
                                    </p>
                                    <p className="font-mono text-[11px]">
                                        Departure: {new Date(selectedTrip.departure_time).toLocaleDateString()} at {new Date(selectedTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {assignSuccessMsg && (
                                    <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/50 p-3 text-emerald-200 text-xs flex items-center gap-2 font-semibold">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                        <span>{assignSuccessMsg}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSaveBusAssignment} className="space-y-4">
                                    {/* Mode Selector */}
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
                                            Custom / New Bus Unit
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

                                    {/* Bus Type */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-300">Bus Type / Specification</label>
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

                                    {/* Trip Operational Status */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-300">Trip Operational Status</label>
                                        <select
                                            value={newTripStatus}
                                            onChange={(e) => setNewTripStatus(e.target.value)}
                                            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="SCHEDULED">SCHEDULED (Awaiting bus at bay)</option>
                                            <option value="BOARDING">BOARDING (Conductor actively scanning tickets at gate)</option>
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
                                            onClick={() => setShowBusModal(false)}
                                            className="border-zinc-700 text-zinc-300 hover:text-white"
                                            disabled={assignSubmitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            disabled={assignSubmitting || !newBusNumber.trim()}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                                        >
                                            {assignSubmitting ? (
                                                <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                                            ) : (
                                                <Check className="h-4 w-4 mr-1.5" />
                                            )}
                                            Confirm & Update Manifest
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Live Boarding Statistics Dashboard */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
                        <Card className="border-zinc-800 bg-zinc-950 p-3.5 text-zinc-100">
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Booked</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-mono text-2xl font-black text-white">{bookedCount}</span>
                                <span className="text-xs text-zinc-500">/ 45 seats</span>
                            </div>
                        </Card>

                        <Card className="border-emerald-800/60 bg-emerald-950/20 p-3.5 text-emerald-300">
                            <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Boarded
                            </p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-mono text-2xl font-black text-emerald-400">{boardedCount}</span>
                                <span className="text-xs text-emerald-500/80">verified</span>
                            </div>
                        </Card>

                        <Card className="border-amber-800/60 bg-amber-950/20 p-3.5 text-amber-300">
                            <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-400">
                                <Clock className="h-3.5 w-3.5" /> Pending Boarding
                            </p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-mono text-2xl font-black text-amber-400">{pendingCount}</span>
                                <span className="text-xs text-amber-500/80">awaiting</span>
                            </div>
                        </Card>

                        <Card className="border-zinc-800 bg-zinc-950 p-3.5 text-zinc-400">
                            <p className="text-[11px] font-bold uppercase tracking-wider">Empty Seats</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-mono text-2xl font-black text-zinc-300">{availableCount}</span>
                                <span className="text-xs text-zinc-500">available</span>
                            </div>
                        </Card>
                    </div>

                    {/* Boarding Progress Bar */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1.5 print:hidden">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-zinc-300">
                                Boarding Readiness: <span className="text-emerald-400">{boardedCount} of {bookedCount} Passengers Checked In</span>
                            </span>
                            <span className="font-mono font-black text-emerald-400">{boardingPercentage}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                                style={{ width: `${boardingPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Interactive 45-Seat Bus Grid Map */}
                    <Card className="border-zinc-800 bg-zinc-950 text-white print:hidden">
                        <CardHeader className="pb-3 border-b border-zinc-800/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Bus className="h-4 w-4 text-red-500" />
                                        45-Seat Interactive Bus Boarding Grid
                                    </CardTitle>
                                    <CardDescription className="text-xs text-zinc-400">
                                        Tap any seat to view passenger details, 20% discount verification, or confirm check-in.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-semibold">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-emerald-500" /> Boarded ({boardedCount})
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-amber-500" /> Pending ({pendingCount})
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-zinc-800 border border-zinc-700" /> Empty ({availableCount})
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            <div className="max-w-xl mx-auto rounded-2xl border-2 border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
                                {/* Driver / Front of Bus Indicator */}
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono text-zinc-400">
                                    <span className="bg-zinc-800 px-2.5 py-1 rounded font-bold">🚍 FRONT (Driver)</span>
                                    <span className="text-[11px]">DOOR / ENTRANCE ➔</span>
                                </div>

                                {/* 45 Seats Grid (Rows of 4 with aisle) */}
                                <div className="grid grid-cols-5 gap-2 text-xs font-mono">
                                    {Array.from({ length: 45 }).map((_, i) => {
                                        const seatNum = i + 1;
                                        const passenger = bookings.find(b => b.seat_number === seatNum);
                                        const isBoarded = passenger?.ticket_status === 'USED';
                                        const isBooked = Boolean(passenger);
                                        const isSelected = selectedSeatPreview?.seat_number === seatNum;

                                        // Column 3 is the aisle in 2x2 layout, except last row which has 5 seats
                                        const isAisle = (i % 4 === 2) && seatNum < 41;

                                        return (
                                            <button
                                                key={seatNum}
                                                type="button"
                                                onClick={() => {
                                                    if (passenger) setSelectedSeatPreview(passenger);
                                                }}
                                                className={`h-11 rounded-xl flex flex-col items-center justify-center font-bold transition-all relative border ${
                                                    isBoarded
                                                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm hover:bg-emerald-500"
                                                        : isBooked
                                                        ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-sm hover:bg-amber-400"
                                                        : "bg-zinc-800/80 text-zinc-500 border-zinc-700 hover:border-zinc-500"
                                                } ${isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-105" : ""}`}
                                            >
                                                <span className="text-[11px]">#{seatNum < 10 ? `0${seatNum}` : seatNum}</span>
                                                {isBoarded ? (
                                                    <span className="text-[8px] font-black uppercase">BOARDED</span>
                                                ) : isBooked ? (
                                                    <span className="text-[8px] font-black uppercase">PAID</span>
                                                ) : (
                                                    <span className="text-[8px] font-normal opacity-60">FREE</span>
                                                )}
                                                {passenger?.is_discounted && (
                                                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-purple-600 rounded-full border border-white text-[7px] text-white flex items-center justify-center font-black">
                                                        %
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Selected Seat Quick Inspection Card */}
                            {selectedSeatPreview && (
                                <div className="mt-4 p-4 rounded-xl border-2 border-zinc-700 bg-zinc-900 text-xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xl font-black text-emerald-400">
                                                Seat #{selectedSeatPreview.seat_number < 10 ? `0${selectedSeatPreview.seat_number}` : selectedSeatPreview.seat_number}
                                            </span>
                                            <span className="text-zinc-300 font-bold text-sm">
                                                {selectedSeatPreview.passenger_name}
                                            </span>
                                        </div>
                                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                            selectedSeatPreview.ticket_status === 'USED'
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                                        }`}>
                                            {selectedSeatPreview.ticket_status === 'USED' ? '✓ BOARDED' : 'AWAITING BOARDING'}
                                        </span>
                                    </div>

                                    {/* Discount Info if present */}
                                    {(selectedSeatPreview.is_discounted || (selectedSeatPreview.discounted_passengers && selectedSeatPreview.discounted_passengers.length > 0)) && (
                                        <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-800 text-purple-200 text-xs space-y-1">
                                            <div className="font-bold flex items-center justify-between text-purple-300">
                                                <span>20% Statutory Discount Beneficiary</span>
                                                <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded font-black">20% OFF</span>
                                            </div>
                                            {selectedSeatPreview.discounted_passengers && selectedSeatPreview.discounted_passengers.length > 0 ? (
                                                selectedSeatPreview.discounted_passengers.map((p, idx) => (
                                                    <p key={idx} className="font-mono text-[11px]">
                                                        {p.name} ({p.classification}) • ID: {p.id_number}
                                                    </p>
                                                ))
                                            ) : (
                                                <p className="font-mono text-[11px]">
                                                    {selectedSeatPreview.passenger_type} • ID: {selectedSeatPreview.discount_id || "Verified"}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="font-mono text-zinc-400 text-[11px]">Token: {selectedSeatPreview.qr_token || "Pending"}</span>
                                        {selectedSeatPreview.ticket_status !== 'USED' && (
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs"
                                                onClick={() => handleMarkBoarded(selectedSeatPreview.qr_token, selectedSeatPreview.seat_number)}
                                                disabled={actionLoading === selectedSeatPreview.qr_token}
                                            >
                                                <Check className="h-3.5 w-3.5 mr-1" />
                                                Mark as Boarded
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Search & Filter Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-2 print:hidden">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Search passenger name, seat #, or ticket token..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
                            />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto">
                            {(["ALL", "PENDING", "BOARDED", "DISCOUNTED"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setStatusFilter(mode)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                        statusFilter === mode
                                            ? "bg-red-600 text-white border-red-600"
                                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                                    }`}
                                >
                                    {mode === "ALL" && `All (${bookings.length})`}
                                    {mode === "PENDING" && `Pending (${pendingCount})`}
                                    {mode === "BOARDED" && `Boarded (${boardedCount})`}
                                    {mode === "DISCOUNTED" && `Discounts (${bookings.filter(b => b.is_discounted || b.discounted_passengers?.length).length})`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Passenger Manifest Table */}
                    <Card className="border-zinc-800 bg-zinc-950 text-white shadow-xl print:border-none print:shadow-none print:bg-white print:text-black">
                        <CardHeader className="pb-3 border-b border-zinc-800 print:hidden">
                            <CardTitle className="text-base font-bold flex items-center justify-between">
                                <span>Official Passenger Manifest List ({filteredBookings.length})</span>
                                <span className="text-xs font-mono font-normal text-zinc-400">
                                    Trip Fare: ₱{selectedTrip.fare_amount || 850}.00
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-zinc-900/80 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800 print:bg-zinc-100 print:text-black">
                                        <tr className="text-left">
                                            <th className="p-3 text-center w-16">Seat</th>
                                            <th className="p-3">Passenger Full Name</th>
                                            <th className="p-3">Discount & ID Verification</th>
                                            <th className="p-3">Source & Payment</th>
                                            <th className="p-3 font-mono">Ticket QR Token</th>
                                            <th className="p-3 text-center">Boarding Status</th>
                                            <th className="p-3 text-right print:hidden">Quick Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800 print:divide-zinc-300">
                                        {filteredBookings.length > 0 ? (
                                            filteredBookings.map((b) => {
                                                const isBoarded = b.ticket_status === 'USED';
                                                const hasDisc = Boolean(b.is_discounted || (b.discounted_passengers && b.discounted_passengers.length > 0));

                                                return (
                                                    <tr key={b.id} className="hover:bg-zinc-900/40 transition-colors">
                                                        <td className="p-3 text-center font-mono font-black text-sm text-emerald-400 print:text-black">
                                                            #{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-bold text-white print:text-black">{b.passenger_name}</div>
                                                            {b.passenger_contact && (
                                                                <div className="text-[10px] text-zinc-400 font-mono">{b.passenger_contact}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            {hasDisc ? (
                                                                <div className="space-y-0.5">
                                                                    {b.discounted_passengers && b.discounted_passengers.length > 0 ? (
                                                                        b.discounted_passengers.map((p, idx) => (
                                                                            <div key={idx} className="flex items-center gap-1.5">
                                                                                <span className="text-[9px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded font-black border border-purple-700">
                                                                                    {p.classification} -20%
                                                                                </span>
                                                                                <span className="font-mono text-[10px] text-purple-300">
                                                                                    ID: {p.id_number}
                                                                                </span>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[9px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded font-black border border-purple-700">
                                                                                {b.passenger_type || "20% DISCOUNT"}
                                                                            </span>
                                                                            {b.discount_id && (
                                                                                <span className="font-mono text-[10px] text-purple-300">
                                                                                    ID: {b.discount_id}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-zinc-500">Standard Regular</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-[11px]">
                                                            <span className="font-medium text-zinc-300 print:text-black">
                                                                {b.booking_source}
                                                            </span>
                                                            <div className="text-[10px] text-emerald-400 font-semibold font-mono">
                                                                {b.payment_status}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 font-mono text-[11px] text-zinc-400 print:text-black">
                                                            {b.qr_token || "Pending Token"}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                                                isBoarded
                                                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800 print:bg-zinc-200 print:text-black"
                                                                    : "bg-amber-950 text-amber-300 border border-amber-800 print:bg-zinc-100 print:text-black"
                                                            }`}>
                                                                {isBoarded ? "✓ BOARDED" : "PENDING"}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right print:hidden">
                                                            {!isBoarded ? (
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 font-bold px-2.5"
                                                                    onClick={() => handleMarkBoarded(b.qr_token, b.seat_number)}
                                                                    disabled={actionLoading === b.qr_token}
                                                                >
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Mark Boarded
                                                                </Button>
                                                            ) : (
                                                                <span className="text-[10px] text-zinc-500 font-mono">Checked In</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-zinc-500">
                                                    No passengers matching the search or filter criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Official Print Footer Signatures */}
                            <div className="hidden grid-cols-2 gap-12 text-xs print:grid border-t border-black p-6 mt-8 text-black">
                                <div>
                                    <p className="font-bold">Dispatcher / Terminal Teller In-Charge:</p>
                                    <div className="mt-10 border-b border-black w-56"></div>
                                    <p className="mt-1 text-[10px] text-zinc-600">Signature Over Printed Name</p>
                                </div>
                                <div>
                                    <p className="font-bold">Verified & Boarded By (Bus Conductor):</p>
                                    <div className="mt-10 border-b border-black w-56"></div>
                                    <p className="mt-1 text-[10px] text-zinc-600">Signature Over Printed Name</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

export default function ConductorManifestPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading trip manifest...</div>}>
            <ConductorManifestContent />
        </Suspense>
    );
}
