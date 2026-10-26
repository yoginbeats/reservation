"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
    Clock, 
    Plus, 
    Trash2, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    RefreshCw, 
    Bus, 
    Edit, 
    RotateCcw,
    MapPin,
    CalendarDays
} from "lucide-react";
import {
    getDailySchedulesAction,
    addDailyScheduleAction,
    updateDailyScheduleAction,
    deleteDailyScheduleAction,
    resetDailySchedulesAction,
    DailyScheduleItem
} from "@/app/actions/daily-schedule";

export default function AdminDailySchedulesPage() {
    const [schedules, setSchedules] = useState<DailyScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<DailyScheduleItem | null>(null);

    // Form states
    const [period, setPeriod] = useState<"AM" | "PM" | "FEEDER">("AM");
    const [time, setTime] = useState("");
    const [route, setRoute] = useState("Daet ➔ Cubao - Alabang");
    const [busType, setBusType] = useState("REGULAR AIRCON (A/C)");
    const [busNumber, setBusNumber] = useState("");
    const [via, setVia] = useState("Direct Express");
    const [isActive, setIsActive] = useState(true);
    const [feedback, setFeedback] = useState<string | null>(null);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const res = await getDailySchedulesAction();
            if (res.success && res.data) {
                setSchedules(res.data);
            }
        } catch (err: any) {
            console.error("Failed to load schedules:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, []);

    const resetForm = () => {
        setPeriod("AM");
        setTime("");
        setRoute("Daet ➔ Cubao - Alabang");
        setBusType("REGULAR AIRCON (A/C)");
        setBusNumber("");
        setVia("Direct Express");
        setIsActive(true);
        setEditingItem(null);
        setFeedback(null);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!time.trim() || !route.trim()) {
            setFeedback("Please fill out both Departure Time and Route.");
            return;
        }

        setSubmitting(true);
        setFeedback(null);
        try {
            if (editingItem) {
                // Update
                const res = await updateDailyScheduleAction(editingItem.id, {
                    time: time.trim(),
                    route: route.trim(),
                    bus_type: busType,
                    bus_number: busNumber.trim() || undefined,
                    via: via.trim() || undefined,
                    period,
                    is_active: isActive,
                });
                if (res.success) {
                    setEditingItem(null);
                    setOpenAddModal(false);
                    resetForm();
                    loadSchedules();
                } else {
                    setFeedback(res.error || "Failed to update schedule item");
                }
            } else {
                // Create
                const res = await addDailyScheduleAction({
                    time: time.trim(),
                    route: route.trim(),
                    bus_type: busType,
                    bus_number: busNumber.trim() || undefined,
                    via: via.trim() || undefined,
                    period,
                    is_active: isActive,
                    order_index: schedules.length + 1,
                });

                if (res.success) {
                    setOpenAddModal(false);
                    resetForm();
                    loadSchedules();
                } else {
                    setFeedback(res.error || "Failed to create schedule item");
                }
            }
        } catch (err: any) {
            setFeedback(err?.message || "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: DailyScheduleItem) => {
        setEditingItem(item);
        setPeriod(item.period);
        setTime(item.time);
        setRoute(item.route);
        setBusType(item.bus_type);
        setBusNumber(item.bus_number || "");
        setVia(item.via || "");
        setIsActive(item.is_active);
        setOpenAddModal(true);
    };

    const handleToggleStatus = async (item: DailyScheduleItem) => {
        const newStatus = !item.is_active;
        try {
            await updateDailyScheduleAction(item.id, { is_active: newStatus });
            setSchedules(prev =>
                prev.map(s => (s.id === item.id ? { ...s, is_active: newStatus } : s))
            );
        } catch (err) {
            console.error("Failed to toggle status:", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this departure schedule? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await deleteDailyScheduleAction(id);
            if (res.success) {
                setSchedules(prev => prev.filter(s => s.id !== id));
            } else {
                alert(res.error || "Failed to delete schedule");
            }
        } catch (err: any) {
            alert(err?.message || "Failed to delete schedule");
        }
    };

    const handleResetWhiteboard = async () => {
        if (!confirm("Reset all departures back to the official Daet Terminal Whiteboard schedule? Any custom entries will be restored to defaults.")) {
            return;
        }

        setLoading(true);
        try {
            const res = await resetDailySchedulesAction();
            if (res.success && res.data) {
                setSchedules(res.data);
            }
        } catch (err: any) {
            alert(err?.message || "Failed to reset schedules");
        } finally {
            setLoading(false);
        }
    };

    const amItems = schedules.filter(s => s.period === "AM");
    const pmItems = schedules.filter(s => s.period === "PM");
    const feederItems = schedules.filter(s => s.period === "FEEDER");

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                        <Clock className="h-6 w-6 text-red-600" />
                        <span>Daily Bus Schedules CMS</span>
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Manage static daily bus departures and terminal timetables displayed on the public <strong className="text-zinc-900 font-semibold">/schedules</strong> page.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetWhiteboard}
                        className="font-bold text-xs border-zinc-300 hover:bg-zinc-100"
                        title="Restore original Daet Terminal Whiteboard timetable"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
                        Reset Whiteboard
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={loadSchedules}
                        disabled={loading}
                        className="font-bold text-xs border-zinc-300 hover:bg-zinc-100"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    <Dialog open={openAddModal} onOpenChange={(open) => {
                        setOpenAddModal(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add Departure
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-lg font-black">
                                    <Bus className="h-5 w-5 text-red-600" />
                                    <span>{editingItem ? "Edit Departure Schedule" : "Add New Departure"}</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    This departure will immediately appear on the static <strong className="text-zinc-900">/schedules</strong> timetable page.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreateOrUpdate} className="space-y-4 pt-2">
                                {feedback && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{feedback}</span>
                                    </div>
                                )}

                                {/* Period */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Schedule Period *</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["AM", "PM", "FEEDER"] as const).map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPeriod(p)}
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                                    period === p
                                                        ? "bg-red-600 text-white border-red-600 shadow-xs"
                                                        : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                                                }`}
                                            >
                                                {p === "FEEDER" ? "Feeder / Local" : `${p} Departures`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Departure Time */}
                                <div className="space-y-1">
                                    <Label htmlFor="sched-time" className="text-xs font-bold">Departure Time *</Label>
                                    <Input
                                        id="sched-time"
                                        placeholder="e.g. 5:00 AM, 7:00 PM, or A.M. Service"
                                        required
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                {/* Destination Route */}
                                <div className="space-y-1">
                                    <Label htmlFor="sched-route" className="text-xs font-bold">Destination Route *</Label>
                                    <Input
                                        id="sched-route"
                                        placeholder="e.g. Daet ➔ Cubao - Alabang or Daet ➔ PITX - Cubao"
                                        required
                                        value={route}
                                        onChange={(e) => setRoute(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>

                                {/* Bus Classification */}
                                <div className="space-y-1">
                                    <Label htmlFor="sched-type" className="text-xs font-bold">Bus Classification</Label>
                                    <select
                                        id="sched-type"
                                        value={busType}
                                        onChange={(e) => setBusType(e.target.value)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground outline-none"
                                    >
                                        <option value="REGULAR AIRCON (A/C)">REGULAR AIRCON (A/C)</option>
                                        <option value="FIRST CLASS (F/C) W/ CR">FIRST CLASS (F/C) W/ CR</option>
                                        <option value="AIRCON (A/C) W/ CR">AIRCON (A/C) W/ CR</option>
                                        <option value="ORDINARY">ORDINARY (Non-Aircon)</option>
                                        <option value="FEEDER CONNECTING">FEEDER CONNECTING</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Assigned Bus Unit */}
                                    <div className="space-y-1">
                                        <Label htmlFor="sched-busnum" className="text-xs font-bold">Assigned Bus Unit</Label>
                                        <Input
                                            id="sched-busnum"
                                            placeholder="e.g. Bus 976, Bus 310"
                                            value={busNumber}
                                            onChange={(e) => setBusNumber(e.target.value)}
                                            className="h-9 text-xs font-mono"
                                        />
                                    </div>

                                    {/* Remarks / Via */}
                                    <div className="space-y-1">
                                        <Label htmlFor="sched-via" className="text-xs font-bold">Route Notes / Via</Label>
                                        <Input
                                            id="sched-via"
                                            placeholder="e.g. Via Vinzons, San Vicente"
                                            value={via}
                                            onChange={(e) => setVia(e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900">Active Daily Departure</p>
                                        <p className="text-[11px] text-zinc-500">Visible on the public /schedules timetable</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                                    />
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpenAddModal(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                                    >
                                        {submitting ? "Saving..." : editingItem ? "Update Schedule" : "Add Departure"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4 bg-zinc-50 border-zinc-200">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Total Departures</span>
                    <span className="text-2xl font-black text-zinc-900 mt-1 block">{schedules.length}</span>
                </Card>
                <Card className="p-4 bg-amber-50/50 border-amber-200">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Morning (AM) Trips</span>
                    <span className="text-2xl font-black text-amber-800 mt-1 block">{amItems.length}</span>
                </Card>
                <Card className="p-4 bg-red-50/50 border-red-200">
                    <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">Afternoon (PM) Trips</span>
                    <span className="text-2xl font-black text-red-800 mt-1 block">{pmItems.length}</span>
                </Card>
                <Card className="p-4 bg-blue-50/50 border-blue-200">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Feeder Connections</span>
                    <span className="text-2xl font-black text-blue-800 mt-1 block">{feederItems.length}</span>
                </Card>
            </div>

            {/* Departures Table */}
            <Card className="border border-zinc-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-zinc-50 border-b border-zinc-200 py-3.5 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-red-600" />
                            <span>Daet Central Terminal Daily Roster</span>
                        </CardTitle>
                        <span className="text-xs font-bold text-zinc-500">
                            Live on <code className="bg-zinc-200/80 px-1.5 py-0.5 rounded text-zinc-800">/schedules</code>
                        </span>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-100/70 text-[11px] font-black uppercase tracking-wider text-zinc-600 border-b border-zinc-200">
                            <tr>
                                <th className="py-3 px-4 sm:px-6">Status</th>
                                <th className="py-3 px-4 sm:px-6">Period</th>
                                <th className="py-3 px-4 sm:px-6">Departure Time</th>
                                <th className="py-3 px-4 sm:px-6">Destination Route</th>
                                <th className="py-3 px-4 sm:px-6">Bus Classification</th>
                                <th className="py-3 px-4 sm:px-6">Bus Unit</th>
                                <th className="py-3 px-4 sm:px-6">Route Notes</th>
                                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 font-medium text-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-red-600 border-t-transparent mr-2 align-middle"></div>
                                        <span>Loading departure schedules...</span>
                                    </td>
                                </tr>
                            ) : schedules.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                                        No departures found. Click "Reset Whiteboard" to restore default Daet schedules.
                                    </td>
                                </tr>
                            ) : (
                                schedules.map((s) => (
                                    <tr key={s.id} className="hover:bg-zinc-50/80 transition-colors">
                                        {/* Status */}
                                        <td className="py-3 px-4 sm:px-6">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(s)}
                                                title={s.is_active ? "Click to deactivate" : "Click to activate"}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                                                    s.is_active
                                                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                        : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                                                }`}
                                            >
                                                {s.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                <span>{s.is_active ? "Active" : "Hidden"}</span>
                                            </button>
                                        </td>

                                        {/* Period */}
                                        <td className="py-3 px-4 sm:px-6">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                s.period === "AM"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : s.period === "PM"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-blue-100 text-blue-800"
                                            }`}>
                                                {s.period}
                                            </span>
                                        </td>

                                        {/* Time */}
                                        <td className="py-3 px-4 sm:px-6 font-black font-mono text-zinc-900 whitespace-nowrap">
                                            {s.time}
                                        </td>

                                        {/* Route */}
                                        <td className="py-3 px-4 sm:px-6 font-bold text-zinc-900 whitespace-nowrap">
                                            {s.route}
                                        </td>

                                        {/* Bus Classification */}
                                        <td className="py-3 px-4 sm:px-6 text-xs whitespace-nowrap">
                                            <span className={`inline-block px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                                                s.bus_type.includes("FIRST CLASS")
                                                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                                                    : s.bus_type.includes("ORDINARY")
                                                    ? "bg-zinc-200 text-zinc-700"
                                                    : "bg-blue-50 text-blue-800 border border-blue-200"
                                            }`}>
                                                {s.bus_type}
                                            </span>
                                        </td>

                                        {/* Bus Unit */}
                                        <td className="py-3 px-4 sm:px-6 font-mono text-xs font-bold text-zinc-700 whitespace-nowrap">
                                            {s.bus_number || "—"}
                                        </td>

                                        {/* Route Notes */}
                                        <td className="py-3 px-4 sm:px-6 text-xs text-zinc-500 whitespace-nowrap">
                                            {s.via || "Direct Express"}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 sm:px-6 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(s)}
                                                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
                                                    title="Edit Departure"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(s.id)}
                                                    className="p-1.5 rounded-md hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                                                    title="Delete Departure"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
