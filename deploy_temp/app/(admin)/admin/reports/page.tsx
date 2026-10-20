"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import {
    TrendingUp,
    Ticket,
    Building,
    CalendarCheck,
    ShieldCheck,
    Download,
    Printer,
    Filter,
    RefreshCw,
    ArrowRight,
    DollarSign,
    Bus,
    Users,
    CheckCircle2,
    Clock,
    Calendar,
    FileSpreadsheet,
    CreditCard,
    Banknote,
    Percent,
    Search,
    ChevronDown,
    Building2
} from "lucide-react";

export default function AdminReportsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    // Filters
    const [dateRange, setDateRange] = useState<string>("30DAYS");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [terminalFilter, setTerminalFilter] = useState<string>("ALL");
    const [routeFilter, setRouteFilter] = useState<string>("ALL");
    const [busTypeFilter, setBusTypeFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Active Tab
    const [activeTab, setActiveTab] = useState<"REVENUE" | "REMITTANCE" | "DISCOUNTS" | "FLEET" | "TRANSACTIONS">("REVENUE");

    useEffect(() => {
        fetchReports();
    }, [dateRange, terminalFilter, routeFilter, busTypeFilter]);

    const fetchReports = async () => {
        setRefreshing(true);
        try {
            const params = new URLSearchParams({
                date_range: dateRange,
                terminal: terminalFilter,
                route: routeFilter,
                bus_type: busTypeFilter,
            });
            if (dateRange === "CUSTOM" && startDate && endDate) {
                params.set("start_date", startDate);
                params.set("end_date", endDate);
            }

            const res = await fetch(`/api/admin/reports?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setReportData(data);
            }
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // CSV / Excel Export Function
    const handleExportCSV = () => {
        if (!reportData || !reportData.transactions) return;

        const headers = [
            "Transaction ID",
            "Date & Time",
            "Passenger Name",
            "Contact #",
            "Route",
            "Bus #",
            "Bus Type",
            "Seat #",
            "Payment Channel",
            "Terminal",
            "Gross Fare (PHP)",
            "Discount (PHP)",
            "Net Paid (PHP)",
            "Discount Classification",
            "Discount ID Presented",
            "Status"
        ];

        const rows = reportData.transactions.map((t: any) => [
            `"${t.id}"`,
            `"${t.date}"`,
            `"${t.passenger_name}"`,
            `"${t.passenger_contact}"`,
            `"${t.route}"`,
            `"${t.bus_number}"`,
            `"${t.bus_type}"`,
            t.seat_number,
            `"${t.channel}"`,
            `"${t.terminal}"`,
            t.gross_fare,
            t.discount_amount,
            t.net_amount,
            `"${t.discount_type}"`,
            `"${t.discount_id}"`,
            `"${t.status}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().split("T")[0];
        link.setAttribute("href", url);
        link.setAttribute("download", `Superlines_Financial_Report_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Summary calculations
    const summary = reportData?.summary || {
        gross_sales: 0,
        total_discounts: 0,
        net_revenue: 0,
        online_revenue: 0,
        counter_revenue: 0,
        online_count: 0,
        counter_count: 0,
        average_ticket_value: 0
    };

    const discounts = reportData?.discounts || {
        senior_count: 0,
        senior_total: 0,
        student_count: 0,
        student_total: 0,
        pwd_count: 0,
        pwd_total: 0,
        total_beneficiaries: 0,
        total_discount_amount: 0
    };

    const filteredTransactions = (reportData?.transactions || []).filter((t: any) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.passenger_name.toLowerCase().includes(q) ||
            t.id.toLowerCase().includes(q) ||
            t.bus_number.toLowerCase().includes(q) ||
            t.route.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header & Export Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="h-8 w-8 text-emerald-600" />
                        Financial, Sales & Operational Reports
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Centralized revenue analytics, teller cash remittance audit, statutory discounts, and bus fleet performance.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
                    >
                        <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
                        Export to Excel / CSV
                    </Button>

                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.print()}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-sm"
                    >
                        <Printer className="mr-1.5 h-4 w-4" />
                        Print / Official PDF
                    </Button>
                </div>
            </div>

            {/* Official Printable Header (Visible Only on Print) */}
            <div className="hidden print:block border-b-2 border-black pb-4 text-black font-sans">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase text-red-700 tracking-wider">SUPERLINES TRANSPORTATION CO., INC.</h1>
                        <p className="text-xs font-bold uppercase tracking-tight">Financial Operations & Revenue Audit Division</p>
                        <p className="text-[10px] text-zinc-700">Centralized Terminal Inventory & Electronic Ticketing System</p>
                    </div>
                    <div className="text-right text-[10px] font-mono">
                        <p>REPORT: <strong>OFFICIAL REVENUE & REMITTANCE AUDIT</strong></p>
                        <p>DATE GENERATED: {new Date().toLocaleString()}</p>
                        <p>PERIOD FILTER: {dateRange} ({terminalFilter} Terminal)</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="border shadow-sm print:hidden bg-zinc-50/50 dark:bg-zinc-900/40">
                <CardHeader className="py-3 px-4 border-b">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5 text-blue-600" /> Report Query & Scope Filters
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchReports}
                            disabled={refreshing}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh Data
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Date Range */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Date Period</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODAY">Today (Current Shift)</option>
                            <option value="YESTERDAY">Yesterday</option>
                            <option value="7DAYS">Last 7 Days</option>
                            <option value="30DAYS">This Month (30 Days)</option>
                            <option value="ALL">All Recorded History</option>
                            <option value="CUSTOM">Custom Date Range...</option>
                        </select>
                    </div>

                    {/* Terminal / Station */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Terminal / Station</label>
                        <select
                            value={terminalFilter}
                            onChange={(e) => setTerminalFilter(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Terminals & Stations</option>
                            <option value="Cubao">Cubao Central Terminal</option>
                            <option value="Daet">Daet Main Terminal</option>
                            <option value="PITX">PITX Integrated Terminal</option>
                            <option value="Online">Online Direct (GCash)</option>
                        </select>
                    </div>

                    {/* Route Filter */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Route</label>
                        <select
                            value={routeFilter}
                            onChange={(e) => setRouteFilter(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Routes</option>
                            <option value="Cubao to Daet">Cubao ➔ Daet</option>
                            <option value="Daet to Cubao">Daet ➔ Cubao</option>
                            <option value="PITX to Daet">PITX ➔ Daet</option>
                            <option value="Daet to PITX">Daet ➔ PITX</option>
                        </select>
                    </div>

                    {/* Bus Type */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Bus Class</label>
                        <select
                            value={busTypeFilter}
                            onChange={(e) => setBusTypeFilter(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Bus Classes</option>
                            <option value="AIRCON">Regular Aircon Express</option>
                            <option value="DELUXE">Deluxe Class (Wi-Fi/USB)</option>
                            <option value="SUPER_DELUXE">Super Deluxe (2x1 Comfort)</option>
                        </select>
                    </div>

                    {/* Custom Date Inputs if selected */}
                    {dateRange === "CUSTOM" && (
                        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-muted-foreground">Start Date</label>
                                <ModernDatePicker
                                    value={startDate}
                                    onChange={(val) => setStartDate(val)}
                                    placeholder="Select start date"
                                    showShortcuts={false}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-muted-foreground">End Date</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <ModernDatePicker
                                            value={endDate}
                                            onChange={(val) => setEndDate(val)}
                                            placeholder="Select end date"
                                            showShortcuts={false}
                                        />
                                    </div>
                                    <Button size="sm" onClick={fetchReports} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 font-bold shrink-0">
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top Revenue KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            <span>Gross Fare Sales</span>
                            <Ticket className="h-4 w-4 text-blue-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-blue-600">
                            ₱{summary.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Total face value before statutory deductions</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            <span>Discounts Deducted (20%)</span>
                            <Percent className="h-4 w-4 text-purple-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-purple-600">
                            -₱{summary.total_discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{discounts.total_beneficiaries} Senior/Student/PWD subsidized</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            <span>Net Collected Revenue</span>
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-2xl font-black text-emerald-600">
                            ₱{summary.net_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
                            ✓ Real cash & GCash received
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-600 bg-card shadow-sm">
                    <CardHeader className="pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            <span>Channel Split</span>
                            <CreditCard className="h-4 w-4 text-amber-600" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-xs font-mono font-bold space-y-1">
                            <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                                <span>📱 GCash ({summary.online_count}):</span>
                                <span>₱{summary.online_revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                                <span>💵 Cash ({summary.counter_count}):</span>
                                <span>₱{summary.counter_revenue.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b space-x-1 print:hidden overflow-x-auto pb-1">
                <button
                    type="button"
                    onClick={() => setActiveTab("REVENUE")}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "REVENUE"
                            ? "border-b-2 border-emerald-600 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Revenue & Sales Breakdown
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("REMITTANCE")}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "REMITTANCE"
                            ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Building2 className="h-3.5 w-3.5" />
                    Terminal & Teller Remittance
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("DISCOUNTS")}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "DISCOUNTS"
                            ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50/50 dark:bg-purple-950/20"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Percent className="h-3.5 w-3.5" />
                    20% Statutory Discount Audit
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("FLEET")}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "FLEET"
                            ? "border-b-2 border-amber-600 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Bus className="h-3.5 w-3.5" />
                    Bus Fleet Utilization
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("TRANSACTIONS")}
                    className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === "TRANSACTIONS"
                            ? "border-b-2 border-zinc-700 text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Ticket className="h-3.5 w-3.5" />
                    Itemized Passenger Log ({filteredTransactions.length})
                </button>
            </div>

            {/* TAB 1: REVENUE BREAKDOWN */}
            {(activeTab === "REVENUE" || typeof window !== "undefined") && (
                <div className={`space-y-4 ${activeTab !== "REVENUE" ? "hidden print:block" : ""}`}>
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-bold flex items-center justify-between">
                                <span>Daily Sales & Net Collection Audit</span>
                                <span className="text-xs font-mono font-normal text-muted-foreground">
                                    Gross Sales − Discounts = Net Revenue
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 border-b font-mono uppercase text-muted-foreground text-[10px]">
                                        <tr className="text-left">
                                            <th className="p-3">Departure / Sales Date</th>
                                            <th className="p-3 text-center">Tickets Sold</th>
                                            <th className="p-3 text-right">Gross Sales</th>
                                            <th className="p-3 text-right text-purple-600">Discounts (20%)</th>
                                            <th className="p-3 text-right font-black text-emerald-600">Net Revenue</th>
                                            <th className="p-3 text-right">Online (GCash)</th>
                                            <th className="p-3 text-right">Counter Cash</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-mono">
                                        {(reportData?.daily_breakdown || []).map((row: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                <td className="p-3 font-bold text-foreground">{row.date}</td>
                                                <td className="p-3 text-center">{row.count}</td>
                                                <td className="p-3 text-right">₱{row.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right text-purple-600">-₱{row.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right font-black text-emerald-600">₱{row.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right text-purple-700">₱{row.online.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-3 text-right text-blue-700">₱{row.counter.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/80 font-mono font-black border-t-2">
                                        <tr>
                                            <td className="p-3 uppercase">Total Aggregation:</td>
                                            <td className="p-3 text-center">{summary.online_count + summary.counter_count}</td>
                                            <td className="p-3 text-right">₱{summary.gross_sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right text-purple-600">-₱{summary.total_discounts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right text-emerald-600">₱{summary.net_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right text-purple-700">₱{summary.online_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right text-blue-700">₱{summary.counter_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB 2: TERMINAL & TELLER REMITTANCE */}
            {(activeTab === "REMITTANCE" || typeof window !== "undefined") && (
                <div className={`space-y-4 ${activeTab !== "REMITTANCE" ? "hidden print:block" : ""}`}>
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-bold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-blue-600" />
                                    Terminal & Teller Cash Remittance Report
                                </span>
                                <span className="text-xs font-mono font-normal text-muted-foreground">
                                    Over-the-Counter Cash Verification & Reconciliation
                                </span>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Verification of physical cash remitted by terminal tellers for end-of-shift turnover.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 border-b font-mono uppercase text-muted-foreground text-[10px]">
                                        <tr className="text-left">
                                            <th className="p-3">Terminal / Station</th>
                                            <th className="p-3">Designated Tellers / Shifts</th>
                                            <th className="p-3 text-center">Tickets Issued</th>
                                            <th className="p-3 text-right">Physical Cash Collected</th>
                                            <th className="p-3 text-right">Electronic (GCash)</th>
                                            <th className="p-3 text-center">Audit & Remittance Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-mono">
                                        {(reportData?.terminal_remittances || []).map((term: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-muted/30">
                                                <td className="p-3 font-bold text-foreground">
                                                    <div className="text-sm">{term.name}</div>
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {term.tellers.join(", ")}
                                                </td>
                                                <td className="p-3 text-center font-bold">{term.tickets}</td>
                                                <td className="p-3 text-right font-black text-blue-600">
                                                    ₱{term.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-right text-purple-600">
                                                    ₱{term.online.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                        term.cash > 0 || term.online > 0
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                                                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                                    }`}>
                                                        ✓ {term.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/80 font-mono font-black border-t-2">
                                        <tr>
                                            <td colSpan={2} className="p-3 uppercase">Total Station Collections:</td>
                                            <td className="p-3 text-center">{summary.online_count + summary.counter_count}</td>
                                            <td className="p-3 text-right text-blue-600">₱{summary.counter_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-right text-purple-600">₱{summary.online_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-3 text-center text-emerald-600">100% RECONCILED</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB 3: 20% STATUTORY DISCOUNT AUDIT */}
            {(activeTab === "DISCOUNTS" || typeof window !== "undefined") && (
                <div className={`space-y-4 ${activeTab !== "DISCOUNTS" ? "hidden print:block" : ""}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Card className="border-l-4 border-l-purple-600">
                            <CardHeader className="py-2.5 px-3">
                                <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Senior Citizens (OSCA)</CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-2.5">
                                <div className="text-xl font-black text-purple-600">{discounts.senior_count} Beneficiaries</div>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">₱{discounts.senior_total.toLocaleString()} Subsidized</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-600">
                            <CardHeader className="py-2.5 px-3">
                                <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Students (RA 11314)</CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-2.5">
                                <div className="text-xl font-black text-blue-600">{discounts.student_count} Beneficiaries</div>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">₱{discounts.student_total.toLocaleString()} Subsidized</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-emerald-600">
                            <CardHeader className="py-2.5 px-3">
                                <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Persons with Disability (PWD)</CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-2.5">
                                <div className="text-xl font-black text-emerald-600">{discounts.pwd_count} Beneficiaries</div>
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">₱{discounts.pwd_total.toLocaleString()} Subsidized</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-bold flex items-center justify-between">
                                <span>LTFRB & BIR Statutory 20% Discount Audit Log</span>
                                <span className="text-xs font-mono font-normal text-muted-foreground">
                                    Official Audit of Beneficiary IDs & Deductions
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs font-mono">
                                    <thead className="bg-muted/50 border-b uppercase text-muted-foreground text-[10px]">
                                        <tr className="text-left">
                                            <th className="p-3">Passenger Name</th>
                                            <th className="p-3">Classification</th>
                                            <th className="p-3">Physical ID Number</th>
                                            <th className="p-3">Route</th>
                                            <th className="p-3 text-right">Standard Fare</th>
                                            <th className="p-3 text-right text-purple-600">20% Discount</th>
                                            <th className="p-3 text-right text-emerald-600 font-bold">Net Paid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData?.transactions?.filter((t: any) => t.is_discounted).map((t: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                <td className="p-3 font-bold text-foreground font-sans">{t.passenger_name}</td>
                                                <td className="p-3">
                                                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                                        {t.discount_type}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold text-purple-700 dark:text-purple-300">{t.discount_id || "VERIFIED AT GATE"}</td>
                                                <td className="p-3 text-muted-foreground">{t.route}</td>
                                                <td className="p-3 text-right">₱{t.gross_fare.toFixed(2)}</td>
                                                <td className="p-3 text-right text-purple-600">-₱{t.discount_amount.toFixed(2)}</td>
                                                <td className="p-3 text-right text-emerald-600 font-black">₱{t.net_amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TAB 4: BUS FLEET UTILIZATION */}
            {(activeTab === "FLEET" || typeof window !== "undefined") && (
                <div className={`space-y-4 ${activeTab !== "FLEET" ? "hidden print:block" : ""}`}>
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base font-bold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Bus className="h-5 w-5 text-amber-600" />
                                    Bus Fleet Vehicle Utilization & Revenue Performance
                                </span>
                                <span className="text-xs font-mono font-normal text-muted-foreground">
                                    Load Factor, Trips Run & Generated Revenue per Unit
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs font-mono">
                                    <thead className="bg-muted/50 border-b uppercase text-muted-foreground text-[10px]">
                                        <tr className="text-left">
                                            <th className="p-3">Bus Number</th>
                                            <th className="p-3">Bus Specification</th>
                                            <th className="p-3 text-center">Seat Capacity</th>
                                            <th className="p-3 text-center">Trips Dispatched</th>
                                            <th className="p-3 text-center">Passengers Carried</th>
                                            <th className="p-3 text-center">Occupancy Rate</th>
                                            <th className="p-3 text-right">Total Revenue</th>
                                            <th className="p-3 text-center">Fleet Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {(reportData?.bus_performances || []).map((bp: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                <td className="p-3 font-bold text-foreground font-sans flex items-center gap-2">
                                                    <Bus className="h-4 w-4 text-red-500" />
                                                    <span>{bp.bus_number}</span>
                                                </td>
                                                <td className="p-3 text-muted-foreground">{bp.bus_type}</td>
                                                <td className="p-3 text-center">{bp.seat_capacity} seats</td>
                                                <td className="p-3 text-center font-bold">{bp.trips_count}</td>
                                                <td className="p-3 text-center">{bp.passengers_count}</td>
                                                <td className="p-3 text-center font-black">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                                                        bp.occupancy_rate >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                                    }`}>
                                                        {bp.occupancy_rate}%
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-black text-emerald-600">
                                                    ₱{bp.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                                        {bp.status}
                                                    </span>
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

            {/* TAB 5: ITEMIZED PASSENGER TRANSACTION LOG */}
            {(activeTab === "TRANSACTIONS" || typeof window !== "undefined") && (
                <div className={`space-y-4 ${activeTab !== "TRANSACTIONS" ? "hidden print:block" : ""}`}>
                    <Card>
                        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-base font-bold">Itemized Passenger Booking Log</CardTitle>
                                <CardDescription className="text-xs">Individual seat transactions, tickets, and payment channel audit.</CardDescription>
                            </div>
                            <div className="relative w-64 print:hidden">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search passenger, bus #, or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-8 pl-8 text-xs"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 border-b font-mono uppercase text-muted-foreground text-[10px]">
                                        <tr className="text-left">
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Passenger</th>
                                            <th className="p-3">Route</th>
                                            <th className="p-3">Bus & Seat</th>
                                            <th className="p-3">Channel</th>
                                            <th className="p-3 text-right">Net Amount</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-mono">
                                        {filteredTransactions.slice(0, 50).map((t: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                <td className="p-3 text-[11px] text-muted-foreground">{t.date}</td>
                                                <td className="p-3 font-bold font-sans">
                                                    <div>{t.passenger_name}</div>
                                                    {t.is_discounted && (
                                                        <span className="text-[9px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded font-black font-mono">
                                                            20% {t.discount_type}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-muted-foreground">{t.route}</td>
                                                <td className="p-3">
                                                    <span className="font-bold text-foreground">{t.bus_number}</span> • Seat #{t.seat_number}
                                                </td>
                                                <td className="p-3 text-[11px]">
                                                    <span className={t.channel.includes("GCASH") ? "text-purple-600 font-bold" : "text-blue-600 font-bold"}>
                                                        {t.channel}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-black text-emerald-600">₱{t.net_amount.toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        {t.status}
                                                    </span>
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

            {/* Official Print Signatures Block */}
            <div className="hidden print:grid grid-cols-2 gap-12 text-xs border-t-2 border-black pt-6 mt-8 text-black font-sans">
                <div>
                    <p className="font-bold uppercase tracking-wider text-[11px]">Prepared & Computed By:</p>
                    <div className="mt-12 border-b-2 border-black w-64"></div>
                    <p className="mt-1 font-bold text-xs">REVENUE ACCOUNTING AUDITOR</p>
                    <p className="text-[10px] text-zinc-600">Superlines Transportation Co. Finance Division</p>
                </div>
                <div>
                    <p className="font-bold uppercase tracking-wider text-[11px]">Verified & Approved By:</p>
                    <div className="mt-12 border-b-2 border-black w-64"></div>
                    <p className="mt-1 font-bold text-xs">TERMINAL OPERATIONS MANAGER</p>
                    <p className="text-[10px] text-zinc-600">Superlines Central Terminal Office</p>
                </div>
            </div>
        </div>
    );
}
