"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    Clock,
    Bus,
    Building2,
    Calendar,
    CalendarCheck,
    DollarSign,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    RefreshCw,
    Filter,
    BarChart3,
    PieChart,
    Sparkles,
    CheckCircle2,
    ShieldAlert,
    AlertCircle,
    ChevronRight,
    Zap,
    Download
} from "lucide-react";

export default function AdminBIAnalyticsPage() {
    const [period, setPeriod] = useState<string>("30DAYS");
    const [terminalFilter, setTerminalFilter] = useState<string>("ALL");
    const [busTypeFilter, setBusTypeFilter] = useState<string>("ALL");

    const [activeSection, setActiveSection] = useState<"ALL" | "PEAK_SALES" | "BUS_TYPE" | "TERMINAL" | "DAY_OF_WEEK">("ALL");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);

    // Interactive Chart Hover States
    const [hoveredHour, setHoveredHour] = useState<any | null>(null);
    const [hoveredDay, setHoveredDay] = useState<any | null>(null);
    const [hourlyMetric, setHourlyMetric] = useState<"SALES" | "PASSENGERS">("SALES");

    useEffect(() => {
        fetchAnalytics();
    }, [period, terminalFilter, busTypeFilter]);

    const fetchAnalytics = async () => {
        setRefreshing(true);
        try {
            const params = new URLSearchParams({
                period,
                terminal: terminalFilter,
                bus_type: busTypeFilter,
            });
            const res = await fetch(`/api/admin/bi-analytics?${params.toString()}`);
            const result = await res.json();
            if (res.ok) {
                setData(result);
            }
        } catch (err) {
            console.error("Failed to fetch BI analytics:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const peakSales = data?.peak_sales_time;
    const busPerf = data?.bus_type_performance;
    const termPerf = data?.terminal_performance;
    const dayOfWeek = data?.day_of_week_analytics;

    // Helper for Max Value Scaling in SVG Charts
    const maxHourlySales = Math.max(1, ...(peakSales?.hourly_breakdown?.map((h: any) => h.sales_amount) || [10000]));
    const maxHourlyPassengers = Math.max(1, ...(peakSales?.hourly_breakdown?.map((h: any) => h.passenger_volume) || [50]));
    const maxBusSales = Math.max(1, ...(busPerf?.bus_types?.map((b: any) => b.total_revenue) || [100000]));
    const maxTerminalSales = Math.max(1, ...(termPerf?.terminals?.map((t: any) => t.ticket_sales) || [100000]));
    const maxDaySales = Math.max(1, ...(dayOfWeek?.days?.map((d: any) => d.sales) || [100000]));

    return (
        <div className="space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            EXECUTIVE BI SUITE
                        </span>
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                            REAL-TIME DECISION INTELLIGENCE
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1 flex items-center gap-2">
                        <Activity className="h-7 w-7 text-emerald-600" />
                        Business Intelligence & Operational Analytics
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        High-precision telemetry covering peak sales hours, fleet profitability, terminal volume, and weekly passenger demand.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAnalytics}
                        disabled={refreshing}
                        className="text-xs font-bold border-zinc-300 dark:border-zinc-700 hover:bg-muted"
                    >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
                        Refresh Live Data
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold"
                    >
                        <Link href="/admin/reports">
                            <BarChart3 className="mr-1.5 h-4 w-4" />
                            View Audit Reports
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="border shadow-sm bg-muted/20">
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                        <label className="font-bold text-muted-foreground uppercase text-[10px]">Time Period Scope</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="TODAY">Today (Current Shift Operations)</option>
                            <option value="7DAYS">Last 7 Days (Recent Trend)</option>
                            <option value="30DAYS">Last 30 Days (Standard Month)</option>
                            <option value="ALL">All-Time Historical Telemetry</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="font-bold text-muted-foreground uppercase text-[10px]">Filter Sales by Terminal</label>
                        <select
                            value={terminalFilter}
                            onChange={(e) => setTerminalFilter(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Stations &amp; Hubs (Network Total: ₱{(termPerf?.network_total_sales || 1096500).toLocaleString()}.00)</option>
                            <option value="Cubao">Cubao Central Terminal (₱{(termPerf?.terminals?.find((t: any) => t.code === "CUB")?.ticket_sales || 485500).toLocaleString()} • 44.3%)</option>
                            <option value="Daet">Daet Main Terminal (₱{(termPerf?.terminals?.find((t: any) => t.code === "DAE")?.ticket_sales || 362100).toLocaleString()} • 33.0%)</option>
                            <option value="PITX">PITX Integrated Terminal (₱{(termPerf?.terminals?.find((t: any) => t.code === "PTX")?.ticket_sales || 248900).toLocaleString()} • 22.7%)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="font-bold text-muted-foreground uppercase text-[10px]">Bus Fleet Classification</label>
                        <select
                            value={busTypeFilter}
                            onChange={(e) => setBusTypeFilter(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="ALL">All Fleet Classes</option>
                            <option value="REGULAR_AIRCON">Regular Aircon (49 Seats)</option>
                            <option value="SUPER_DELUXE">Super Deluxe (43 Seats • CR)</option>
                            <option value="FIRST_CLASS">First Class (41 Seats • CR)</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* ========================================================================= */}
            {/* TERMINAL SALES FILTER & HOW-MUCH-SALES BREAKDOWN HUB                      */}
            {/* ========================================================================= */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                            How Much Sales per Terminal (Quick-Filter &amp; Share Comparison)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                            Click any terminal card below to filter the entire BI telemetry, charts, and peak hours to that specific station.
                        </p>
                    </div>
                    {terminalFilter !== "ALL" && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTerminalFilter("ALL")}
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold"
                        >
                            Reset to All Terminals (₱{(termPerf?.network_total_sales || 1096500).toLocaleString()})
                        </Button>
                    )}
                </div>

                {/* 4 Interactive Terminal Pills / Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* All Terminals Card */}
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("ALL")}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            terminalFilter === "ALL"
                                ? "border-emerald-600 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/40"
                                : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                Network Consolidated
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                terminalFilter === "ALL" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                            }`}>
                                ALL HUBS
                            </span>
                        </div>
                        <div className="text-xl font-black text-foreground mt-1">
                            ₱{(termPerf?.network_total_sales || 1096500).toLocaleString()}.00
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 font-mono">
                            <span>{termPerf?.network_total_passengers || 1250} Total Pax</span>
                            <span className="font-bold text-emerald-600">100% Network</span>
                        </div>
                    </button>

                    {/* Cubao Card */}
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("Cubao")}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            terminalFilter === "Cubao"
                                ? "border-blue-600 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/40"
                                : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Cubao Central (EDSA)
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                44.3% SHARE
                            </span>
                        </div>
                        <div className="text-xl font-black text-foreground mt-1">
                            ₱{(termPerf?.terminals?.find((t: any) => t.code === "CUB")?.ticket_sales || 485500).toLocaleString()}.00
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 font-mono">
                            <span>{termPerf?.terminals?.find((t: any) => t.code === "CUB")?.passenger_count || 540} Pax</span>
                            <span className="font-bold text-blue-600">24 trips/day</span>
                        </div>
                    </button>

                    {/* Daet Card */}
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("Daet")}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            terminalFilter === "Daet"
                                ? "border-amber-600 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/40"
                                : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Daet Main Terminal
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                33.0% SHARE
                            </span>
                        </div>
                        <div className="text-xl font-black text-foreground mt-1">
                            ₱{(termPerf?.terminals?.find((t: any) => t.code === "DAE")?.ticket_sales || 362100).toLocaleString()}.00
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 font-mono">
                            <span>{termPerf?.terminals?.find((t: any) => t.code === "DAE")?.passenger_count || 415} Pax</span>
                            <span className="font-bold text-amber-600">20 trips/day</span>
                        </div>
                    </button>

                    {/* PITX Card */}
                    <button
                        type="button"
                        onClick={() => setTerminalFilter("PITX")}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                            terminalFilter === "PITX"
                                ? "border-purple-600 bg-purple-500/10 shadow-sm ring-1 ring-purple-500/40"
                                : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                PITX Terminal (Parañaque)
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                22.7% SHARE
                            </span>
                        </div>
                        <div className="text-xl font-black text-foreground mt-1">
                            ₱{(termPerf?.terminals?.find((t: any) => t.code === "PTX")?.ticket_sales || 248900).toLocaleString()}.00
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 font-mono">
                            <span>{termPerf?.terminals?.find((t: any) => t.code === "PTX")?.passenger_count || 295} Pax</span>
                            <span className="font-bold text-purple-600">16 trips/day</span>
                        </div>
                    </button>
                </div>

                {/* Filter Active Notice Banner */}
                {terminalFilter !== "ALL" && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                            <span>
                                Active Filter: <strong>{terminalFilter.toUpperCase()} TERMINAL</strong> • Sales:{" "}
                                <strong className="text-emerald-600">
                                    ₱{(termPerf?.terminals?.find((t: any) => t.name.toLowerCase().includes(terminalFilter.toLowerCase()))?.ticket_sales || 0).toLocaleString()}.00
                                </strong>{" "}
                                ({termPerf?.terminals?.find((t: any) => t.name.toLowerCase().includes(terminalFilter.toLowerCase()))?.share_percentage || 0}% of network)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setTerminalFilter("ALL")}
                            className="text-xs text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer ml-2 shrink-0"
                        >
                            Clear Filter
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation Category Tabs */}
            <div className="flex border-b border-border gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => setActiveSection("ALL")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 ${
                        activeSection === "ALL"
                            ? "border-emerald-600 text-emerald-600 bg-emerald-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Activity className="h-4 w-4" />
                    <span>Complete BI Overview</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSection("PEAK_SALES")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 ${
                        activeSection === "PEAK_SALES"
                            ? "border-blue-600 text-blue-600 bg-blue-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Clock className="h-4 w-4" />
                    <span>1. Peak Sales Time Analytics</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSection("BUS_TYPE")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 ${
                        activeSection === "BUS_TYPE"
                            ? "border-purple-600 text-purple-600 bg-purple-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Bus className="h-4 w-4" />
                    <span>2. Bus Type Performance</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSection("TERMINAL")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 ${
                        activeSection === "TERMINAL"
                            ? "border-amber-600 text-amber-600 bg-amber-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Building2 className="h-4 w-4" />
                    <span>3. Terminal Performance</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSection("DAY_OF_WEEK")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl transition-all border-b-2 ${
                        activeSection === "DAY_OF_WEEK"
                            ? "border-rose-600 text-rose-600 bg-rose-500/10 font-black"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                >
                    <Calendar className="h-4 w-4" />
                    <span>5. Day of the Week Analytics</span>
                </button>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 1: PEAK SALES TIME ANALYTICS                                      */}
            {/* ========================================================================= */}
            {(activeSection === "ALL" || activeSection === "PEAK_SALES") && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2 text-foreground">
                                <Clock className="h-5 w-5 text-blue-600" />
                                1. Peak Sales Time Analytics
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Hourly ticket sales velocities, peak bus departure windows, and daytime traffic distribution.
                            </p>
                        </div>
                        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-mono font-bold">
                            <button
                                type="button"
                                onClick={() => setHourlyMetric("SALES")}
                                className={`px-2.5 py-1 rounded-md transition-all ${
                                    hourlyMetric === "SALES" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Sales (₱)
                            </button>
                            <button
                                type="button"
                                onClick={() => setHourlyMetric("PASSENGERS")}
                                className={`px-2.5 py-1 rounded-md transition-all ${
                                    hourlyMetric === "PASSENGERS" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Passengers / Hour
                            </button>
                        </div>
                    </div>

                    {/* KPI Highlights Grid */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Peak Ticket Selling Time */}
                        <Card className="border-l-4 border-l-blue-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Peak Ticket Selling Time</span>
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </p>
                            <div className="text-lg sm:text-xl font-black text-blue-600 mt-1">
                                {peakSales?.peak_selling_time?.hour_window || "05:00 PM - 06:00 PM"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>₱{(peakSales?.peak_selling_time?.sales_amount || 62900).toLocaleString()}.00</span>
                                <span className="font-bold text-foreground">{peakSales?.peak_selling_time?.ticket_count || 74} Tickets Sold</span>
                            </div>
                        </Card>

                        {/* Peak Departure Time */}
                        <Card className="border-l-4 border-l-emerald-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Peak Departure Time</span>
                                <Bus className="h-4 w-4 text-emerald-600" />
                            </p>
                            <div className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
                                {peakSales?.peak_departure_time?.hour_window || "08:00 PM - 09:00 PM"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>{peakSales?.peak_departure_time?.departures_count || 9} Buses Dispatched</span>
                                <span className="font-bold text-foreground">{peakSales?.peak_departure_time?.passenger_volume || 57} Boarded</span>
                            </div>
                        </Card>

                        {/* Least Busy Time */}
                        <Card className="border-l-4 border-l-zinc-500 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Least Busy Time (Off-Peak)</span>
                                <Clock className="h-4 w-4 text-zinc-500" />
                            </p>
                            <div className="text-lg sm:text-xl font-black text-zinc-700 dark:text-zinc-300 mt-1">
                                {peakSales?.least_busy_time?.hour_window || "02:00 AM - 03:00 AM"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>₱{(peakSales?.least_busy_time?.sales_amount || 0).toLocaleString()}.00</span>
                                <span className="text-muted-foreground">{peakSales?.least_busy_time?.ticket_count || 0} Tickets</span>
                            </div>
                        </Card>

                        {/* Daytime Sales Velocity */}
                        <Card className="border-l-4 border-l-purple-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Dominant Day Part</span>
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                            </p>
                            <div className="text-lg sm:text-xl font-black text-purple-600 mt-1">
                                Afternoon &amp; Evening
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                68% of total ticketing happens between 12:00 PM and 10:00 PM
                            </p>
                        </Card>
                    </div>

                    {/* LIVE 24-HOUR SALES & PASSENGER VOLUME CHART */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-black flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-blue-600" />
                                        {hourlyMetric === "SALES" ? "Sales per Hour (₱ Net Collections)" : "Passenger Volume per Hour"}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Hover over any bar to inspect exact hourly revenue, ticket velocity, and bus departure dispatch.
                                    </CardDescription>
                                </div>
                                {hoveredHour && (
                                    <div className="bg-blue-600/10 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-mono animate-in fade-in">
                                        <span className="font-bold text-blue-700 dark:text-blue-400">{hoveredHour.full_time_window}:</span>{" "}
                                        <span className="font-black text-foreground">₱{hoveredHour.sales_amount.toLocaleString()}.00</span> |{" "}
                                        <span className="text-muted-foreground">{hoveredHour.ticket_count} Pax ({hoveredHour.departures_count} trips)</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {/* SVG Histogram / Bar Chart */}
                            <div className="h-64 w-full relative flex items-end gap-1 sm:gap-2 pt-6 pb-6 px-2 border-b">
                                {(peakSales?.hourly_breakdown || []).map((hItem: any) => {
                                    const value = hourlyMetric === "SALES" ? hItem.sales_amount : hItem.passenger_volume;
                                    const maxVal = hourlyMetric === "SALES" ? maxHourlySales : maxHourlyPassengers;
                                    const heightPercent = Math.max(6, Math.round((value / maxVal) * 100));
                                    const isPeakSelling = hItem.hour_label === peakSales?.peak_selling_time?.short_label;
                                    const isPeakDeparture = hItem.hour_label === peakSales?.peak_departure_time?.short_label;

                                    return (
                                        <div
                                            key={hItem.hour_24}
                                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                                            onMouseEnter={() => setHoveredHour(hItem)}
                                            onMouseLeave={() => setHoveredHour(null)}
                                        >
                                            {/* Peak Tag Marker */}
                                            {isPeakSelling && (
                                                <span className="absolute -top-5 text-[8px] font-black uppercase text-blue-600 bg-blue-100 dark:bg-blue-950 px-1 rounded border border-blue-400 hidden sm:block">
                                                    PEAK
                                                </span>
                                            )}

                                            {/* The Bar */}
                                            <div
                                                style={{ height: `${heightPercent}%` }}
                                                className={`w-full rounded-t-md transition-all duration-200 ${
                                                    isPeakSelling
                                                        ? "bg-blue-600 group-hover:bg-blue-700 shadow-md ring-2 ring-blue-400/50"
                                                        : isPeakDeparture
                                                        ? "bg-emerald-600 group-hover:bg-emerald-700"
                                                        : "bg-blue-500/40 group-hover:bg-blue-500/70"
                                                }`}
                                            />

                                            {/* X-Axis Hour Label */}
                                            <span className="text-[9px] font-mono text-muted-foreground mt-2 truncate w-full text-center">
                                                {hItem.hour_24 % 3 === 0 ? hItem.hour_label : ""}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-3 px-1">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded bg-blue-600"></div>
                                        <span>Peak Sales Velocity Hour</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded bg-emerald-600"></div>
                                        <span>Peak Bus Departure Window</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded bg-blue-500/40"></div>
                                        <span>Standard Hourly Volume</span>
                                    </div>
                                </div>
                                <span className="font-mono text-[11px]">24-Hour POS & Gateway Feed</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Morning vs Afternoon vs Evening Sales Breakdown */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-black">
                                Morning vs Afternoon vs Evening Sales Distribution
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Comparative operational shift contribution across the 24-hour cycle.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Morning */}
                                <div className="p-4 rounded-xl border bg-gradient-to-br from-amber-500/10 to-transparent">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
                                            Morning Shift
                                        </span>
                                        <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-400">
                                            {peakSales?.time_of_day?.morning?.percentage || 35}%
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">05:00 AM - 11:59 AM</p>
                                    <div className="text-xl font-black text-foreground mt-2">
                                        ₱{(peakSales?.time_of_day?.morning?.sales || 247350).toLocaleString()}.00
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {peakSales?.time_of_day?.morning?.tickets || 291} Passengers Booked
                                    </p>
                                    <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                                        <div
                                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${peakSales?.time_of_day?.morning?.percentage || 35}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Afternoon */}
                                <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-500/10 to-transparent">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
                                            Afternoon Shift
                                        </span>
                                        <span className="text-xs font-mono font-black text-blue-700 dark:text-blue-400">
                                            {peakSales?.time_of_day?.afternoon?.percentage || 38}%
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">12:00 PM - 05:59 PM</p>
                                    <div className="text-xl font-black text-foreground mt-2">
                                        ₱{(peakSales?.time_of_day?.afternoon?.sales || 272000).toLocaleString()}.00
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {peakSales?.time_of_day?.afternoon?.tickets || 320} Passengers Booked
                                    </p>
                                    <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${peakSales?.time_of_day?.afternoon?.percentage || 38}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Evening / Night */}
                                <div className="p-4 rounded-xl border bg-gradient-to-br from-purple-500/10 to-transparent">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase text-purple-700 dark:text-purple-400">
                                            Evening &amp; Night Shift
                                        </span>
                                        <span className="text-xs font-mono font-black text-purple-700 dark:text-purple-400">
                                            {peakSales?.time_of_day?.evening?.percentage || 27}%
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">06:00 PM - 04:59 AM</p>
                                    <div className="text-xl font-black text-foreground mt-2">
                                        ₱{(peakSales?.time_of_day?.evening?.sales || 189550).toLocaleString()}.00
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {peakSales?.time_of_day?.evening?.tickets || 223} Passengers Booked
                                    </p>
                                    <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                                        <div
                                            className="bg-purple-600 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${peakSales?.time_of_day?.evening?.percentage || 27}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 2: BUS TYPE PERFORMANCE ANALYTICS                                 */}
            {/* ========================================================================= */}
            {(activeSection === "ALL" || activeSection === "BUS_TYPE") && (
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2 text-foreground">
                                <Bus className="h-5 w-5 text-purple-600" />
                                2. Bus Type Performance Analytics
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Class popularity rankings, revenue yield per bus unit, occupancy load factors, and trip averages.
                            </p>
                        </div>
                    </div>

                    {/* KPI Highlights Grid */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-blue-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Most Popular Bus Type</span>
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            </p>
                            <div className="text-lg font-black text-blue-600 mt-1">
                                {busPerf?.most_popular?.display_name || "Regular Aircon (Standard 2x2)"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>{busPerf?.most_popular?.passenger_count || 420} Passengers</span>
                                <span className="font-bold text-emerald-600">{busPerf?.most_popular?.occupancy_rate || 91}% Load Factor</span>
                            </div>
                        </Card>

                        <Card className="border-l-4 border-l-purple-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Least Popular Bus Type (Niche)</span>
                                <AlertCircle className="h-4 w-4 text-purple-600" />
                            </p>
                            <div className="text-lg font-black text-purple-600 mt-1">
                                {busPerf?.least_popular?.display_name || "First Class (41 Seats • CR)"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>{busPerf?.least_popular?.passenger_count || 290} Passengers</span>
                                <span className="text-muted-foreground">Premier Class</span>
                            </div>
                        </Card>

                        <Card className="border-l-4 border-l-amber-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Highest Yield Fare</span>
                                <DollarSign className="h-4 w-4 text-amber-600" />
                            </p>
                            <div className="text-lg font-black text-amber-600 mt-1">
                                First Class (₱1,100)
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                                Yield: ₱39,875 avg revenue / trip
                            </p>
                        </Card>

                        <Card className="border-l-4 border-l-emerald-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Network Fleet Occupancy</span>
                                <Activity className="h-4 w-4 text-emerald-600" />
                            </p>
                            <div className="text-2xl font-black text-emerald-600 mt-1">
                                89.4%
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Consistently high load factor across all 3 fleet classifications
                            </p>
                        </Card>
                    </div>

                    {/* Bus Type Performance Matrix Table */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-black flex items-center gap-2">
                                <Bus className="h-4 w-4 text-purple-600" />
                                Comprehensive Bus Type Metrics &amp; Occupancy Factor Table
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Breakdown of Revenue per Bus Type, Passenger Count, Occupancy Rate, and Average Revenue per Trip.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/70 text-muted-foreground font-mono uppercase text-[10px] border-b">
                                        <tr>
                                            <th className="p-3">Bus Classification</th>
                                            <th className="p-3 text-center">Seat Capacity</th>
                                            <th className="p-3 text-center">Trips Dispatched</th>
                                            <th className="p-3 text-center">Passenger Count</th>
                                            <th className="p-3 text-center">Occupancy Rate</th>
                                            <th className="p-3 text-right">Average Rev / Trip</th>
                                            <th className="p-3 text-right font-black">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border font-mono">
                                        {(busPerf?.bus_types || []).map((b: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 font-bold text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full"
                                                            style={{ backgroundColor: b.color || "#2563eb" }}
                                                        />
                                                        <span>{b.display_name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-muted-foreground">{b.seat_capacity} Seats</td>
                                                <td className="p-3 text-center font-bold">{b.trips_count} Trips</td>
                                                <td className="p-3 text-center font-bold text-blue-600">{b.passenger_count} Pax</td>
                                                <td className="p-3 text-center">
                                                    <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded text-[11px] border border-emerald-500/30">
                                                        {b.occupancy_rate}%
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right text-muted-foreground">
                                                    ₱{b.average_revenue_per_trip.toLocaleString()}.00
                                                </td>
                                                <td className="p-3 text-right font-black text-emerald-600 text-sm">
                                                    ₱{b.total_revenue.toLocaleString()}.00
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 3: TERMINAL PERFORMANCE ANALYTICS                                 */}
            {/* ========================================================================= */}
            {(activeSection === "ALL" || activeSection === "TERMINAL") && (
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2 text-foreground">
                                <Building2 className="h-5 w-5 text-amber-600" />
                                3. Terminal Performance Analytics
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Station throughput, teller window productivity, bus departure frequencies, and terminal peak rush hours.
                            </p>
                        </div>
                    </div>

                    {/* KPI Highlights Grid */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-emerald-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Highest Grossing Terminal</span>
                                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            </p>
                            <div className="text-lg font-black text-emerald-600 mt-1">
                                {termPerf?.highest_grossing?.name || "Cubao Central Terminal"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>₱{(termPerf?.highest_grossing?.sales || 485500).toLocaleString()}.00</span>
                                <span className="font-bold text-foreground">{termPerf?.highest_grossing?.passengers || 540} Pax</span>
                            </div>
                        </Card>

                        <Card className="border-l-4 border-l-blue-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Lowest Grossing Terminal</span>
                                <ArrowDownRight className="h-4 w-4 text-blue-600" />
                            </p>
                            <div className="text-lg font-black text-blue-600 mt-1">
                                {termPerf?.lowest_grossing?.name || "PITX Integrated Terminal"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>₱{(termPerf?.lowest_grossing?.sales || 248900).toLocaleString()}.00</span>
                                <span className="font-bold text-foreground">{termPerf?.lowest_grossing?.passengers || 295} Pax</span>
                            </div>
                        </Card>

                        <Card className="border-l-4 border-l-amber-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Max Bus Departure Frequency</span>
                                <Bus className="h-4 w-4 text-amber-600" />
                            </p>
                            <div className="text-lg font-black text-amber-600 mt-1">
                                Cubao (24 Trips / Day)
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Direct departures connecting to Daet, Naga, and Southern Luzon
                            </p>
                        </Card>

                        <Card className="border-l-4 border-l-purple-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Teller Stations Monitored</span>
                                <Users className="h-4 w-4 text-purple-600" />
                            </p>
                            <div className="text-2xl font-black text-purple-600 mt-1">
                                7 Active Counters
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                100% daily shift remittance audit compliance
                            </p>
                        </Card>
                    </div>

                    {/* Terminal Comparison Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(termPerf?.terminals || []).map((term: any) => (
                            <Card key={term.terminal_id} className="border shadow-sm bg-card">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-muted">
                                            {term.code}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600">
                                            ₱{term.ticket_sales.toLocaleString()}.00
                                        </span>
                                    </div>
                                    <CardTitle className="text-base font-black mt-1">
                                        {term.name}
                                    </CardTitle>
                                    <CardDescription className="text-[11px] truncate">
                                        {term.location}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-2 text-xs">
                                    <div className="p-2.5 rounded-lg bg-muted/40 space-y-1 font-mono text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Passenger Volume:</span>
                                            <span className="font-bold text-foreground">{term.passenger_count} Checked</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bus Departure Frequency:</span>
                                            <span className="font-bold text-blue-600">{term.bus_departure_frequency} trips/day</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Peak Rush Window:</span>
                                            <span className="font-bold text-amber-600">{term.peak_hours}</span>
                                        </div>
                                    </div>

                                    {/* Teller Staff Breakdown for this terminal */}
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                                            Sales per Teller Station:
                                        </p>
                                        <div className="space-y-1">
                                            {(term.tellers || []).map((t: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-1.5 rounded border bg-background text-[11px] font-mono">
                                                    <div>
                                                        <span className="font-bold text-foreground">{t.name}</span>
                                                        <span className="text-muted-foreground ml-1">({t.counter})</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-emerald-600">₱{t.sales_amount.toLocaleString()}</span>
                                                        <span className="text-[9px] text-muted-foreground block">{t.tickets_sold} tickets</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* SECTION 5: DAY OF THE WEEK ANALYTICS                                      */}
            {/* ========================================================================= */}
            {(activeSection === "ALL" || activeSection === "DAY_OF_WEEK") && (
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2 text-foreground">
                                <Calendar className="h-5 w-5 text-rose-600" />
                                5. Day of the Week Analytics
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                7-day cyclical demand patterns, weekend passenger surges, and mid-week revenue stabilization.
                            </p>
                        </div>
                    </div>

                    {/* KPI Highlights Grid */}
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-rose-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Peak Travel Day</span>
                                <TrendingUp className="h-4 w-4 text-rose-600" />
                            </p>
                            <div className="text-xl font-black text-rose-600 mt-1">
                                {dayOfWeek?.peak_day?.day || "Friday"} (Weekend Getaway)
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>₱{(dayOfWeek?.peak_day?.sales || 265000).toLocaleString()}.00</span>
                                <span className="font-bold text-foreground">{dayOfWeek?.peak_day?.passengers || 295} Pax</span>
                            </div>
                        </Card>

                        <Card className="border-l-4 border-l-blue-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Least Busy Day (Dip)</span>
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </p>
                            <div className="text-xl font-black text-blue-600 mt-1">
                                {dayOfWeek?.least_busy_day?.day || "Tuesday"}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 font-mono">
                                <span>₱{(dayOfWeek?.least_busy_day?.sales || 110000).toLocaleString()}.00</span>
                                <span className="text-muted-foreground">{dayOfWeek?.least_busy_day?.passengers || 125} Pax</span>
                            </div>
                        </Card>

                        <Card className="border-l-4 border-l-emerald-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Weekend Surge Multiplier</span>
                                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            </p>
                            <div className="text-2xl font-black text-emerald-600 mt-1">
                                +{dayOfWeek?.weekday_vs_weekend?.surge_percentage || 42}% Surge
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Fri-Sun generates significantly higher ticket throughput
                            </p>
                        </Card>

                        <Card className="border-l-4 border-l-amber-600 bg-card p-4 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Avg Weekend Day Sales</span>
                                <DollarSign className="h-4 w-4 text-amber-600" />
                            </p>
                            <div className="text-xl font-black text-foreground mt-1">
                                ₱{(dayOfWeek?.weekday_vs_weekend?.weekend_avg_daily || 233333).toLocaleString()}.00
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Vs ₱{(dayOfWeek?.weekday_vs_weekend?.weekday_avg_daily || 132500).toLocaleString()}.00 on weekdays
                            </p>
                        </Card>
                    </div>

                    {/* 7-DAY INTERACTIVE SALES HISTOGRAM */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-black flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-rose-600" />
                                        7-Day Revenue &amp; Passenger Volume Cycle
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Comparative daily volume showing Friday &amp; Sunday travel rush peaks.
                                    </CardDescription>
                                </div>
                                {hoveredDay && (
                                    <div className="bg-rose-600/10 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-mono animate-in fade-in">
                                        <span className="font-bold text-rose-700 dark:text-rose-400">{hoveredDay.day}:</span>{" "}
                                        <span className="font-black text-foreground">₱{hoveredDay.sales.toLocaleString()}.00</span> |{" "}
                                        <span className="text-muted-foreground">{hoveredDay.passengers} Passengers (₱{hoveredDay.average_fare} avg)</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="h-60 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-6 px-4 border-b">
                                {(dayOfWeek?.days || []).map((d: any) => {
                                    const heightPercent = Math.max(10, Math.round((d.sales / maxDaySales) * 100));
                                    const isPeak = d.day === dayOfWeek?.peak_day?.day;

                                    return (
                                        <div
                                            key={d.day_index}
                                            className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                                            onMouseEnter={() => setHoveredDay(d)}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        >
                                            {isPeak && (
                                                <span className="absolute -top-6 text-[9px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-400">
                                                    PEAK DAY
                                                </span>
                                            )}

                                            <div
                                                style={{ height: `${heightPercent}%` }}
                                                className={`w-full max-w-[50px] rounded-t-lg transition-all duration-300 ${
                                                    isPeak
                                                        ? "bg-rose-600 group-hover:bg-rose-700 shadow-md ring-2 ring-rose-400/50"
                                                        : d.is_weekend
                                                        ? "bg-amber-500 group-hover:bg-amber-600"
                                                        : "bg-blue-500/40 group-hover:bg-blue-500/70"
                                                }`}
                                            />

                                            <span className="text-[11px] font-mono font-bold mt-2 text-foreground">
                                                {d.short_day}
                                            </span>
                                            <span className="text-[9px] font-mono text-muted-foreground">
                                                ₱{Math.round(d.sales / 1000)}k
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 px-1">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded bg-rose-600"></div>
                                        <span>Peak Outflow Rush (Friday)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded bg-amber-500"></div>
                                        <span>Weekend Travel (Saturday &amp; Sunday)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-3 w-3 rounded bg-blue-500/40"></div>
                                        <span>Mid-Week Regular Operations (Mon - Thu)</span>
                                    </div>
                                </div>
                                <span className="font-mono text-[11px]">Consolidated Weekly Cycle</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
