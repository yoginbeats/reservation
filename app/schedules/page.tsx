import Image from "next/image";
import { Clock, MapPin, Bus, Phone, ShieldCheck, AlertCircle } from "lucide-react";

export const metadata = {
    title: "Daily Bus Schedules & Terminal Departures | Superlines Transportation",
    description: "Official static daily trip departures and bus schedule timetable from Superlines Daet Central Terminal.",
};

interface ScheduleItem {
    time: string;
    route: string;
    busType: "FIRST CLASS (F/C) W/ CR" | "REGULAR AIRCON (A/C)" | "AIRCON (A/C) W/ CR" | "ORDINARY";
    busNumber?: string;
    via?: string;
}

const AM_SCHEDULES: ScheduleItem[] = [
    { time: "5:00 AM", route: "Daet ➔ Cubao - Alabang", busType: "REGULAR AIRCON (A/C)" },
    { time: "5:45 AM", route: "Daet ➔ Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 976" },
    { time: "7:30 AM", route: "Daet ➔ Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 961", via: "Via Vinzons" },
    { time: "9:00 AM", route: "Daet ➔ Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 971" },
    { time: "10:30 AM", route: "Daet ➔ Cubao - Alabang", busType: "ORDINARY" },
    { time: "12:30 PM", route: "Daet ➔ PITX - Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 141" },
];

const PM_SCHEDULES: ScheduleItem[] = [
    { time: "2:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", busType: "REGULAR AIRCON (A/C)" },
    { time: "3:30 PM", route: "Daet ➔ PITX - Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 146" },
    { time: "4:45 PM", route: "Daet ➔ PITX - Cubao - Alabang", busType: "REGULAR AIRCON (A/C)" },
    { time: "5:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 197" },
    { time: "6:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 1177", via: "San Vicente" },
    { time: "7:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 709", via: "Fr. Tarum PITX" },
    { time: "7:00 PM", route: "Daet ➔ PITX - Cubao", busType: "FIRST CLASS (F/C) W/ CR", busNumber: "Bus 310" },
    { time: "7:30 PM", route: "Daet ➔ PITX - Cubao", busType: "FIRST CLASS (F/C) W/ CR" },
    { time: "7:45 PM", route: "Daet ➔ PITX - Cubao", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 900" },
    { time: "8:00 PM", route: "Daet ➔ Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 109", via: "Fr. Mercedes" },
    { time: "8:30 PM", route: "Daet ➔ Alabang - Cubao", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 973", via: "Via Vinzons (Reg A/C)" },
    { time: "8:45 PM", route: "Daet ➔ PITX - Alabang", busType: "AIRCON (A/C) W/ CR", busNumber: "Bus 330" },
    { time: "9:00 PM", route: "Daet ➔ Alabang - Cubao", busType: "FIRST CLASS (F/C) W/ CR", busNumber: "Bus 336" },
    { time: "9:15 PM", route: "Daet ➔ Alabang - Cubao", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 333" },
    { time: "9:30 PM", route: "Daet ➔ Cubao - Alabang", busType: "REGULAR AIRCON (A/C)", busNumber: "Bus 914" },
];

const FEEDER_SCHEDULES = [
    { period: "A.M.", route: "Capalonga / Larap", busNumber: "Bus 704" },
    { period: "A.M.", route: "Capalonga", busNumber: "Bus 196" },
    { period: "A.M.", route: "Tabas (Tab. Tnl)", busNumber: "Bus 111" },
    { period: "P.M.", route: "Ordinary Passenger (ORD P/P)", busNumber: "Bus 710" },
    { period: "P.M.", route: "Aircon Panganiban (A/C Pang.)", busNumber: "Bus 974" },
    { period: "P.M.", route: "Aircon Paracale (A/C Par.)", busNumber: "Bus 1169" },
];

export default function SchedulesPage() {
    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-white py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header Banner */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400">
                        <Bus className="h-4 w-4 text-red-500" />
                        <span>Official Terminal Dispatch Roster</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                        Daily Bus Schedules & Terminal Departures
                    </h1>

                    <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-medium">
                        Official regular daily trip timetable from <strong className="text-white">Superlines Daet Central Terminal</strong> to Metro Manila (Cubao, PITX, Alabang) and provincial connecting routes.
                    </p>
                </div>

                {/* MORNING (AM) DEPARTURES */}
                <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-zinc-900 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-white" />
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                                    Morning Departures (A.M.)
                                </h2>
                                <p className="text-xs text-amber-100 font-medium">
                                    Daet Terminal ➔ Cubao / Alabang / PITX
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full text-white uppercase tracking-widest">
                            Daily Regular
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800 font-bold">
                                <tr>
                                    <th className="py-3 px-4 sm:px-6">Departure Time</th>
                                    <th className="py-3 px-4 sm:px-6">Destination Route</th>
                                    <th className="py-3 px-4 sm:px-6">Bus Classification</th>
                                    <th className="py-3 px-4 sm:px-6">Assigned Unit</th>
                                    <th className="py-3 px-4 sm:px-6">Remarks / Route Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 font-medium text-zinc-200">
                                {AM_SCHEDULES.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                                        <td className="py-3.5 px-4 sm:px-6 font-black text-amber-400 text-base font-mono whitespace-nowrap">
                                            {s.time}
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 font-bold text-white whitespace-nowrap">
                                            {s.route}
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${
                                                s.busType.includes("FIRST CLASS")
                                                    ? "bg-purple-950/80 text-purple-300 border border-purple-800/80"
                                                    : s.busType.includes("ORDINARY")
                                                    ? "bg-zinc-800 text-zinc-300"
                                                    : "bg-blue-950/80 text-blue-300 border border-blue-800/80"
                                            }`}>
                                                {s.busType}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-zinc-300 whitespace-nowrap">
                                            {s.busNumber || "—"}
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 text-xs text-zinc-400">
                                            {s.via || "Direct Express"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AFTERNOON & EVENING (PM) DEPARTURES */}
                <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-red-700 via-red-800 to-zinc-900 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-white" />
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                                    Afternoon & Evening Departures (P.M.)
                                </h2>
                                <p className="text-xs text-red-100 font-medium">
                                    Daet Terminal ➔ PITX / Cubao / Alabang Night Express
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full text-white uppercase tracking-widest">
                            Daily Regular
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800 font-bold">
                                <tr>
                                    <th className="py-3 px-4 sm:px-6">Departure Time</th>
                                    <th className="py-3 px-4 sm:px-6">Destination Route</th>
                                    <th className="py-3 px-4 sm:px-6">Bus Classification</th>
                                    <th className="py-3 px-4 sm:px-6">Assigned Unit</th>
                                    <th className="py-3 px-4 sm:px-6">Remarks / Route Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 font-medium text-zinc-200">
                                {PM_SCHEDULES.map((s, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                                        <td className="py-3.5 px-4 sm:px-6 font-black text-red-400 text-base font-mono whitespace-nowrap">
                                            {s.time}
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 font-bold text-white whitespace-nowrap">
                                            {s.route}
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${
                                                s.busType.includes("FIRST CLASS")
                                                    ? "bg-purple-950/80 text-purple-300 border border-purple-800/80"
                                                    : s.busType.includes("W/ CR")
                                                    ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                                                    : "bg-blue-950/80 text-blue-300 border border-blue-800/80"
                                            }`}>
                                                {s.busType}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-zinc-300 whitespace-nowrap">
                                            {s.busNumber || "—"}
                                        </td>
                                        <td className="py-3.5 px-4 sm:px-6 text-xs text-zinc-400">
                                            {s.via || "Direct Express"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PROVINCIAL FEEDER & CONNECTING ROUTES */}
                <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-900/90 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-zinc-900 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bus className="h-6 w-6 text-white" />
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                                    Provincial Feeder & Connecting Lines
                                </h2>
                                <p className="text-xs text-blue-100 font-medium">
                                    Daet Central Terminal ➔ Camarines Norte Municipalities
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full text-white uppercase tracking-widest">
                            Feeder Service
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800 p-4 gap-4">
                        {FEEDER_SCHEDULES.map((f, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                                        {f.period} Service
                                    </span>
                                    <h4 className="text-sm font-bold text-white mt-1.5">{f.route}</h4>
                                </div>
                                <span className="font-mono text-sm font-black text-amber-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                                    {f.busNumber}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TERMINAL ADVISORY & DIRECT CONTACT DETAILS */}
                <div className="rounded-2xl border-2 border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                        <Phone className="h-5 w-5 text-red-500" />
                        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                            Terminal Waypoint Contact Numbers & Station Advisories
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* San Vicente Contact */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                San Vicente Booking Office
                            </span>
                            <p className="text-lg font-mono font-black text-emerald-400">
                                0907-978-4730
                            </p>
                            <p className="text-[11px] text-zinc-400">
                                Booking inquiries and seat coordination
                            </p>
                        </div>

                        {/* Atimonan Contact */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Atimonan Waypoint Dispatch
                            </span>
                            <p className="text-lg font-mono font-black text-amber-400">
                                0969-590-5465
                            </p>
                            <p className="text-[11px] text-zinc-400">
                                Mandatory trip report & transit checkpoint
                            </p>
                        </div>

                        {/* Daet Dispatch Station */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Daet Central Terminal
                            </span>
                            <p className="text-sm font-bold text-white">
                                Vinzons Avenue, Daet, Camarines Norte
                            </p>
                            <p className="text-[11px] text-zinc-400">
                                Operating 24/7 for passenger ticket issuance & departures
                            </p>
                        </div>
                    </div>

                    {/* Safety and Dispatch Regulations */}
                    <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-xs text-red-200/90 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-red-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Dispatch Safety Reminders for All Bus Units</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px]">
                            <li>Full stop required before passing all active railway and railroad crossings.</li>
                            <li>All bus drivers must verify operational onboard CCTV cameras before terminal bay pull-out.</li>
                            <li>All units passing Atimonan must check in with the waypoint guard on duty.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
