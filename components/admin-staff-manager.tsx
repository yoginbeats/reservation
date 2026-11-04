"use client";

import { useState, useEffect } from "react";
import {
    Users,
    UserPlus,
    Shield,
    Ticket,
    Bus,
    Search,
    Copy,
    Check,
    Lock,
    Mail,
    Building2,
    Eye,
    EyeOff,
    Sparkles,
    RefreshCw,
    X,
    UserCheck,
    AlertCircle,
    KeyRound
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StaffMember {
    id: string;
    email: string;
    full_name: string;
    role: "ADMIN" | "TELLER" | "CONDUCTOR" | "PASSENGER";
    terminal_name: string;
    provisioned_by: string;
    source: string;
    created_at: string;
    status: string;
}

export function AdminStaffManager() {
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("ALL");

    // Modal state for issuing credentials
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [targetRole, setTargetRole] = useState<"TELLER" | "CONDUCTOR">("TELLER");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [terminal, setTerminal] = useState("Cubao Central Terminal");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Created voucher modal state
    const [createdStaffVoucher, setCreatedStaffVoucher] = useState<any | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/staff");
            const data = await res.json();
            if (data.success && Array.isArray(data.staff)) {
                setStaffList(data.staff);
            }
        } catch (err) {
            console.error("Error loading staff list:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePassword = () => {
        const rand = Math.floor(1000 + Math.random() * 9000);
        const prefix = targetRole.toLowerCase();
        setPassword(`${prefix}${rand}`);
    };

    const handleOpenCreateModal = (defaultRole: "TELLER" | "CONDUCTOR" = "TELLER") => {
        setTargetRole(defaultRole);
        setFirstName("");
        setLastName("");
        setEmail("");
        setTerminal("Cubao Central Terminal");
        const rand = Math.floor(1000 + Math.random() * 9000);
        setPassword(`${defaultRole.toLowerCase()}${rand}`);
        setCreateError(null);
        setIsCreateModalOpen(true);
    };

    const handleCreateStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setSubmitting(true);

        try {
            const res = await fetch("/api/admin/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim().toLowerCase(),
                    password: password.trim(),
                    role: targetRole,
                    terminal: terminal.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to provision staff credentials.");
            }

            // Close form modal, open credential voucher slip
            setIsCreateModalOpen(false);
            setCreatedStaffVoucher(data.staff);
            fetchStaff();
        } catch (err: any) {
            setCreateError(err.message || "Failed to issue staff credentials.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyCredentials = () => {
        if (!createdStaffVoucher) return;
        const text = `SUPERLINES TRANSPORTATION CO. INC.\nOFFICIAL STAFF CREDENTIALS\n---------------------------------\nEmployee: ${createdStaffVoucher.full_name}\nRole: ${createdStaffVoucher.role}\nAssigned Terminal: ${createdStaffVoucher.terminal_name}\nLogin Email: ${createdStaffVoucher.email}\nTemporary Password: ${createdStaffVoucher.temporary_password}\nPortal Link: ${window.location.origin}/admin/login\n---------------------------------\nStrictly Confidential. Please change password upon initial login.`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    // Filter calculations
    const filteredStaff = staffList.filter(s => {
        const matchesRole = roleFilter === "ALL" || s.role === roleFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || 
            s.full_name.toLowerCase().includes(q) || 
            s.email.toLowerCase().includes(q) || 
            s.terminal_name.toLowerCase().includes(q);
        return matchesRole && matchesQuery;
    });

    const adminCount = staffList.filter(s => s.role === "ADMIN").length;
    const tellerCount = staffList.filter(s => s.role === "TELLER").length;
    const conductorCount = staffList.filter(s => s.role === "CONDUCTOR").length;

    return (
        <div className="space-y-6">
            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Users className="h-7 w-7 text-red-600" />
                        Staff Management &amp; Provisioning
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Control system access roles. Admin accounts are provisioned by Developers. As Administrator, you issue official credentials for Tellers and Conductors.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchStaff}
                        disabled={loading}
                        className="text-xs font-bold"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>

                    <Button
                        onClick={() => handleOpenCreateModal("TELLER")}
                        className="bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm shadow-md shadow-red-600/20 rounded-xl"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Issue Staff Credentials
                    </Button>
                </div>
            </div>

            {/* Architecture Hierarchy Notice */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-extrabold text-sm text-blue-950 dark:text-blue-100">
                        Official Superlines Security &amp; Credential Hierarchy
                    </p>
                    <p className="leading-relaxed text-muted-foreground">
                        <strong>1. System Developers:</strong> Exclusively configure and provision master <strong>Admin</strong> credentials via secure seed configuration.<br />
                        <strong>2. Main Administrator:</strong> Exclusively generates and provisions official work credentials for <strong>Tellers</strong> (Ticketing booths) and <strong>Conductors</strong> (Bus Boarding &amp; Manifest).<br />
                        <strong>3. Operational Staff &amp; Public:</strong> Staff login using Admin-issued credentials. Public visitors can never self-register as Admin, Teller, or Conductor.
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-border/60 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase">Total Staff</p>
                            <p className="text-2xl font-black mt-0.5">{staffList.length}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center font-bold">
                            <Users className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-red-500/30 bg-red-500/5 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase">Developers (Admin)</p>
                            <p className="text-2xl font-black text-red-700 dark:text-red-300 mt-0.5">{adminCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 flex items-center justify-center font-bold">
                            <Shield className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Active Tellers</p>
                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{tellerCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                            <Ticket className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-purple-500/30 bg-purple-500/5 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase">Active Conductors</p>
                            <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-0.5">{conductorCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                            <Bus className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <Button
                        size="sm"
                        variant={roleFilter === "ALL" ? "default" : "outline"}
                        onClick={() => setRoleFilter("ALL")}
                        className="text-xs font-bold rounded-lg h-8"
                    >
                        All Staff ({staffList.length})
                    </Button>
                    <Button
                        size="sm"
                        variant={roleFilter === "ADMIN" ? "default" : "outline"}
                        onClick={() => setRoleFilter("ADMIN")}
                        className="text-xs font-bold rounded-lg h-8"
                    >
                        Admins ({adminCount})
                    </Button>
                    <Button
                        size="sm"
                        variant={roleFilter === "TELLER" ? "default" : "outline"}
                        onClick={() => setRoleFilter("TELLER")}
                        className="text-xs font-bold rounded-lg h-8"
                    >
                        Tellers ({tellerCount})
                    </Button>
                    <Button
                        size="sm"
                        variant={roleFilter === "CONDUCTOR" ? "default" : "outline"}
                        onClick={() => setRoleFilter("CONDUCTOR")}
                        className="text-xs font-bold rounded-lg h-8"
                    >
                        Conductors ({conductorCount})
                    </Button>
                </div>

                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search staff name, email, or terminal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-xs h-9"
                    />
                </div>
            </div>

            {/* Staff Roster Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Users className="h-4 w-4 text-red-600" />
                        Official Staff Roster
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Registered system operators authorized to process tickets, manifests, or financial remittances.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="border-b bg-muted/40 text-muted-foreground">
                                <tr className="text-left font-semibold">
                                    <th className="p-3.5">Staff Name &amp; Email</th>
                                    <th className="p-3.5">System Role</th>
                                    <th className="p-3.5">Assigned Terminal</th>
                                    <th className="p-3.5">Authority / Provisioned By</th>
                                    <th className="p-3.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-red-600" />
                                            Loading staff accounts...
                                        </td>
                                    </tr>
                                ) : filteredStaff.length > 0 ? (
                                    filteredStaff.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3.5 font-medium">
                                                <div className="font-bold text-foreground text-sm">
                                                    {staff.full_name}
                                                </div>
                                                <div className="text-muted-foreground font-mono text-[11px]">
                                                    {staff.email}
                                                </div>
                                            </td>

                                            <td className="p-3.5">
                                                {staff.role === "ADMIN" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border border-red-300">
                                                        <Shield className="h-3 w-3" /> Admin
                                                    </span>
                                                )}
                                                {staff.role === "TELLER" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300">
                                                        <Ticket className="h-3 w-3" /> Teller
                                                    </span>
                                                )}
                                                {staff.role === "CONDUCTOR" && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300">
                                                        <Bus className="h-3 w-3" /> Conductor
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3.5 font-medium text-foreground">
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {staff.terminal_name}
                                                </span>
                                            </td>

                                            <td className="p-3.5">
                                                <span className="text-[11px] font-semibold text-muted-foreground">
                                                    {staff.provisioned_by}
                                                </span>
                                            </td>

                                            <td className="p-3.5">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No staff accounts match your current search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* CREATE STAFF MODAL DIALOG */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden">
                        <div className="flex items-start justify-between pb-3 border-b">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 flex items-center justify-center shrink-0">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-foreground">
                                        Issue Operational Staff Credentials
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Create official work login for Superlines employee.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {createError && (
                            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                <span>{createError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateStaffSubmit} className="space-y-4 mt-4">
                            {/* Role Selection */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">
                                    Select Operational Role *
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTargetRole("TELLER");
                                            const rand = Math.floor(1000 + Math.random() * 9000);
                                            setPassword(`teller${rand}`);
                                        }}
                                        className={`p-3 rounded-xl border text-left transition-all ${
                                            targetRole === "TELLER"
                                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20"
                                                : "border-border hover:bg-muted/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 font-black text-xs text-emerald-700 dark:text-emerald-400">
                                            <Ticket className="h-4 w-4" />
                                            TELLER (Cashier)
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Walk-in ticketing, cash acceptance, and Z-Reading remittance.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTargetRole("CONDUCTOR");
                                            const rand = Math.floor(1000 + Math.random() * 9000);
                                            setPassword(`conductor${rand}`);
                                        }}
                                        className={`p-3 rounded-xl border text-left transition-all ${
                                            targetRole === "CONDUCTOR"
                                                ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500/20"
                                                : "border-border hover:bg-muted/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 font-black text-xs text-purple-700 dark:text-purple-400">
                                            <Bus className="h-4 w-4" />
                                            CONDUCTOR (Trip)
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            QR ticket boarding scanner and passenger manifest control.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">First Name *</Label>
                                    <Input
                                        required
                                        placeholder="Hal. Maria"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="text-xs h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Last Name *</Label>
                                    <Input
                                        required
                                        placeholder="Hal. Santos"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="text-xs h-9"
                                    />
                                </div>
                            </div>

                            {/* Work Email */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Official Work Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        required
                                        placeholder={`employee.${targetRole.toLowerCase()}@superlines.com`}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9 text-xs h-9 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Terminal Assignment */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Assigned Terminal *</Label>
                                <select
                                    value={terminal}
                                    onChange={(e) => setTerminal(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border text-xs bg-background text-foreground focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="Cubao Central Terminal">Cubao Central Terminal (EDSA, Quezon City)</option>
                                    <option value="Daet Central Terminal">Daet Central Terminal (Camarines Norte)</option>
                                    <option value="PITX Terminal Exchange">PITX (Parañaque Integrated Terminal Exchange)</option>
                                    <option value="Lucena Terminal">Lucena Grand Central Terminal</option>
                                    <option value="Turbina Calamba Terminal">Turbina Calamba Terminal</option>
                                    <option value="Naga City Hub">Naga City Hub</option>
                                </select>
                            </div>

                            {/* Temporary Password */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Initial Password *</Label>
                                    <button
                                        type="button"
                                        onClick={handleGeneratePassword}
                                        className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                                    >
                                        <KeyRound className="h-3 w-3" /> Auto-Generate
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9 pr-9 text-xs h-9 font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={submitting}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4"
                                >
                                    {submitting ? "Issuing Credentials..." : `Create ${targetRole} Account`}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATED VOUCHER CREDENTIALS SLIP */}
            {createdStaffVoucher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/50 shadow-2xl p-6 overflow-hidden">
                        <div className="text-center space-y-1.5 pb-4 border-b">
                            <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                                <Check className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-black text-foreground">
                                Staff Account Issued Successfully!
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Hand or copy these official credentials to the employee.
                            </p>
                        </div>

                        {/* Credentials Slip Voucher */}
                        <div className="my-5 p-4 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 font-mono text-xs space-y-2.5">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Employee Name:</span>
                                <span className="font-bold text-foreground">{createdStaffVoucher.full_name}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Role:</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{createdStaffVoucher.role}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Terminal:</span>
                                <span className="font-bold text-foreground">{createdStaffVoucher.terminal_name}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Work Email:</span>
                                <span className="font-bold text-foreground">{createdStaffVoucher.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Initial Password:</span>
                                <span className="font-black text-red-600 dark:text-red-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border">
                                    {createdStaffVoucher.temporary_password}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleCopyCredentials}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-1.5" />
                                        Copied to Clipboard!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-1.5" />
                                        Copy Credentials Slip
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCreatedStaffVoucher(null)}
                                className="text-xs font-bold"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
