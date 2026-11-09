"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PassengerManifest } from "@/components/passenger-manifest";
import { Bus, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { BusClassificationBadge } from "@/components/bus-classification-badge";

export default function TellerManifestPage() {
    const searchParams = useSearchParams();
    const initialTripId = searchParams?.get("trip_id");

    const [trips, setTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const handleSelectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        setLoading(true);

        try {
            // Centralized: Fetch manifest directly from conductor tickets endpoint which merges DB and local store
            const res = await fetch(`/api/conductor/tickets?trip_id=${encodeURIComponent(trip.id)}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.bookings)) {
                setBookings(data.bookings);
            } else {
                setBookings([]);
            }
        } catch (e) {
            console.error("Could not load trip manifest:", e);
            setBookings([]);
        }
        setLoading(false);
    };

    const fetchTrips = async () => {
        setLoading(true);
        let rawData: any[] = [];

        try {
            // Centralized: ONLY active trips scheduled by Admin in trip-store appear
            const adminRes = await fetch("/api/admin/trips");
            const adminJson = await adminRes.json();
            if (adminJson?.success && Array.isArray(adminJson.trips)) {
                rawData = adminJson.trips;
            }
        } catch (e) {
            console.warn("Could not load admin trips for teller:", e);
        }

        // Centralized Admin active schedule only (no stale fallback)
        const normalizedTrips = rawData.map((t: any) => ({
            ...t,
            fare_amount: t.fare_amount ?? t.price ?? 850,
            route: {
                origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
                destination: { name: t.destination || t.route?.destination?.name || "Daet" }
            },
            bus: t.bus || {
                bus_number: t.bus_number || "Superlines Express",
                bus_type: t.bus_type || "REGULAR AIRCON",
                seat_capacity: t.seat_capacity || 49
            }
        }));

        setTrips(normalizedTrips);

        if (initialTripId) {
            const found = normalizedTrips.find(t => t.id === initialTripId);
            if (found) {
                handleSelectTrip(found);
            } else if (normalizedTrips.length > 0) {
                handleSelectTrip(normalizedTrips[0]);
            } else {
                setLoading(false);
            }
        } else if (normalizedTrips.length > 0) {
            handleSelectTrip(normalizedTrips[0]);
        } else {
            setSelectedTrip(null);
            setBookings([]);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    return (
        <div className="space-y-6">
            {/* Trip Selector Dropdown Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Passenger Manifests</h1>
                    <p className="text-sm text-muted-foreground">View and print complete passenger lists synchronized with Admin schedules.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTrips}
                        disabled={loading}
                        className="text-xs font-semibold"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    {trips.length > 0 && (
                        <>
                            <span className="text-xs font-bold uppercase text-muted-foreground">Select Trip:</span>
                            <select
                                className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedTrip?.id || ""}
                                onChange={(e) => {
                                    const found = trips.find(t => t.id === e.target.value);
                                    if (found) handleSelectTrip(found);
                                }}
                            >
                                {trips.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.route?.origin?.name} ➔ {t.route?.destination?.name} ({new Date(t.departure_time).toLocaleDateString()} {new Date(t.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - {t.bus?.bus_number}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">Loading passenger manifest...</div>
            ) : trips.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="font-bold text-foreground">No active scheduled trips found</p>
                    <p className="text-xs text-muted-foreground mt-1">Trips scheduled in the Admin Trip & Schedule Management will immediately appear here.</p>
                </Card>
            ) : selectedTrip ? (
                <PassengerManifest trip={selectedTrip} bookings={bookings} />
            ) : (
                <Card className="p-8 text-center text-muted-foreground">Please select a trip schedule to view its manifest.</Card>
            )}
        </div>
    );
}
