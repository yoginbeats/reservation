"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Armchair, ArrowLeft, Loader2, Check, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createWalkInReservationAction } from "@/app/actions/walk-in";
import { use } from "react";

interface LayoutRow {
    type: string;
    row: (number | null)[];
    gapLabel?: string;
    isLast?: boolean;
}

export default function WalkInBookingForm({ params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [trip, setTrip] = useState<any>(null);
    const [reservations, setReservations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [passengerName, setPassengerName] = useState("");
    const [passengerType, setPassengerType] = useState("regular");
    const [idNumber, setIdNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            const { data: tripData } = await supabase
                .from('trips')
                .select('*, buses(*)')
                .eq('id', tripId)
                .single();

            const { data: resData } = await supabase
                .from('reservations')
                .select('seat_number, status')
                .eq('trip_id', tripId)
                .neq('status', 'cancelled');

            setTrip(tripData);
            setReservations(resData || []);
            setIsLoading(false);
        };
        fetchDetails();
    }, [tripId]);

    const handleBooking = async () => {
        if (!selectedSeat) return toast.error("Please select a seat.");
        if (!passengerName.trim()) return toast.error("Please enter passenger name.");
        if (passengerType !== "regular" && !idNumber.trim()) return toast.error("Please enter ID number for discounted tickets.");

        setIsSubmitting(true);
        const result = await createWalkInReservationAction(
            tripId,
            selectedSeat,
            passengerName,
            passengerType,
            idNumber || null
        );

        if (result.success) {
            toast.success("Walk-in passenger booked successfully!");
            router.push(`/admin/trips/${tripId}/manifest`);
        } else {
            toast.error(result.error || "Failed to book passenger.");
            setIsSubmitting(false);
        }
    };

    if (isLoading || !trip) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    const busType = trip.buses?.bus_type || "Regular Aircon";
    const isRegular = busType.toLowerCase().includes('regular');

    const deluxeLayoutRows: LayoutRow[] = [
        { type: 'seats', row: [1, 2, 3, 4] },
        { type: 'seats', row: [5, 6, 7, 8] },
        { type: 'seats', row: [9, 10, 11, 12] },
        { type: 'seats', row: [13, 14, 15, 16] },
        { type: 'seats', row: [17, 18, 19, 20] },
        { type: 'seats', row: [21, 22, null, null], gapLabel: 'Comfort Room' },
        { type: 'seats', row: [23, 24, null, null] },
        { type: 'seats', row: [25, 26, 27, 28] },
        { type: 'seats', row: [29, 30, 31, 32] },
        { type: 'seats', row: [33, 34, 35, 36] },
        { type: 'seats', row: [37, 38, 39, 40] },
        { type: 'seats', row: [41, 42, 43, 44, 45], isLast: true }
    ];

    const regularLayoutRows: LayoutRow[] = [
        { type: 'seats', row: [1, 2, 3, 4] },
        { type: 'seats', row: [5, 6, 7, 8] },
        { type: 'seats', row: [9, 10, 11, 12] },
        { type: 'seats', row: [13, 14, 15, 16] },
        { type: 'seats', row: [17, 18, 19, 20] },
        { type: 'seats', row: [21, 22, 23, 24] },
        { type: 'seats', row: [25, 26, 27, 28] },
        { type: 'seats', row: [29, 30, 31, 32] },
        { type: 'seats', row: [33, 34, 35, 36] },
        { type: 'seats', row: [37, 38, 39, 40] },
        { type: 'seats', row: [41, 42, 43, 44] },
        { type: 'seats', row: [45, 46, 47, 48, 49], isLast: true }
    ];

    const layoutRows = isRegular ? regularLayoutRows : deluxeLayoutRows;

    const isTaken = (seatNum: number) => {
        return reservations.some(r => r.seat_number === seatNum.toString());
    };

    const handleSeatClick = (seatNum: number) => {
        if (isTaken(seatNum)) return;
        setSelectedSeat(seatNum.toString());
    };

    const currentPrice = passengerType === 'discounted' ? trip.price * 0.8 : trip.price;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/walk-in">
                    <Button variant="outline" size="icon" className="rounded-full">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Process Walk-in Passenger</h1>
                    <p className="text-muted-foreground text-sm">{trip.origin} to {trip.destination} • {new Date(trip.departure_time).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Seat Map */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6">Select Seat</h3>
                    <div className="relative mx-auto max-w-sm rounded-[3rem] border-8 border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="col-span-2 text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Driver</span>
                            </div>
                            <div className="col-span-2 text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Entrance</span>
                            </div>
                        </div>

                        <div className="relative space-y-4">
                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-0">
                                <span className="text-[40px] font-black uppercase tracking-[0.5em] text-zinc-100 dark:text-zinc-900 vertical-text rotate-90 whitespace-nowrap select-none">
                                    Aisle
                                </span>
                            </div>

                            {layoutRows.map((layoutRow, rowIndex) => {
                                const row = layoutRow.row;
                                const isLast = layoutRow.isLast;

                                return (
                                    <div key={rowIndex} className="relative flex items-center justify-between z-10 font-bold">
                                        <div className="flex gap-3">
                                            {row.slice(0, 2).map((seatNum, idx) => {
                                                if (seatNum === null) return <div key={idx} className="w-9 h-9" />;
                                                return <SeatButton key={seatNum} num={seatNum} taken={isTaken(seatNum)} selected={selectedSeat === seatNum.toString()} onClick={() => handleSeatClick(seatNum)} />;
                                            })}
                                        </div>

                                        {isLast ? (
                                            <div className="contents">
                                                <SeatButton num={row[2]!} taken={isTaken(row[2]!)} selected={selectedSeat === row[2]!.toString()} onClick={() => handleSeatClick(row[2]!)} />
                                            </div>
                                        ) : (
                                            <div className="w-6" /> // Aisle
                                        )}

                                        <div className="flex gap-3 relative">
                                            {layoutRow.gapLabel && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                                                        {layoutRow.gapLabel}
                                                    </span>
                                                </div>
                                            )}
                                            {row.slice(isLast ? 3 : 2).map((seatNum, idx) => {
                                                if (seatNum === null) return <div key={idx} className="w-9 h-9" />;
                                                return <SeatButton key={seatNum} num={seatNum} taken={isTaken(seatNum)} selected={selectedSeat === seatNum.toString()} onClick={() => handleSeatClick(seatNum)} />;
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-8 flex items-center justify-center gap-6 w-full pt-6 border-t border-zinc-100 dark:border-zinc-900">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-600"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reserved</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-600"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Selected</span>
                        </div>
                    </div>
                </div>

                {/* Booking Form */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Passenger Details</CardTitle>
                            <CardDescription>Enter details for the walk-in passenger.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Selected Seat</Label>
                                <div className="h-10 px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center font-bold text-red-600">
                                    {selectedSeat ? `Seat ${selectedSeat}` : "No seat selected"}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input 
                                    placeholder="e.g. Juan Dela Cruz" 
                                    value={passengerName}
                                    onChange={(e) => setPassengerName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Passenger Type</Label>
                                    <Select value={passengerType} onValueChange={setPassengerType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="discounted">Discounted (20% Off)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {passengerType === 'discounted' && (
                                    <div className="space-y-2">
                                        <Label>ID Number</Label>
                                        <Input 
                                            placeholder="Student/PWD/Senior ID" 
                                            value={idNumber}
                                            onChange={(e) => setIdNumber(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-muted-foreground">Base Fare</span>
                                    <span>₱{trip.price.toLocaleString()}</span>
                                </div>
                                {passengerType === 'discounted' && (
                                    <div className="flex justify-between items-center mb-1 text-green-600 text-sm">
                                        <span>Discount (20%)</span>
                                        <span>- ₱{(trip.price * 0.2).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-4 text-xl font-bold">
                                    <span>Total Amount</span>
                                    <span className="text-red-600">₱{currentPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12"
                                disabled={!selectedSeat || !passengerName || isSubmitting}
                                onClick={handleBooking}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <UserPlus className="mr-2 h-5 w-5" />
                                )}
                                Confirm Walk-in Booking
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SeatButton({ num, taken, selected, onClick }: { num: number, taken: boolean, selected: boolean, onClick: () => void }) {
    if (taken) {
        return (
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border-2 border-red-600 bg-red-600 text-white cursor-not-allowed shadow-sm">
                <Armchair className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black border border-red-600 bg-white text-red-600">
                    {num}
                </span>
            </div>
        );
    }
    
    return (
        <button
            onClick={onClick}
            className={`
                relative flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all cursor-pointer shadow-sm
                hover:scale-105 active:scale-95
                ${selected 
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md' 
                    : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700'
                }
            `}
        >
            {selected ? <Check className="h-4 w-4" /> : <Armchair className="h-4 w-4" />}
            <span className={`
                absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black border
                ${selected 
                    ? 'bg-white text-emerald-600 border-emerald-600' 
                    : 'bg-white text-blue-600 border-blue-600'
                }
            `}>
                {num}
            </span>
        </button>
    );
}
