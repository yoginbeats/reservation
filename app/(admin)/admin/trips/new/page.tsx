"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, MapPin, Bus, Calendar, DollarSign, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getBusesAction } from "@/app/actions/bus";
import { addTripAction } from "@/app/actions/trip";

export default function NewTripPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(false);
    const [buses, setBuses] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        origin: "",
        destination: "",
        bus_id: "",
        departure_time: "",
        price: ""
    });

    useEffect(() => {
        const fetchBuses = async () => {
            const result = await getBusesAction();
            if (result.success && result.data) {
                setBuses(result.data);
            }
        };
        fetchBuses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await addTripAction({
                ...formData,
                price: parseFloat(formData.price)
            });

            if (!result.success) throw new Error(result.error);

            toast.success("Trip scheduled successfully!");
            router.push("/admin/trips");
            router.refresh();
        } catch (error: any) {
            console.error("Error adding trip:", error);
            toast.error("Error adding trip: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Link
                href="/admin/trips"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Trips
            </Link>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Add New Trip</h1>
                <p className="text-muted-foreground italic">Schedule a new journey for Superlines.</p>
            </div>

            <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl">
                <CardHeader>
                    <CardTitle>Trip Details</CardTitle>
                    <CardDescription>Fill in the information below to create a new trip schedule.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="origin" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-red-600" />
                                    Origin
                                </Label>
                                <select
                                    id="origin"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                    required
                                    className="w-full h-10 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 appearance-none"
                                >
                                    <option value="" disabled>Select origin</option>
                                    <option value="Cubao">Cubao</option>
                                    <option value="PITX">PITX</option>
                                    <option value="Daet">Daet</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="destination" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-red-600" />
                                    Destination
                                </Label>
                                <select
                                    id="destination"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                    required
                                    className="w-full h-10 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 appearance-none"
                                >
                                    <option value="" disabled>Select destination</option>
                                    <option value="Cubao">Cubao</option>
                                    <option value="PITX">PITX</option>
                                    <option value="Daet">Daet</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bus_id" className="flex items-center gap-2">
                                <Bus className="h-4 w-4 text-blue-600" />
                                Assigned Bus
                            </Label>
                            <select
                                id="bus_id"
                                value={formData.bus_id}
                                onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                                required
                                className="w-full h-10 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 appearance-none"
                            >
                                <option value="">Select a bus</option>
                                {buses.map((bus) => (
                                    <option key={bus.id} value={bus.id}>
                                        {bus.bus_number} - {bus.bus_type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="departure_time" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-emerald-600" />
                                    Departure Time
                                </Label>
                                <Input
                                    id="departure_time"
                                    type="datetime-local"
                                    value={formData.departure_time}
                                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price" className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-amber-600" />
                                    Price (₱)
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    className="rounded-xl"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            Save Trip Schedule
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
