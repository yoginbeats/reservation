import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Bus, Calendar, Clock, MapPin, Users, Ticket, Tag } from "lucide-react";
import Link from "next/link";
import { VisualSeatMap } from "@/components/admin/visual-seat-map";
import { PrintButton } from "@/components/admin/print-button";

export default async function TripManifestPage({
    params
}: {
    params: Promise<{ tripId: string }>
}) {
    const { tripId } = await params;
    const supabase = await createClient();

    // Fetch Trip Details
    const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select(`
            *,
            buses (*)
        `)
        .eq('id', tripId)
        .single();

    if (tripError || !trip) {
        notFound();
    }

    // Fetch Reservations for this trip
    const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('trip_id', tripId)
        .order('seat_number', { ascending: true });

    const totalSeats = trip.buses?.total_seats || 49;
    const occupiedSeats = reservations?.length || 0;
    const availability = totalSeats - occupiedSeats;

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-6xl px-4 sm:px-6 print:p-0 print:m-0 print:max-w-none">
            {/* Print-only Header */}
            <div className="hidden print:block border-b-4 border-zinc-900 pb-6 mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase text-zinc-900">Superlines</h1>
                        <p className="text-sm font-bold tracking-widest uppercase text-zinc-500">Official Trip Manifest</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-400">Generated On</p>
                        <p className="text-sm font-bold">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>

            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href="/admin/trips"
                        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-blue-600 transition-colors group mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Schedules
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        Trip <span className="text-blue-600">Manifest</span>
                        <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-zinc-400 text-lg font-bold">#{trip.id.slice(0, 8).toUpperCase()}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <PrintButton />
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left Column: List and Stats */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <Users className="h-5 w-5 text-blue-600 mb-2" />
                                <div className="text-2xl font-black text-blue-600">{occupiedSeats}</div>
                                <p className="text-[10px] font-black uppercase text-blue-400">Booked</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <Ticket className="h-5 w-5 text-emerald-600 mb-2" />
                                <div className="text-2xl font-black text-emerald-600">{availability}</div>
                                <p className="text-[10px] font-black uppercase text-emerald-400">Available</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-red-50/50 dark:bg-red-900/10">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <Tag className="h-5 w-5 text-red-600 mb-2" />
                                <div className="text-2xl font-black text-red-600">₱{(occupiedSeats * trip.price).toLocaleString()}</div>
                                <p className="text-[10px] font-black uppercase text-red-400">Revenue</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Passenger List Table */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden rounded-[2rem] print:border-zinc-300 print:shadow-none print:rounded-none">
                        <CardHeader className="bg-zinc-50 dark:bg-zinc-900 p-8 border-b dark:border-zinc-800 print:bg-zinc-100 print:p-4">
                            <CardTitle className="text-lg font-black uppercase tracking-tight print:text-xl">Passenger Manifest</CardTitle>
                            <CardDescription className="print:text-zinc-600">Comprehensive list of travelers for this journey.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-zinc-50/50 dark:bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b dark:border-zinc-800">
                                            <th className="px-8 py-4">Seat</th>
                                            <th className="px-8 py-4">Name</th>
                                            <th className="px-8 py-4">Type</th>
                                            <th className="px-8 py-4">ID Number</th>
                                            <th className="px-8 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {reservations && reservations.length > 0 ? (
                                            reservations.map((res: any) => (
                                                <tr key={res.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                                    <td className="px-8 py-4">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-black">
                                                            {res.seat_number}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="font-bold text-sm tracking-tight">{res.passenger_name}</span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${res.passenger_type === 'regular' ? 'bg-zinc-100 text-zinc-600' : 'bg-red-100 text-red-600'}`}>
                                                            {res.passenger_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="text-xs font-medium text-zinc-400">
                                                            {res.id_number || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/30 uppercase">
                                                            {res.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground italic">
                                                    No passengers booked for this trip yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Trip Info & Visual Map */}
                <div className="space-y-8">
                    {/* Trip Summary Card */}
                    <Card className="border-0 shadow-2xl bg-zinc-950 text-white rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Trip Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <MapPin className="h-6 w-6 text-zinc-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-zinc-500">Route</p>
                                    <p className="font-bold text-lg">{trip.origin} → {trip.destination}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-zinc-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-zinc-500">Date & Time</p>
                                    <p className="font-bold">{new Date(trip.departure_time).toLocaleDateString()}, {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 border-t border-zinc-800 pt-6">
                                <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <Bus className="h-6 w-6 text-zinc-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-zinc-500">Vehicle</p>
                                    <p className="font-bold">{trip.buses?.bus_number} <span className="text-zinc-500 text-xs font-medium ml-2">{trip.buses?.bus_type}</span></p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visual Seat Map */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 px-2">Visual Occupancy</h3>
                        <VisualSeatMap
                            reservations={reservations || []}
                            busType={trip.buses?.bus_type}
                        />
                        <div className="flex items-center justify-center gap-6 pt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 print:text-zinc-900 print:pt-8 print:pb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-blue-600 print:border print:border-zinc-900" />
                                Regular
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-600 print:border print:border-zinc-900" />
                                Discounted
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-zinc-200 print:border print:border-zinc-400" />
                                Vacant
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 10mm 10mm; }
                    html, body { 
                        background: white !important; 
                        color: black !important; 
                        font-size: 10pt !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    /* Ensure main layout containers don't add margins */
                    main, .flex-1, .container { 
                        max-width: 100% !important; 
                        width: 100% !important; 
                        border: none !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                    }
                    
                    /* Hide only interactive UI elements */
                    button, a, .TooltipContent, .Toaster, [data-sidebar], aside, header, .mb-2 { display: none !important; }
                    
                    /* Remove shadows and reset layout */
                    .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { 
                        box-shadow: none !important; 
                        display: block !important; 
                        border: 1px solid #eee !important;
                    }
                    
                    /* Compact Header */
                    .print\:block.border-b-4 { margin-bottom: 1rem !important; padding-bottom: 0.5rem !important; border-bottom-width: 2px !important; }
                    
                    /* Force layout to be vertical and full width */
                    .grid { display: block !important; }
                    .lg\:grid-cols-3 { display: block !important; }
                    .lg\:col-span-2 { width: 100% !important; margin-bottom: 1rem !important; }
                    
                    /* Compact Stats */
                    .grid-cols-3 { display: flex !important; gap: 1rem !important; margin-bottom: 1rem !important; }
                    .grid-cols-3 .Card { margin-bottom: 0 !important; flex: 1; }
                    .grid-cols-3 .text-2xl { font-size: 1.25rem !important; }
                    
                    .Card { border: 1px solid #eee !important; border-radius: 0.5rem !important; margin-bottom: 1rem !important; }
                    .CardHeader { padding: 1rem !important; }
                    
                    /* The Manifest Table Card */
                    .lg\:col-span-2 > .Card { page-break-inside: auto !important; border: 1px solid #eee !important; }
                    .lg\:col-span-2 > .Card table { page-break-inside: auto !important; width: 100% !important; }
                    tr { page-break-inside: avoid !important; page-break-after: auto !important; border-bottom: 1px solid #eee !important; }
                    thead { display: table-header-group !important; }
                    
                    /* Table adjustments - More compact for A4 */
                    th, td { padding: 6px 10px !important; font-size: 9pt !important; }
                    th { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; text-transform: uppercase; font-size: 8pt !important; }
                    
                    /* Visual Occupancy section */
                    .lg\:grid-cols-3 > div:last-child { page-break-before: auto !important; }
                    .lg\:grid-cols-3 > div:last-child .Card { page-break-inside: avoid !important; }
                    
                    /* High contrast for seats */
                    .border-blue-600 { border: 1.5px solid #1e3a8a !important; background-color: #eff6ff !important; -webkit-print-color-adjust: exact; }
                    .border-red-600 { border: 1.5px solid #991b1b !important; background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; }
                    
                    /* Keep Seat Map visible and not too large */
                    .max-w-sm { max-width: 240px !important; margin: 0 auto !important; border-width: 3px !important; padding: 1rem !important; }
                    .h-9.w-9 { width: 28px !important; height: 28px !important; }
                    .h-4.w-4 { width: 14px !important; height: 14px !important; }
                }
            ` }} />
        </div>
    );
}
