"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminTerminalsPage() {
    const [terminals, setTerminals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const supabase = createClient();

    const fetchTerminals = async () => {
        setLoading(true);
        const { data } = await supabase.from('terminals').select('*').order('name');
        if (data) setTerminals(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTerminals();
    }, []);

    const handleCreateTerminal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !location) return;

        await supabase.from('terminals').insert({ name, location, status: 'ACTIVE' });
        setName("");
        setLocation("");
        setOpenModal(false);
        fetchTerminals();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Terminal Management</h1>
                    <p className="text-muted-foreground">Manage Superlines terminal stations (Daet, PITX, Cubao).</p>
                </div>

                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Terminal
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Terminal Station</DialogTitle>
                            <DialogDescription>Create a new terminal location in the centralized database.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTerminal} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="tName">Terminal Name</Label>
                                <Input id="tName" required placeholder="e.g. Daet, PITX, Cubao" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tLoc">Location Address</Label>
                                <Input id="tLoc" required placeholder="Detailed address" value={location} onChange={(e) => setLocation(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Terminal</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Superlines Terminal Locations</CardTitle>
                    <CardDescription>All terminals share the same centralized database inventory.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading terminals...</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50 text-xs font-semibold uppercase">
                                    <tr className="text-left">
                                        <th className="p-4">Terminal Name</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {terminals.map((t) => (
                                        <tr key={t.id} className="border-b hover:bg-muted/40">
                                            <td className="p-4 font-bold flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-blue-600" />
                                                {t.name}
                                            </td>
                                            <td className="p-4 text-muted-foreground">{t.location}</td>
                                            <td className="p-4">
                                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button size="sm" variant="ghost">Edit</Button>
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
