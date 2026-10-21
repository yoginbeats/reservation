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
    Info,
    Bath,
    DoorOpen,
    Armchair
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { 
    SUPERLINES_BUS_CLASSIFICATIONS, 
    getBusClassification, 
    BusClassification,
    SeatGridCell 
} from "@/lib/constants/bus-layouts";

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
    const [inspectedSeatNumber, setInspectedSeatNumber] = useState<number | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Conductor Schedule Selective Filters (Date, Origin, Destination, Departure Time, Classification)
    const [filterDate, setFilterDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [filterOrigin, setFilterOrigin] = useState<string>("ALL");
    const [filterDestination, setFilterDestination] = useState<string>("ALL");
    const [filterDepartureTime, setFilterDepartureTime] = useState<string>("ALL");
    const [filterClassification, setFilterClassification] = useState<string>("ALL");

    // Official Superlines Manifest Layout State
    const [manifestLayout, setManifestLayout] = useState<BusClassification>(() =>
        getBusClassification(selectedTrip?.bus?.bus_type, selectedTrip?.bus?.bus_number)
    );

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
            setManifestLayout(getBusClassification(selectedTrip?.bus?.bus_type, selectedTrip?.bus?.bus_number));
            setSelectedSeatPreview(null);
            setInspectedSeatNumber(null);
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
            .select('*, bus:buses(bus_number, bus_type, seat_capacity)')
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
            bus: t.bus || { bus_number: "Superlines Express", bus_type: "REGULAR AIRCON", seat_capacity: 49 }
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

    const totalSeats = manifestLayout?.capacity || selectedTrip?.bus?.seat_capacity || selectedTrip?.seat_capacity || 49;
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
        const origin = t.route?.origin?.name || t.origin || "";
        const dest = t.route?.destination?.name || t.destination || "";
        const busNum = t.bus?.bus_number || "";
        const busType = (t.bus?.bus_type || t.bus_type || "REGULAR AIRCON").toUpperCase();
        const depIso = t.departure_time || "";
        const depDate = depIso ? new Date(depIso).toISOString().slice(0, 10) : "";
        const depTimeStr = depIso ? new Date(depIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

        // Text search
        const q = tripSearch.toLowerCase().trim();
        if (q && !(origin.toLowerCase().includes(q) || dest.toLowerCase().includes(q) || busNum.toLowerCase().includes(q))) {
            return false;
        }

        // 1. Date Filter (defaults to today)
        if (filterDate && depDate !== filterDate) {
            return false;
        }

        // 2. Specific Origin Filter
        if (filterOrigin !== "ALL" && !origin.toLowerCase().includes(filterOrigin.toLowerCase())) {
            return false;
        }

        // 3. Specific Destination Filter
        if (filterDestination !== "ALL" && !dest.toLowerCase().includes(filterDestination.toLowerCase())) {
            return false;
        }

        // 4. Departure Time Filter
        if (filterDepartureTime !== "ALL" && depTimeStr !== filterDepartureTime) {
            return false;
        }

        // 5. Classification Filter (Regular Aircon, Super Deluxe, First Class)
        if (filterClassification !== "ALL") {
            if (!busType.includes(filterClassification.toUpperCase())) {
                return false;
            }
        }

        return true;
    });

    // Dynamic Route Options for Easy Senior-Friendly Navigation
    const availableOrigins = ["Daet", "Cubao", "PITX"];
    const availableDestinations = Array.from(new Set(
        trips
            .filter(t => {
                if (filterOrigin === "ALL") return true;
                const orig = t.route?.origin?.name || t.origin || "";
                return orig.toLowerCase().includes(filterOrigin.toLowerCase());
            })
            .map(t => t.route?.destination?.name || t.destination)
            .filter(Boolean)
    )).sort();

    const availableDepartureTimes = Array.from(new Set(
        trips
            .filter(t => {
                const orig = t.route?.origin?.name || t.origin || "";
                const dest = t.route?.destination?.name || t.destination || "";
                if (filterOrigin !== "ALL" && !orig.toLowerCase().includes(filterOrigin.toLowerCase())) return false;
                if (filterDestination !== "ALL" && !dest.toLowerCase().includes(filterDestination.toLowerCase())) return false;
                return true;
            })
            .map(t => t.departure_time ? new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "")
            .filter(Boolean)
    )).sort();

    // Automatically sync selectedTrip to filteredTrips so conductors don't need to manually click through lists
    useEffect(() => {
        if (filteredTrips.length > 0) {
            if (!selectedTrip || !filteredTrips.some(t => t.id === selectedTrip.id)) {
                setSelectedTrip(filteredTrips[0]);
            }
        }
    }, [filteredTrips, selectedTrip]);

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
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="border-zinc-700 bg-zinc-200 text-black hover:bg-zinc-300">
                        <Printer className="mr-1.5 h-4 w-4" />
                        Print Manifest
                    </Button>
                </div>
            </div>

            {/* Official Printable Header */}
            <div className="hidden border-b pb-4 print:block bg-zinc-950 text-white">
                <h1 className="text-2xl font-black uppercase text-red-600">SUPERLINES TRANSPORTATION CO., INC.</h1>
                <p className="text-sm font-bold">OFFICIAL TRIP PASSENGER MANIFEST & SEAT BOARDING AUDIT</p>
                {selectedTrip && (
                    <div className="mt-3 grid grid-cols-4 gap-4 text-xs font-mono border-t pt-2 border-zinc-800">
                        <div>ROUTE: {selectedTrip.route?.origin?.name} ➔ {selectedTrip.route?.destination?.name}</div>
                        <div>BUS #: {selectedTrip.bus?.bus_number}</div>
                        <div>DATE: {new Date(selectedTrip.departure_time).toLocaleDateString()}</div>
                        <div>TIME: {new Date(selectedTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                )}
            </div>

            {/* Senior-Friendly Conductor Quick Navigator (Large Dropdowns) */}
            <div className="print:hidden space-y-4 bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                    <div>
                        <span className="text-sm font-black text-red-500 uppercase tracking-wider flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <span>Conductor Trip Navigator</span>
                        </span>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Piliin ang Origin, Destination, Oras, at Bus Type para agad lumabas ang reservation manifest ng inyong biyahe.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {(filterDate !== new Date().toISOString().split("T")[0] || filterOrigin !== "ALL" || filterDestination !== "ALL" || filterDepartureTime !== "ALL" || filterClassification !== "ALL") && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterDate(new Date().toISOString().split("T")[0]);
                                    setFilterOrigin("ALL");
                                    setFilterDestination("ALL");
                                    setFilterDepartureTime("ALL");
                                    setFilterClassification("ALL");
                                    setTripSearch("");
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-zinc-900 border border-zinc-700 rounded-lg transition"
                            >
                                Reset Filters
                            </button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectedTrip && fetchManifest(selectedTrip.id)}
                            disabled={refreshing}
                            className="bg-white text-black font-bold hover:bg-zinc-100 hover:text-black border-zinc-300 text-xs h-8"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 text-black ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* 5 Prominent, Easy-to-Read Dropdowns for Older Conductors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* 1. Origin Terminal */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-1">
                            <span>📍 1. Origin Terminal</span>
                        </label>
                        <select
                            value={filterOrigin}
                            onChange={(e) => {
                                setFilterOrigin(e.target.value);
                                setFilterDestination("ALL");
                                setFilterDepartureTime("ALL");
                            }}
                            className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500 shadow-inner"
                        >
                            <option value="ALL">-- Lahat ng Origin --</option>
                            <option value="Daet">Daet Central Terminal</option>
                            <option value="Cubao">Cubao Terminal</option>
                            <option value="PITX">PITX Terminal</option>
                        </select>
                    </div>

                    {/* 2. Destination Terminal */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-1">
                            <span>🏁 2. Destination</span>
                        </label>
                        <select
                            value={filterDestination}
                            onChange={(e) => {
                                setFilterDestination(e.target.value);
                                setFilterDepartureTime("ALL");
                            }}
                            className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500 shadow-inner"
                        >
                            <option value="ALL">-- Lahat ng Destination --</option>
                            {availableDestinations.map(d => (
                                <option key={d} value={d}>{d} Terminal</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Scheduled Time */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-1">
                            <span>⏰ 3. Scheduled Time</span>
                        </label>
                        <select
                            value={filterDepartureTime}
                            onChange={(e) => setFilterDepartureTime(e.target.value)}
                            className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-bold font-mono text-white outline-none focus:border-red-500 shadow-inner"
                        >
                            <option value="ALL">-- Lahat ng Oras --</option>
                            {availableDepartureTimes.map((tStr) => (
                                <option key={tStr} value={tStr}>{tStr}</option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Bus Classification */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-1">
                            <span>🚌 4. Bus Classification</span>
                        </label>
                        <select
                            value={filterClassification}
                            onChange={(e) => setFilterClassification(e.target.value)}
                            className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-red-500 shadow-inner"
                        >
                            <option value="ALL">-- All Classifications --</option>
                            <option value="REGULAR AIRCON">Regular Aircon (49 Seats)</option>
                            <option value="SUPER DELUXE">Super Deluxe (43 Seats • CR)</option>
                            <option value="FIRST CLASS">First Class (41 Seats • Sleeper)</option>
                        </select>
                    </div>

                    {/* 5. Date */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-1">
                            <span>📅 5. Petsa / Date</span>
                        </label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold text-white outline-none focus:border-red-500 shadow-inner"
                        />
                    </div>
                </div>

                {/* Filter Result & Clean Selection Cards */}
                {filteredTrips.length === 0 ? (
                    <div className="p-6 text-center text-xs text-amber-300 bg-amber-950/20 border-2 border-dashed border-amber-800/60 rounded-xl">
                        ⚠️ Walang scheduled trip na tumutugma sa napiling Origin, Destination, at Oras para sa petsang ito ({filterDate || "Lahat"}). Paki-check ang petsa o i-reset ang filters.
                    </div>
                ) : (
                    <div className="pt-2">
                        <div className="text-xs text-zinc-400 font-bold mb-2 flex items-center justify-between">
                            <span>Natagpuang Schedule ({filteredTrips.length} Biyahe):</span>
                            <span className="text-[11px] text-zinc-500">I-click lamang para mag-palit ng aktibong biyahe</span>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredTrips.map((t) => {
                                const isSelected = selectedTrip?.id === t.id;
                                const origName = t.route?.origin?.name || t.origin;
                                const destName = t.route?.destination?.name || t.destination;
                                const busNum = t.bus?.bus_number || "Bus TBD";
                                const busType = t.bus?.bus_type || "REGULAR AIRCON";
                                const timeStr = new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setSelectedTrip(t)}
                                        className={`p-3.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between gap-2 ${
                                            isSelected
                                                ? "bg-red-950/60 border-red-500 shadow-lg ring-2 ring-red-500/30 text-white"
                                                : "bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-sm text-white flex items-center gap-1.5">
                                                <span>{origName}</span>
                                                <span className="text-red-500">➔</span>
                                                <span>{destName}</span>
                                            </span>
                                            {isSelected && (
                                                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                                                    ✓ AKTIBO
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-zinc-800">
                                            <span className="text-emerald-400 font-black text-sm">⏰ {timeStr}</span>
                                            <span className="text-zinc-300 font-bold">🚍 {busNum}</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-zinc-400 uppercase">
                                            {busType.replace(/[-_]/g, ' ')}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
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
                                    <p className="text-[10px] uppercase font-mono font-bold text-zinc-400">Assigned Bus Unit & Classification</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Bus className="h-5 w-5 text-red-500" />
                                        <div>
                                            <div className="font-mono text-base font-black text-white">
                                                Bus Unit: {selectedTrip.bus?.bus_number || "NO BUS ASSIGNED (TBD)"}
                                            </div>
                                            <div className="text-[11px] text-zinc-300 font-mono font-bold">
                                                Classification: <span className="text-red-400">{selectedTrip.bus?.bus_type || "REGULAR AIRCON"}</span>
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

                                    {/* Bus Classification */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-zinc-300">Bus Classification</label>
                                        <select
                                            value={newBusType}
                                            onChange={(e) => setNewBusType(e.target.value)}
                                            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="REGULAR AIRCON">REGULAR AIRCON (49 seats standard • ₱850)</option>
                                            <option value="SUPER DELUXE">SUPER DELUXE (43 seats with Restroom & Stairs • ₱950)</option>
                                            <option value="FIRST CLASS">FIRST CLASS (41 seats Premier Sleeper • ₱1,100)</option>
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
                                            className="bg-white text-black hover:bg-zinc-100 hover:text-black font-bold border-zinc-300"
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
                                <span className="text-xs text-zinc-500">/ {totalSeats} seats</span>
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

                    {/* ========================================================================= */}
                    {/* OFFICIAL SUPERLINES MANIFEST BOARD (MATCHING PHYSICAL LAMINATED SHEETS)   */}
                    {/* ========================================================================= */}
                    <Card className="border-2 border-zinc-800 bg-zinc-950 text-white">
                        <CardHeader className="pb-3 border-b border-zinc-800/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Bus className="h-5 w-5 text-red-500" />
                                        Official Superlines Bus Boarding Manifest & Seating Arrangement
                                    </CardTitle>
                                    <CardDescription className="text-xs text-zinc-400">
                                        Official bus seating arrangement. Tap any seat to inspect passenger booking, 20% discount ID verification, or confirm boarding check-in.
                                    </CardDescription>
                                </div>

                                {/* Bus Model Switcher */}
                                <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                                    {SUPERLINES_BUS_CLASSIFICATIONS.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setManifestLayout(c);
                                                setSelectedSeatPreview(null);
                                                setInspectedSeatNumber(null);
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                                manifestLayout.id === c.id
                                                    ? "bg-red-600 text-white border-red-600 shadow-sm"
                                                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                                            }`}
                                        >
                                            {c.capacity} Seater ({c.name})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Status Legend */}
                            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-semibold text-zinc-300">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-emerald-600 border border-emerald-500" /> Boarded ({boardedCount})
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-3 w-3 rounded bg-amber-500 border border-amber-400 text-zinc-950" /> Paid / Pending ({pendingCount})
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className={`h-3 w-3 rounded ${manifestLayout.seatColor === 'red' ? 'bg-[#E05D5D]' : 'bg-[#5B9BD5]'} border border-zinc-600`} /> Free ({availableCount})
                                </span>
                                {manifestLayout.hasCR && (
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-[#4A7BB0] border border-[#3A6B9E]" /> Comfort Room
                                    </span>
                                )}
                                {manifestLayout.hasStairs && (
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-[#70B0E0] border border-[#5A9AC8]" /> Stairs
                                    </span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {/* Physical Laminated Sheet Container */}
                            <div className="mx-auto max-w-lg rounded-2xl border-2 border-zinc-400/80 bg-[#FAFAFA] dark:bg-zinc-900 p-3 sm:p-5 shadow-xl text-zinc-950 dark:text-zinc-50 space-y-3.5">
                                {/* Official Header */}
                                <div className="text-center space-y-0.5 border-b border-zinc-300 dark:border-zinc-700 pb-3">
                                    <h2 className="text-sm sm:text-base font-black tracking-wider text-[#1A365D] dark:text-sky-300 uppercase font-sans">
                                        SUPERLINES TRANSPORTATION CO., INC.
                                    </h2>
                                    <div className="pt-1">
                                        <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide">
                                            {manifestLayout.officialTitle}
                                        </p>
                                        <p className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 font-mono">
                                            {manifestLayout.seaterLabel}
                                        </p>
                                    </div>
                                    {manifestLayout.busNotes && (
                                        <p className="text-[10px] font-mono font-bold text-zinc-500 pt-0.5">
                                            {manifestLayout.busNotes}
                                        </p>
                                    )}
                                </div>

                                {/* Column Headers: DRIVER'S SEAT | AISLE | CONDUCTOR SEAT */}
                                <div className="grid grid-cols-12 gap-1 items-end text-center">
                                    <div className="col-span-5 rounded-t-md bg-[#70B0E0] text-zinc-950 font-black text-[11px] sm:text-xs uppercase py-1.5 shadow-sm border border-[#5A9AC8]">
                                        DRIVER&apos;S SEAT
                                    </div>
                                    <div className="col-span-2 text-[10px] font-black uppercase text-red-600 dark:text-red-400 py-1 font-mono">
                                        {/* Aisle Spacer */}
                                    </div>
                                    <div className="col-span-5 rounded-t-md bg-[#70B0E0] text-zinc-950 font-black text-[11px] sm:text-xs uppercase py-1.5 shadow-sm border border-[#5A9AC8]">
                                        CONDUCTOR SEAT
                                    </div>
                                </div>

                                {/* Official Rows Grid */}
                                <div className="space-y-1 sm:space-y-1.5 bg-white dark:bg-zinc-950/70 p-2 sm:p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 shadow-inner">
                                    {(() => {
                                        const totalRows = manifestLayout.rows.length;
                                        const aisleLetters = ["A", "I", "S", "L", "E"];
                                        const startRowIdx = Math.max(1, Math.floor((totalRows - aisleLetters.length) / 2));

                                        const renderCell = (cell: SeatGridCell, isBackRow = false) => {
                                            if (!cell || cell.type === "empty") {
                                                return <div className="h-10 w-11 sm:h-11 sm:w-12" />;
                                            }

                                            if (cell.type === "cr") {
                                                return (
                                                    <div
                                                        className="flex h-10 w-[94px] sm:h-11 sm:w-[102px] items-center justify-center rounded-md bg-[#4A7BB0] text-white font-black text-[10px] sm:text-[11px] shadow-sm gap-1 border border-[#3A6B9E] select-none"
                                                        title="Comfort Room (Restroom)"
                                                    >
                                                        <Bath className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="tracking-tighter">COMFORT ROOM</span>
                                                    </div>
                                                );
                                            }

                                            if (cell.type === "stairs") {
                                                return (
                                                    <div
                                                        className="flex h-10 w-[94px] sm:h-11 sm:w-[102px] items-center justify-center rounded-md bg-[#70B0E0] text-zinc-950 font-black text-[10px] sm:text-[11px] shadow-sm gap-1 border border-[#5A9AC8] select-none"
                                                        title="Exit / Entrance Stairs"
                                                    >
                                                        <DoorOpen className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="tracking-wider">STAIRS</span>
                                                    </div>
                                                );
                                            }

                                            const seatNum = cell.seatNumber!;
                                            const passenger = bookings.find(b => b.seat_number === seatNum);
                                            const isBoarded = passenger?.ticket_status === 'USED';
                                            const isBooked = Boolean(passenger);
                                            const isSelected = selectedSeatPreview?.seat_number === seatNum || inspectedSeatNumber === seatNum;
                                            const isRedTheme = manifestLayout.seatColor === "red";

                                            const freeBg = isRedTheme
                                                ? "bg-[#E05D5D] hover:bg-[#D44A4A] text-white border-[#C94545]"
                                                : "bg-[#5B9BD5] hover:bg-[#4A8EC6] text-white border-[#457EB3]";

                                            return (
                                                <button
                                                    key={seatNum}
                                                    type="button"
                                                    onClick={() => {
                                                        setInspectedSeatNumber(seatNum);
                                                        setSelectedSeatPreview(passenger || null);
                                                    }}
                                                    className={`relative flex h-10 w-11 sm:h-11 sm:w-12 flex-col items-center justify-center rounded-md border font-mono transition-all ${
                                                        isBoarded
                                                            ? "bg-emerald-600 text-white border-emerald-500 shadow-md hover:bg-emerald-500"
                                                            : isBooked
                                                            ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md hover:bg-amber-400"
                                                            : `${freeBg} shadow-sm hover:scale-105 active:scale-95`
                                                    } ${isSelected ? "ring-4 ring-sky-500 scale-105 z-20 shadow-xl" : ""} ${isBackRow ? "flex-1 max-w-[52px]" : ""}`}
                                                    title={`Seat #${seatNum} — ${isBoarded ? 'BOARDED' : isBooked ? `PAID (${passenger?.passenger_name})` : 'FREE'}`}
                                                >
                                                    <span className="text-[12px] sm:text-[13px] font-black leading-tight">
                                                        {seatNum}
                                                    </span>
                                                    <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-tight">
                                                        {isBoarded ? "BOARDED" : isBooked ? "PAID" : "FREE"}
                                                    </span>

                                                    {/* 20% Discount Badge */}
                                                    {(passenger?.is_discounted || (passenger?.discounted_passengers && passenger.discounted_passengers.length > 0)) && (
                                                        <span
                                                            className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-purple-600 rounded-full border border-white text-[7.5px] text-white flex items-center justify-center font-black shadow"
                                                            title="20% Statutory Discount Verified"
                                                        >
                                                            %
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        };

                                        return manifestLayout.rows.map((row, rowIdx) => {
                                            const isBackRow = Boolean(row.aisleSeat);
                                            const aisleLetterIdx = rowIdx - startRowIdx;
                                            const aisleLetter = (!isBackRow && aisleLetterIdx >= 0 && aisleLetterIdx < aisleLetters.length)
                                                ? aisleLetters[aisleLetterIdx]
                                                : null;

                                            return (
                                                <div key={row.rowNumber} className="grid grid-cols-12 items-center gap-1">
                                                    {/* Left Side (Driver Side - 2 Seats) */}
                                                    <div className="col-span-5 flex justify-end gap-1 sm:gap-1.5">
                                                        {row.leftSeats.map((cell, idx) => (
                                                            <div key={idx} className="shrink-0">
                                                                {renderCell(cell, isBackRow)}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Center Aisle (Or Middle Back Seat) */}
                                                    <div className="col-span-2 flex items-center justify-center">
                                                        {row.aisleSeat ? (
                                                            renderCell(row.aisleSeat, true)
                                                        ) : (
                                                            <div className="flex h-10 w-full items-center justify-center">
                                                                <span className="text-xs sm:text-sm font-black font-serif text-red-600 dark:text-red-400 select-none">
                                                                    {aisleLetter || "•"}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right Side (Conductor Side - 2 Seats / CR / Stairs) */}
                                                    <div className="col-span-5 flex justify-start gap-1 sm:gap-1.5">
                                                        {row.rightSeats.map((cell, idx) => (
                                                            <div key={idx} className="shrink-0">
                                                                {renderCell(cell, isBackRow)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Selected Seat Quick Inspection Card */}
                            {(selectedSeatPreview || inspectedSeatNumber !== null) && (
                                <div className="mt-4 p-4 rounded-xl border-2 border-zinc-700 bg-zinc-900 text-xs space-y-3">
                                    {selectedSeatPreview ? (
                                        <>
                                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xl font-black text-emerald-400">
                                                        Seat #{selectedSeatPreview.seat_number < 10 ? `0${selectedSeatPreview.seat_number}` : selectedSeatPreview.seat_number}
                                                    </span>
                                                    <span className="text-zinc-200 font-bold text-sm">
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

                                            {/* Booking metadata */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-zinc-400">
                                                <div>
                                                    <span className="text-zinc-500 block text-[10px]">Contact Phone</span>
                                                    <span className="text-zinc-300 font-mono">{selectedSeatPreview.passenger_contact || "N/A"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 block text-[10px]">Issuance Channel</span>
                                                    <span className="text-zinc-300 font-semibold">{selectedSeatPreview.booking_source || "Counter / Online"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-zinc-500 block text-[10px]">Payment Status</span>
                                                    <span className="text-emerald-400 font-bold">{selectedSeatPreview.payment_status || "PAID"}</span>
                                                </div>
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
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-lg font-black text-zinc-300">
                                                    Seat #{inspectedSeatNumber! < 10 ? `0${inspectedSeatNumber}` : inspectedSeatNumber}
                                                </span>
                                                <span className="text-zinc-400 font-semibold text-xs">
                                                    Vacant / Available for Walk-in Passenger
                                                </span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                UNBOOKED
                                            </span>
                                        </div>
                                    )}
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
