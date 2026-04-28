"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Ticket as TicketIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NewTicketButton({
    title = "New Ticket",
    className = "bg-red-600 hover:bg-red-700",
    icon = <Plus className="mr-2 h-4 w-4" />
}: {
    title?: string;
    className?: string;
    icon?: React.ReactNode;
} = {}) {
    const supabase = createClient();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingTrips, setIsFetchingTrips] = useState(false);
    const [trips, setTrips] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        tripId: "",
        passengerName: "",
        seatNumber: "",
        type: "regular",
    });

    // Fetch upcoming trips when dialog opens
    useEffect(() => {
        if (isOpen) {
            const fetchTrips = async () => {
                setIsFetchingTrips(true);
                const { data } = await supabase
                    .from('trips')
                    .select(`
                        id,
                        origin,
                        destination,
                        departure_time,
                        price,
                        buses (bus_type)
                    `)
                    .gt('departure_time', new Date().toISOString())
                    .order('departure_time', { ascending: true });

                if (data) setTrips(data);
                setIsFetchingTrips(false);
            };
            fetchTrips();
        }
    }, [isOpen, supabase]);

    const selectedTrip = trips.find(t => t.id === formData.tripId);
    
    // Calculate price
    let calculatedPrice = 0;
    if (selectedTrip) {
        calculatedPrice = formData.type === 'regular' 
            ? selectedTrip.price 
            : selectedTrip.price * 0.8;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip) return;

        setIsLoading(true);

        try {
            // Check if seat is already taken
            const { data: existingSeat } = await supabase
                .from('reservations')
                .select('id')
                .eq('trip_id', formData.tripId)
                .eq('seat_number', formData.seatNumber)
                .not('status', 'eq', 'cancelled')
                .single();

            if (existingSeat) {
                toast.error(`Seat ${formData.seatNumber} is already reserved for this trip.`);
                setIsLoading(false);
                return;
            }

            // Get admin user ID
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('reservations')
                .insert({
                    trip_id: formData.tripId,
                    customer_id: user?.id || null, // Will be admin's ID
                    seat_number: formData.seatNumber,
                    passenger_name: formData.passengerName,
                    total_price: calculatedPrice,
                    status: 'confirmed'
                });

            if (error) throw error;

            toast.success("Ticket issued successfully!");
            setIsOpen(false);
            setFormData({
                tripId: "",
                passengerName: "",
                seatNumber: "",
                type: "regular",
            });
            router.refresh();
        } catch (error: any) {
            console.error("Error issuing ticket:", error);
            toast.error("Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className={className}>
                    {icon}
                    {title}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TicketIcon className="h-5 w-5 text-red-600" />
                            Issue New Ticket
                        </DialogTitle>
                        <DialogDescription>
                            Directly issue a confirmed ticket for a passenger (e.g. counter sales).
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="tripId" className="text-xs font-bold uppercase tracking-tight text-zinc-500">1. Select Trip Route</Label>
                            {isFetchingTrips ? (
                                <div className="h-10 border rounded-md px-3 py-2 flex items-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading upcoming trips...
                                </div>
                            ) : (
                                <select
                                    id="tripId"
                                    value={formData.tripId}
                                    onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                                    required
                                    className="w-full h-10 rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 dark:border-zinc-800 dark:bg-zinc-950 appearance-none"
                                >
                                    <option value="" disabled>Select a scheduled trip</option>
                                    {trips.map((trip) => {
                                        const date = new Date(trip.departure_time);
                                        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        
                                        return (
                                            <option key={trip.id} value={trip.id}>
                                                {trip.origin} to {trip.destination} ({dateStr} {timeStr}) - {trip.buses?.bus_type}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="passengerName" className="text-xs font-bold uppercase tracking-tight text-zinc-500">2. Passenger Name</Label>
                                <Input
                                    id="passengerName"
                                    placeholder="Juan Dela Cruz"
                                    value={formData.passengerName}
                                    onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                                    required
                                    className="focus-visible:ring-red-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seatNumber" className="text-xs font-bold uppercase tracking-tight text-zinc-500">3. Seat Assignment</Label>
                                <Input
                                    id="seatNumber"
                                    type="number"
                                    min="1"
                                    max="50"
                                    placeholder="e.g. 12"
                                    value={formData.seatNumber}
                                    onChange={(e) => setFormData({ ...formData, seatNumber: e.target.value })}
                                    required
                                    className="focus-visible:ring-red-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-xs font-bold uppercase tracking-tight text-zinc-500">4. Ticket Type</Label>
                            <select
                                id="type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full h-10 rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 dark:border-zinc-800 dark:bg-zinc-950 appearance-none"
                            >
                                <option value="regular">Regular Fare (No Discount)</option>
                                <option value="student">Student (20% Off)</option>
                                <option value="senior">Senior Citizen (20% Off)</option>
                                <option value="pwd">PWD (20% Off)</option>
                            </select>
                        </div>

                        {selectedTrip && (
                            <div className="mt-2 rounded-xl bg-red-50 p-4 border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-red-800/60 dark:text-red-200/60 font-bold uppercase tracking-tight">Base Fare</span>
                                    <span className="text-red-900 dark:text-red-100 font-bold">₱{selectedTrip.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-red-200 dark:border-red-800/30">
                                    <span className="text-red-900 dark:text-red-100 font-black uppercase tracking-tight">Total Payment Due</span>
                                    <span className="text-2xl font-black text-red-600">₱{calculatedPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !formData.tripId} className="bg-red-600 hover:bg-red-700 text-white font-bold tracking-tight">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketIcon className="mr-2 h-4 w-4" />}
                            Issue Ticket
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
