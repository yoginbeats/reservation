"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
    Bus,
    Plus,
    Search,
    Download,
    Printer,
    RefreshCw,
    Wrench,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    ShieldAlert
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminBusesPage() {
    const [buses, setBuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [busNumber, setBusNumber] = useState("");
    const [busType, setBusType] = useState("AIRCON");
    const [capacity, setCapacity] = useState(45);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const supabase = createClient();

    const fetchBuses = async () => {
        setRefreshing(true);
        let busData: any[] = [];
        try {
            const { data } = await supabase.from('buses').select('*').order('bus_number');
            if (data && data.length > 0) {
                busData = data;
            } else {
                busData = [
                    { id: "b1", bus_number: "BUS-101", bus_type: "AIRCON", seat_capacity: 45, status: "ACTIVE" },
                    { id: "b2", bus_number: "BUS-102", bus_type: "SUPER_DELUXE", seat_capacity: 45, status: "ACTIVE" },
                    { id: "b3", bus_number: "BUS-103", bus_type: "DELUXE", seat_capacity: 45, status: "ACTIVE" },
                    { id: "b4", bus_number: "SL-501", bus_type: "AIRCON", seat_capacity: 45, status: "ACTIVE" },
                    { id: "b5", bus_number: "SL-702", bus_type: "AIRCON", seat_capacity: 45, status: "MAINTENANCE" },
                    { id: "b6", bus_number: "SL-808", bus_type: "DELUXE", seat_capacity: 45, status: "ACTIVE" },
                    { id: "b7", bus_number: "DAET-204", bus_type: "AIRCON", seat_capacity: 45, status: "ACTIVE" },
                ];
            }
        } catch {
            busData = [
                { id: "b1", bus_number: "BUS-101", bus_type: "AIRCON", seat_capacity: 45, status: "ACTIVE" },
                { id: "b2", bus_number: "BUS-102", bus_type: "SUPER_DELUXE", seat_capacity: 45, status: "ACTIVE" },
                { id: "b3", bus_number: "BUS-103", bus_type: "DELUXE", seat_capacity: 45, status: "ACTIVE" },
            ];
        }
        setBuses(busData);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchBuses();
    }, []);

    const handleCreateBus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!busNumber.trim()) return;

        const cleanNum = busNumber.trim().toUpperCase();
        try {
            await supabase.from('buses').insert({
                bus_number: cleanNum,
                bus_type: busType,
                seat_capacity: capacity,
                status: 'ACTIVE',
            });
        } catch {}

        setBusNumber("");
        setOpenModal(false);
        fetchBuses();
    };

    const handleToggleStatus = async (busId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : currentStatus === 'MAINTENANCE' ? 'INACTIVE' : 'ACTIVE';
        setActionLoadingId(busId);
        try {
            await supabase.from('buses').update({ status: nextStatus }).eq('id', busId);
            setBuses(prev => prev.map(b => b.id === busId ? { ...b, status: nextStatus } : b));
        } catch {}
        setActionLoadingId(null);
    };

    const handleExportCSV = () => {
        const headers = ["Bus Number", "Bus Type", "Seat Capacity", "Operational Status"];
        const rows = buses.map(b => [
            `"${b.bus_number}"`,
            `"${b.bus_type}"`,
            b.seat_capacity || 45,
            `"${b.status}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Superlines_Bus_Fleet_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredBuses = buses.filter(b => {
        const matchesQuery = !searchQuery || b.bus_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || b.bus_type === typeFilter;
        return matchesQuery && matchesStatus && matchesType;
    });

    const activeCount = buses.filter(b => b.status === 'ACTIVE').length;
    const maintenanceCount = buses.filter(b => b.status === 'MAINTENANCE').length;
    const totalCapacity = buses.reduce((sum, b) => sum + (Number(b.seat_capacity) || 45), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                        <Bus className="h-8 w-8 text-blue-600" />
                        Bus Fleet Management
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage active bus chassis, maintenance rotations, seating capacities, and vehicle readiness.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 font-bold"
                    >
                        <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
                        Export Fleet (CSV)
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="font-bold"
                    >
                        <Printer className="mr-1.5 h-4 w-4" />
                        Print Roster
                    </Button>

                    <Dialog open={openModal} onOpenChange={setOpenModal}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
                                <Plus className="mr-1.5 h-4 w-4" /> Add Bus Unit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Register New Bus Unit</DialogTitle>
                                <DialogDescription>Add a new vehicle chassis to the official Superlines transport fleet.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateBus} className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bNum">Bus Unit Number / Body #</Label>
                                    <Input
                                        id="bNum"
                                        required
                                        placeholder="e.g. BUS-105, SL-901"
                                        value={busNumber}
                                        onChange={(e) => setBusNumber(e.target.value.toUpperCase())}
                                        className="uppercase font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bType">Bus Class / Specification</Label>
                                    <select
                                        id="bType"
                                        className="w-full rounded-md border p-2 bg-background text-sm font-medium"
                                        value={busType}
                                        onChange={(e) => setBusType(e.target.value)}
                                    >
                                        <option value="STANDARD">Standard Class</option>
                                        <option value="AIRCON">Aircon Express (2x2 Reclining)</option>
                                        <option value="DELUXE">Deluxe Class (Wi-Fi, USB Charging)</option>
                                        <option value="SUPER_DELUXE">Super Deluxe (Comfort 2x1 Class)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bCap">Official Passenger Seat Capacity</Label>
                                    <Input
                                        id="bCap"
                                        type="number"
                                        required
                                        value={capacity}
                                        onChange={(e) => setCapacity(Number(e.target.value))}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 font-bold">
                                        Register Vehicle
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Official Printable Header */}
            <div className="hidden print:block border-b-2 border-black pb-4 text-black font-sans">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase text-red-700 tracking-wider">SUPERLINES TRANSPORTATION CO., INC.</h1>
                        <p className="text-xs font-bold uppercase tracking-tight">Fleet Engineering & Mechanical Dispatch Roster</p>
                    </div>
                    <div className="text-right text-[10px] font-mono">
                        <p>FLEET AUDIT DATE: {new Date().toLocaleDateString()}</p>
                        <p>TOTAL REGISTERED BUSES: {buses.length}</p>
                    </div>
                </div>
            </div>

            {/* Fleet Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                <Card className="border-l-4 border-l-blue-600 shadow-sm">
                    <CardHeader className="py-2.5 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center justify-between">
                            <span>Total Fleet Units</span>
                            <Bus className="h-4 w-4 text-blue-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-blue-600">{buses.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Registered provincial buses</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-600 shadow-sm">
                    <CardHeader className="py-2.5 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center justify-between">
                            <span>Active on Road</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Ready for departure assignment</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-600 shadow-sm">
                    <CardHeader className="py-2.5 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center justify-between">
                            <span>Under Maintenance</span>
                            <Wrench className="h-4 w-4 text-amber-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-amber-600">{maintenanceCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">In depot inspection / PMS</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600 shadow-sm">
                    <CardHeader className="py-2.5 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground flex items-center justify-between">
                            <span>Total Fleet Capacity</span>
                            <Bus className="h-4 w-4 text-purple-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-purple-600">{totalCapacity}</div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Combined passenger seats</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Search Bar */}
            <Card className="border shadow-sm print:hidden">
                <CardContent className="p-3 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search bus number (e.g. BUS-101, SL-501)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
                        >
                            <option value="ALL">All Operational Statuses</option>
                            <option value="ACTIVE">ACTIVE (Dispatched)</option>
                            <option value="MAINTENANCE">MAINTENANCE (Depot)</option>
                            <option value="INACTIVE">INACTIVE</option>
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
                        >
                            <option value="ALL">All Bus Types</option>
                            <option value="AIRCON">Aircon Express</option>
                            <option value="DELUXE">Deluxe</option>
                            <option value="SUPER_DELUXE">Super Deluxe</option>
                            <option value="STANDARD">Standard</option>
                        </select>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchBuses}
                            disabled={refreshing}
                            className="h-9 text-xs px-2 text-muted-foreground"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bus Table */}
            <Card>
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold">Registered Vehicle Roster ({filteredBuses.length})</CardTitle>
                        <CardDescription className="text-xs">Active fleet assigned to Daet, Cubao, and PITX routes.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="text-xs">Loading fleet units...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="border-b bg-muted/50 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                                    <tr className="text-left">
                                        <th className="p-3">Bus Number</th>
                                        <th className="p-3">Bus Specification / Class</th>
                                        <th className="p-3 text-center">Seat Capacity</th>
                                        <th className="p-3 text-center">Operational Status</th>
                                        <th className="p-3 text-right print:hidden">Quick Status Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y font-mono">
                                    {filteredBuses.map((b) => {
                                        const isActive = b.status === 'ACTIVE';
                                        const isMaint = b.status === 'MAINTENANCE';

                                        return (
                                            <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                                                <td className="p-3 font-bold font-sans flex items-center gap-2 text-foreground">
                                                    <Bus className={`h-4 w-4 ${isActive ? "text-blue-600" : isMaint ? "text-amber-500" : "text-zinc-400"}`} />
                                                    <span className="font-mono text-sm">{b.bus_number}</span>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{b.bus_type}</td>
                                                <td className="p-3 text-center font-bold">{b.seat_capacity || 45} Seats</td>
                                                <td className="p-3 text-center">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                                                        isActive
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                                                            : isMaint
                                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-300"
                                                    }`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right print:hidden">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleToggleStatus(b.id, b.status)}
                                                        disabled={actionLoadingId === b.id}
                                                        className="h-7 text-[11px] font-bold px-2.5"
                                                    >
                                                        {isActive ? "Set Maintenance" : isMaint ? "Set Inactive" : "Set Active"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Official Print Signatures Block */}
            <div className="hidden print:grid grid-cols-2 gap-12 text-xs border-t-2 border-black pt-6 mt-8 text-black font-sans">
                <div>
                    <p className="font-bold uppercase tracking-wider text-[11px]">Inspected By (Depot Master):</p>
                    <div className="mt-12 border-b-2 border-black w-64"></div>
                    <p className="mt-1 font-bold text-xs">CHIEF MECHANICAL ENGINEER</p>
                    <p className="text-[10px] text-zinc-600">Superlines Fleet Maintenance Depot</p>
                </div>
                <div>
                    <p className="font-bold uppercase tracking-wider text-[11px]">Approved for Route Dispatch:</p>
                    <div className="mt-12 border-b-2 border-black w-64"></div>
                    <p className="mt-1 font-bold text-xs">OPERATIONS DISPATCH MANAGER</p>
                    <p className="text-[10px] text-zinc-600">Superlines Central Terminal Office</p>
                </div>
            </div>
        </div>
    );
}
