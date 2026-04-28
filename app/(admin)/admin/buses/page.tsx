"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, Pencil, Check, X, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { getBusesAction, addBusAction, updateBusAction, deleteBusAction, deleteAllBusesAction } from "@/app/actions/bus";

type BusRow = {
    id: string;
    bus_number: string;
    bus_type: string;
    capacity: number;
};

const BUS_TYPES = ["Regular Aircon", "First Class", "Ordinary", "Deluxe"];

export default function BusesAdminPage() {
    const supabase = createClient();
    const [buses, setBuses] = useState<BusRow[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<BusRow>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newBus, setNewBus] = useState({ bus_number: "", bus_type: "Regular Aircon", capacity: 49 });
    const [isLoadingAdd, setIsLoadingAdd] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

    const fetchBuses = async () => {
        const result = await getBusesAction();
        if (result.success && result.data) {
            setBuses(result.data);
        } else {
            toast.error("Failed to load buses: " + result.error);
        }
    };

    useEffect(() => { fetchBuses(); }, []);

    const startEdit = (bus: BusRow) => {
        setEditingId(bus.id);
        setEditValues({ bus_number: bus.bus_number, bus_type: bus.bus_type, capacity: bus.capacity });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValues({});
    };

    const saveEdit = async (id: string) => {
        setIsSaving(true);
        const result = await updateBusAction(id, editValues);

        if (!result.success) {
            toast.error("Failed to update bus: " + result.error);
        } else {
            toast.success("Bus updated successfully!");
            setEditingId(null);
            setEditValues({});
            await fetchBuses();
        }
        setIsSaving(false);
    };

    const addBus = async () => {
        if (!newBus.bus_number.trim()) return;
        setIsLoadingAdd(true);
        const result = await addBusAction(newBus);
        if (!result.success) {
            toast.error("Failed to add bus: " + result.error);
        } else {
            toast.success(`Bus ${newBus.bus_number} added!`);
            setNewBus({ bus_number: "", bus_type: "Regular Aircon", capacity: 49 });
            setIsAdding(false);
            await fetchBuses();
        }
        setIsLoadingAdd(false);
    };

    const deleteBus = async (id: string, busNumber: string) => {
        if (!confirm(`Are you sure you want to delete bus ${busNumber}? This may affect existing trips.`)) return;

        const result = await deleteBusAction(id);
        if (!result.success) {
            toast.error("Failed to delete bus: " + result.error);
        } else {
            toast.success(`Bus ${busNumber} deleted.`);
            await fetchBuses();
        }
    };

    const deleteAllBuses = async () => {
        if (buses.length === 0) return;
        setIsDeletingAll(true);

        try {
            const result = await deleteAllBusesAction();

            if (!result.success) {
                toast.error("Failed to delete all buses: " + result.error);
            } else {
                toast.success("All buses, trips, and reservations have been cleared.");
                await fetchBuses();
            }
        } catch (err) {
            toast.error("An unexpected error occurred.");
            console.error(err);
        } finally {
            setIsDeletingAll(false);
            setShowDeleteAllDialog(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Buses</h1>
                    <p className="text-muted-foreground italic">Edit bus numbers, types, and capacity.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 transition-all disabled:opacity-50"
                        onClick={() => setShowDeleteAllDialog(true)}
                        disabled={buses.length === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Bus
                    </Button>
                </div>
            </div>

            {/* Add New Bus Form */}
            {isAdding && (
                <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base">New Bus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-1">
                                <Label>Bus Number</Label>
                                <Input
                                    placeholder="e.g. SL-AC-102"
                                    value={newBus.bus_number}
                                    onChange={(e) => setNewBus({ ...newBus, bus_number: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Bus Type</Label>
                                <select
                                    value={newBus.bus_type}
                                    onChange={(e) => setNewBus({ ...newBus, bus_type: e.target.value })}
                                    className="w-full h-10 rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
                                >
                                    {BUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label>Capacity</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={newBus.capacity}
                                    onChange={(e) => setNewBus({ ...newBus, capacity: parseInt(e.target.value) })}
                                    className="rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button onClick={addBus} disabled={isLoadingAdd} className="bg-blue-600 hover:bg-blue-700">
                                {isLoadingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                Save Bus
                            </Button>
                            <Button variant="outline" onClick={() => setIsAdding(false)}>
                                <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bus List */}
            <div className="grid gap-4">
                {buses.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center text-muted-foreground">
                            No buses found. Add one above or run the seed SQL script.
                        </CardContent>
                    </Card>
                )}
                {buses.map((bus) => {
                    const isEditing = editingId === bus.id;
                    return (
                        <Card key={bus.id} className="overflow-hidden shadow-sm">
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x dark:divide-zinc-800">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center p-5 bg-zinc-50 dark:bg-zinc-900/50 sm:w-16">
                                        <Bus className="h-6 w-6 text-blue-600" />
                                    </div>

                                    {/* Fields */}
                                    <div className="flex-1 p-5">
                                        {isEditing ? (
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Bus Number</Label>
                                                    <Input
                                                        value={editValues.bus_number ?? ""}
                                                        onChange={(e) => setEditValues({ ...editValues, bus_number: e.target.value })}
                                                        className="rounded-xl h-9 font-mono font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Bus Type</Label>
                                                    <select
                                                        value={editValues.bus_type ?? ""}
                                                        onChange={(e) => setEditValues({ ...editValues, bus_type: e.target.value })}
                                                        className="w-full h-9 rounded-xl border border-zinc-200 bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
                                                    >
                                                        {BUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Capacity</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={editValues.capacity ?? 0}
                                                        onChange={(e) => setEditValues({ ...editValues, capacity: parseInt(e.target.value) })}
                                                        className="rounded-xl h-9"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bus Number</p>
                                                    <p className="font-mono font-black text-lg">{bus.bus_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</p>
                                                    <span className="inline-block mt-0.5 rounded-md bg-blue-50 px-2 py-0.5 text-sm font-bold text-blue-600 dark:bg-blue-900/20">{bus.bus_type}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Capacity</p>
                                                    <p className="font-bold text-lg">{bus.capacity} <span className="text-xs text-zinc-400 font-normal">seats</span></p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 sm:w-48">
                                        {isEditing ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => saveEdit(bus.id)}
                                                    disabled={isSaving}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                >
                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button size="sm" variant="outline" onClick={() => startEdit(bus)}>
                                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
                                                    onClick={() => deleteBus(bus.id, bus.bus_number)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Delete All Confirmation Dialog */}
            <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            WARNING: Delete All Buses
                        </DialogTitle>
                        <DialogDescription>
                            Are you absolutely sure you want to delete ALL buses? This will also permanently remove all associated trips and reservations. This action CANNOT be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)} disabled={isDeletingAll}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteAllBuses} disabled={isDeletingAll}>
                            {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Yes, Delete Everything
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
