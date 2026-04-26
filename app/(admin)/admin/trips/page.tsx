"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Clock, Calendar, Bus, ArrowRight, MoreVertical, Trash2, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function TripsAdminPage() {
    const supabase = createClient();
    const [trips, setTrips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tripToDelete, setTripToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

    const fetchTrips = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('trips')
            .select(`
                *,
                buses (*)
            `)
            .order('departure_time', { ascending: true });

        if (data) setTrips(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const deleteTrip = async () => {
        if (!tripToDelete) return;
        setIsDeleting(true);

        const { error } = await supabase.from('trips').delete().eq('id', tripToDelete);
        
        setIsDeleting(false);
        setTripToDelete(null);

        if (error) {
            toast.error("Error cancelling trip: " + error.message);
        } else {
            toast.success("Trip cancelled successfully.");
            fetchTrips();
        }
    };

    const deleteAllTrips = async () => {
        if (trips.length === 0) return;
        setIsDeletingAll(true);

        const tripIds = trips.map((t: any) => t.id);
        const { error } = await supabase.from('trips').delete().in('id', tripIds);
        
        setIsDeletingAll(false);
        setShowDeleteAllDialog(false);

        if (error) {
            toast.error("Error deleting all trips: " + error.message);
        } else {
            toast.success("All trips have been deleted successfully.");
            fetchTrips();
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight">Trip Schedules</h1>
                    <p className="text-muted-foreground italic">Manage bus routes, schedules, and pricing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="destructive" 
                        className="bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50"
                        onClick={() => setShowDeleteAllDialog(true)}
                        disabled={trips.length === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All Trips
                    </Button>
                    <Link href="/admin/trips/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 transition-all">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Trip
                        </Button>
                    </Link>
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
                                        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 flex items-center justify-center gap-3">
                                            <Link href={`/admin/trips/${trip.id}/manifest`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-white hover:bg-zinc-50 border-zinc-200 font-bold"
                                                >
                                                    View Manifest
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/trips/${trip.id}/edit`}>
                                                <Button variant="outline" size="sm">Edit Schedule</Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setTripToDelete(trip.id)}
                                            >
                                                Cancel Trip
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
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
                                <h3 className="text-xl font-bold">No trips scheduled</h3>
                                <p className="text-muted-foreground">Start by creating a new trip schedule for Superlines.</p>
                            </div>
                            <Button className="bg-blue-600">Add First Trip</Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Cancel Trip Confirmation Dialog */}
            <Dialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Cancellation
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this trip? This action cannot be undone and will affect any existing reservations for this schedule.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setTripToDelete(null)} disabled={isDeleting}>
                            Keep Trip
                        </Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteTrip} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Yes, Cancel Trip
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete All Trips Confirmation Dialog */}
            <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            WARNING: Delete All Trips
                        </DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to delete ALL scheduled trips? This will permanently remove {trips.length} trip{trips.length !== 1 ? 's' : ''} from the database. This action CANNOT be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)} disabled={isDeletingAll}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteAllTrips} disabled={isDeletingAll}>
                            {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Yes, Delete All Trips
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
