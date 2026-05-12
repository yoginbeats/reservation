"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar, Bus, ArrowRight, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getTripsAction } from "@/app/actions/trip";

export default function WalkInBookingPage() {
    const supabase = createClient();
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTrips = async () => {
        setIsLoading(true);
        const result = await getTripsAction();

        if (result.success && result.data) {
            // Filter to only show upcoming trips
            const now = new Date();
            const upcoming = result.data.filter((t: any) => new Date(t.departure_time) > now);
            setTrips(upcoming);
        } else {
            toast.error("Error loading trips: " + result.error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Walk-in Bookings</h1>
                    <p className="text-muted-foreground italic">Select an upcoming trip to process a walk-in passenger.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {trips && trips.length > 0 ? (
                    trips.map((trip: any) => {
                        const departureDate = new Date(trip.departure_time);
                        return (
                            <Card key={trip.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-zinc-800">
                                        {/* Route Info */}
                                        <div className="flex-1 p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                                        <MapPin className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-lg">{trip.origin}</span>
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-bold text-lg">{trip.destination}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Trip ID: {trip.id.slice(0, 8).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-red-600">₱{trip.price.toLocaleString()}</div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Fare Price</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{departureDate.toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Bus className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{trip.buses?.bus_number} ({trip.buses?.bus_type})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 flex flex-col items-center justify-center gap-3 md:w-64">
                                            <Link href={`/admin/walk-in/${trip.id}`} className="w-full">
                                                <Button
                                                    className="w-full bg-red-600 hover:bg-red-700 font-bold shadow-md"
                                                >
                                                    <Users className="mr-2 h-4 w-4" />
                                                    Add Walk-in
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="py-20 text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center dark:bg-zinc-800">
                                <Calendar className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold">No upcoming trips</h3>
                                <p className="text-muted-foreground">There are no future trips scheduled to add walk-in passengers.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
