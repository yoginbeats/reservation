"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Bus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminBusesPage() {
    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [busNumber, setBusNumber] = useState("");
    const [busType, setBusType] = useState("AIRCON");
    const [capacity, setCapacity] = useState(45);
    const supabase = createClient();

    const fetchBuses = async () => {
        setLoading(true);
        const { data } = await supabase.from('buses').select('*').order('bus_number');
        if (data) setBuses(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchBuses();
    }, []);

    const handleCreateBus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!busNumber) return;

        await supabase.from('buses').insert({
            bus_number: busNumber,
            bus_type: busType,
            seat_capacity: capacity,
            status: 'ACTIVE',
        });
        setBusNumber("");
        setOpenModal(false);
        fetchBuses();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bus Fleet Management</h1>
                    <p className="text-muted-foreground">Manage bus units, seating capacities, and active status.</p>
                </div>

                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Bus
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Bus Unit</DialogTitle>
                            <DialogDescription>Register a new bus to the Superlines fleet.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateBus} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="bNum">Bus Number</Label>
                                <Input id="bNum" required placeholder="e.g. BUS-104" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bType">Bus Type</Label>
                                <select id="bType" className="w-full rounded-md border p-2 bg-background" value={busType} onChange={(e) => setBusType(e.target.value)}>
                                    <option value="STANDARD">Standard</option>
                                    <option value="AIRCON">Aircon Express</option>
                                    <option value="DELUXE">Deluxe</option>
                                    <option value="SUPER_DELUXE">Super Deluxe</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bCap">Seat Capacity</Label>
                                <Input id="bCap" type="number" required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Register Bus</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Superlines Fleet</CardTitle>
                    <CardDescription>Bus units available for trip assignment.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading fleet...</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50 text-xs font-semibold uppercase">
                                    <tr className="text-left">
                                        <th className="p-4">Bus Number</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Seat Capacity</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buses.map((b) => (
                                        <tr key={b.id} className="border-b hover:bg-muted/40">
                                            <td className="p-4 font-bold flex items-center gap-2">
                                                <Bus className="h-4 w-4 text-blue-600" />
                                                {b.bus_number}
                                            </td>
                                            <td className="p-4">{b.bus_type}</td>
                                            <td className="p-4 font-mono">{b.seat_capacity} Seats</td>
                                            <td className="p-4">
                                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                    {b.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
