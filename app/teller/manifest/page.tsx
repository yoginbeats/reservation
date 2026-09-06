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

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('trips')
            .select(`
                id,
                departure_time,
                fare_amount,
                bus:buses(bus_number, bus_type),
                route:routes(
                    origin:origin_terminal_id(name),
                    destination:destination_terminal_id(name)
                )
            `)
            .order('departure_time', { ascending: true });

        if (data) {
            setTrips(data);
            if (initialTripId) {
                const found = data.find(t => t.id === initialTripId);
                if (found) handleSelectTrip(found);
            } else if (data.length > 0) {
                handleSelectTrip(data[0]);
            }
        }
        setLoading(false);
    };

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
                ticket:tickets(qr_token, ticket_status)
            `)
            .eq('trip_id', trip.id)
            .order('seat_number', { ascending: true });

        if (bookingsData) {
            setBookings(bookingsData as any);
        }
        setLoading(false);
    };

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
