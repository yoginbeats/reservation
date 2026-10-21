"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PassengerManifest } from "@/components/passenger-manifest";
import { Bus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TellerManifestPage() {
    const searchParams = useSearchParams();
    const initialTripId = searchParams?.get("trip_id");

    const [trips, setTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    const handleSelectTrip = async (trip: any) => {
        setSelectedTrip(trip);
        setLoading(true);

        // Query all bookings (both ONLINE and WALK_IN from any terminal) for this specific trip
        const { data: bookingsData, error } = await supabase
            .from('bookings')
            .select(`
                id,
                seat_number,
                passenger_name,
                passenger_contact,
                booking_source,
                booking_status,
                created_at,
                booking_terminal:terminals(name),
                payment:payments(payment_status, transaction_ref)
            `)
            .eq('trip_id', trip.id)
            .order('seat_number', { ascending: true });

        if (bookingsData) {
            setBookings(bookingsData);
        }
        setLoading(false);
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
            route: {
                origin: { name: t.origin || t.route?.origin?.name || "Cubao" },
                destination: { name: t.destination || t.route?.destination?.name || "Daet" }
            },
            bus: t.bus || { bus_number: "Superlines Express", bus_type: "REGULAR AIRCON" }
        }));

        // Centralize: Filter trips based on the logged-in Teller's assigned terminal
        let terminalFiltered = normalizedTrips;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('terminal:terminal_id(id, name)')
                    .eq('user_id', user.id)
                    .single();

                const tName = ((roleData as any)?.terminal?.name || "").toLowerCase().replace(/central|terminal|station/g, "").trim();
                if (tName) {
                    const matched = normalizedTrips.filter((t: any) => {
                        const origin = (t.origin || t.route?.origin?.name || "").toLowerCase();
                        return origin.includes(tName) || tName.includes(origin);
                    });
                    if (matched.length > 0) {
                        terminalFiltered = matched;
                    }
                }
            }
        } catch (e) {
            console.warn("Could not load teller terminal filter for manifest:", e);
        }

        setTrips(terminalFiltered);
        if (initialTripId) {
            const found = terminalFiltered.find(t => t.id === initialTripId);
            if (found) {
                handleSelectTrip(found);
            } else if (terminalFiltered.length > 0) {
                handleSelectTrip(terminalFiltered[0]);
            } else {
                setLoading(false);
            }
        } else if (terminalFiltered.length > 0) {
            handleSelectTrip(terminalFiltered[0]);
        } else {
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
                    <p className="text-sm text-muted-foreground">View and print complete passenger lists for departure trips.</p>
                </div>

                <div className="flex items-center gap-3">
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
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-muted-foreground">Loading passenger manifest...</div>
            ) : selectedTrip ? (
                <PassengerManifest trip={selectedTrip} bookings={bookings} />
            ) : (
                <Card className="p-8 text-center text-muted-foreground">Please select a trip schedule to view its manifest.</Card>
            )}
        </div>
    );
}
