"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, FileSpreadsheet, Bus, MapPin, Calendar, Clock } from "lucide-react";

interface ManifestBooking {
    id: string;
    seat_number: number;
    passenger_name: string;
    passenger_contact: string;
    booking_source: "ONLINE" | "WALK_IN";
    booking_status: string;
    payment_status: string;
    ticket_status: string;
    created_at: string;
    booking_terminal?: {
        name: string;
    } | null;
    ticket?: {
        qr_token: string;
        ticket_status: string;
    } | null;
}

interface TripInfo {
    id: string;
    departure_time: string;
    fare_amount: number;
    bus?: {
        bus_number: string;
        bus_type: string;
    } | null;
    route?: {
        origin?: { name: string } | null;
        destination?: { name: string } | null;
    } | null;
}

interface PassengerManifestProps {
    trip: TripInfo;
    bookings: ManifestBooking[];
}

export function PassengerManifest({ trip, bookings }: PassengerManifestProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSource, setFilterSource] = useState<"ALL" | "ONLINE" | "WALK_IN">("ALL");

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.seat_number.toString().includes(searchTerm) ||
            b.ticket?.qr_token?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSource = filterSource === "ALL" || b.booking_source === filterSource;

        return matchesSearch && matchesSource;
    });

    const handlePrint = () => {
        window.print();
    };

    const originName = trip.route?.origin?.name || "Origin";
    const destName = trip.route?.destination?.name || "Destination";
    const busNum = trip.bus?.bus_number || "Bus TBD";
    const tripDate = new Date(trip.departure_time);

    return (
        <div className="space-y-6">
            {/* Header & Controls - Hidden during print */}
            <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Trip Passenger Manifest</h2>
                    <p className="text-sm text-muted-foreground">
                        Unified passenger manifest for {originName} to {destName}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handlePrint} variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Manifest
                    </Button>
                </div>
            </div>

            {/* Print Header Banner */}
            <div className="hidden border-b pb-4 print:block">
                <h1 className="text-2xl font-black uppercase text-red-600">SUPERLINES TRANSPORTATION CO. INC.</h1>
                <p className="text-sm font-semibold">OFFICIAL PASSENGER MANIFEST & SEAT LIST</p>
                <div className="mt-4 grid grid-cols-4 gap-4 text-xs font-mono border-t pt-2">
                    <div>TRIP: {originName} ➔ {destName}</div>
                    <div>DATE: {tripDate.toLocaleDateString()}</div>
                    <div>TIME: {tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>BUS #: {busNum}</div>
                </div>
            </div>

            {/* Trip Info Card */}
            <Card className="print:border-none print:shadow-none">
                <CardHeader className="pb-3 print:hidden">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Bus className="h-5 w-5 text-blue-600" />
                            {originName} ➔ {destName}
                        </span>
                        <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                            {busNum}
                        </span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {tripDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {tripDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-semibold text-emerald-600">
                            Total Passengers: {bookings.length} / 45
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search & Filter Toolbar - Hidden on Print */}
                    <div className="mb-4 flex flex-col sm:flex-row gap-3 print:hidden">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search passenger name, seat #, QR token..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filterSource === "ALL" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterSource("ALL")}
                            >
                                All ({bookings.length})
                            </Button>
                            <Button
                                variant={filterSource === "ONLINE" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterSource("ONLINE")}
                            >
                                Online ({bookings.filter(b => b.booking_source === "ONLINE").length})
                            </Button>
                            <Button
                                variant={filterSource === "WALK_IN" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterSource("WALK_IN")}
                            >
                                Walk-in ({bookings.filter(b => b.booking_source === "WALK_IN").length})
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <tr className="text-left">
                                    <th className="p-3 w-16 text-center">Seat</th>
                                    <th className="p-3">Passenger Name</th>
                                    <th className="p-3">Contact</th>
                                    <th className="p-3">Source & Location</th>
                                    <th className="p-3">QR Ticket Token</th>
                                    <th className="p-3 text-center">Ticket Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((b) => (
                                        <tr key={b.id} className="border-b transition-colors hover:bg-muted/30">
                                            <td className="p-3 font-mono font-bold text-center text-blue-600 dark:text-blue-400">
                                                #{b.seat_number < 10 ? `0${b.seat_number}` : b.seat_number}
                                            </td>
                                            <td className="p-3 font-medium text-foreground">
                                                {b.passenger_name}
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground font-mono">
                                                {b.passenger_contact || "N/A"}
                                            </td>
                                            <td className="p-3 text-xs">
                                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${
                                                    b.booking_source === 'ONLINE'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                }`}>
                                                    {b.booking_source === 'ONLINE' ? '🌐 ONLINE' : `🏬 WALK-IN (${b.booking_terminal?.name || 'Terminal'})`}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono text-xs text-muted-foreground">
                                                {b.ticket?.qr_token || "Pending Token"}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    b.ticket?.ticket_status === 'USED'
                                                        ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200'
                                                        : b.ticket?.ticket_status === 'VALID'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300'
                                                }`}>
                                                    {b.ticket?.ticket_status || b.booking_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No passenger bookings found for this trip.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Print Footer Signatures */}
                    <div className="mt-12 hidden grid-cols-2 gap-8 text-xs print:grid border-t pt-4">
                        <div>
                            <p className="font-semibold">Prepared By (Teller / Dispatcher):</p>
                            <div className="mt-8 border-b border-black w-48"></div>
                            <p className="mt-1 text-[10px] text-zinc-500">Signature Over Printed Name</p>
                        </div>
                        <div>
                            <p className="font-semibold">Verified By (Bus Conductor):</p>
                            <div className="mt-8 border-b border-black w-48"></div>
                            <p className="mt-1 text-[10px] text-zinc-500">Signature Over Printed Name</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
