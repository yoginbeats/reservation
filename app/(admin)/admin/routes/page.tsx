"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Route, Plus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminRoutesPage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [terminals, setTerminals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [originId, setOriginId] = useState("");
    const [destId, setDestId] = useState("");
    const [distance, setDistance] = useState("340");
    const supabase = createClient();

    const fetchTerminals = async () => {
        const { data } = await supabase.from('terminals').select('*').order('name');
        if (data) {
            setTerminals(data);
            if (data.length >= 2) {
                setOriginId(data[0].id);
                setDestId(data[1].id);
            }
        }
    };

    const fetchRoutes = async () => {
        setLoading(true);
        const { data } = await supabase.from('routes').select(`
            id,
            distance_km,
            estimated_hours,
            status,
            origin:origin_terminal_id(name),
            destination:destination_terminal_id(name)
        `);
        if (data) setRoutes(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRoutes();
        fetchTerminals();
    }, []);

    const handleCreateRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!originId || !destId || originId === destId) {
            alert("Origin and Destination must be different terminals.");
            return;
        }

        await supabase.from('routes').insert({
            origin_terminal_id: originId,
            destination_terminal_id: destId,
            distance_km: Number(distance),
            estimated_hours: 8.0,
            status: 'ACTIVE',
        });
        setOpenModal(false);
        fetchRoutes();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Route Management</h1>
                    <p className="text-muted-foreground">Configure travel routes between terminals (e.g. Cubao ➔ Daet, Daet ➔ PITX).</p>
                </div>

                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Route
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Travel Route</DialogTitle>
                            <DialogDescription>Define origin and destination terminals for bus trips.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateRoute} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="rOrigin">Origin Terminal</Label>
                                <select id="rOrigin" className="w-full rounded-md border p-2 bg-background" value={originId} onChange={(e) => setOriginId(e.target.value)}>
                                    {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rDest">Destination Terminal</Label>
                                <select id="rDest" className="w-full rounded-md border p-2 bg-background" value={destId} onChange={(e) => setDestId(e.target.value)}>
                                    {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rDist">Distance (km)</Label>
                                <Input id="rDist" type="number" required value={distance} onChange={(e) => setDistance(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Create Route</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Superlines Active Routes</CardTitle>
                    <CardDescription>Bus travel paths connecting terminals.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading routes...</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50 text-xs font-semibold uppercase">
                                    <tr className="text-left">
                                        <th className="p-4">Route Path</th>
                                        <th className="p-4">Distance</th>
                                        <th className="p-4">Est. Duration</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes.map((r) => (
                                        <tr key={r.id} className="border-b hover:bg-muted/40">
                                            <td className="p-4 font-bold flex items-center gap-2">
                                                <span>{r.origin?.name}</span>
                                                <ArrowRight className="h-4 w-4 text-blue-600" />
                                                <span>{r.destination?.name}</span>
                                            </td>
                                            <td className="p-4 font-mono">{r.distance_km} km</td>
                                            <td className="p-4 font-mono">{r.estimated_hours || 8} hrs</td>
                                            <td className="p-4">
                                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                    {r.status}
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
