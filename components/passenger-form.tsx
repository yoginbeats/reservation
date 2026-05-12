"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ArrowRight, ArrowLeft, Camera, CreditCard, AlertTriangle, Fingerprint, Shield, X, Loader2, ImageIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PassengerDetails {
    name: string;
    seatNumber: string;
    type: 'regular' | 'student' | 'senior' | 'pwd';
    price?: number;
    idNumber?: string;
    idPhotoUrl?: string;
}

interface PassengerFormProps {
    tripId: string;
    selectedSeats: string[];
    price: number;
    trip: {
        origin: string;
        destination: string;
        departure_time: string;
        price: number;
    };
    returnDate?: string;
    returnOrigin?: string;
    returnDestination?: string;
}

export function PassengerForm({ tripId, selectedSeats, price, trip, returnDate, returnOrigin, returnDestination }: PassengerFormProps) {
    const router = useRouter();
    const [passengers, setPassengers] = useState<PassengerDetails[]>(
        selectedSeats.map(seat => ({ name: "", seatNumber: seat, type: 'regular', idNumber: "", idPhotoUrl: "" }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [recentPassengers, setRecentPassengers] = useState<PassengerDetails[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchRecent = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('reservations')
                .select('passenger_name')
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                // Get unique passengers by name
                const unique = Array.from(new Map(data.map(item => [item.passenger_name, item])).values());
                setRecentPassengers(unique.map((p: { passenger_name: string }) => ({
                    name: p.passenger_name,
                    type: 'regular',
                    idNumber: "",
                    idPhotoUrl: "",
                    seatNumber: "" // Placeholder
                })));
            }
        };
        fetchRecent();
    }, [supabase]);

    const handleInputChange = (index: number, field: keyof PassengerDetails, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const calculatePassengerPrice = (type: string) => {
        if (type === 'regular') return price;
        return price * 0.8; // 20% discount
    };

    const totalDiscountedPrice = passengers.reduce((sum, p) => sum + calculatePassengerPrice(p.type), 0);
    const totalBasePrice = price * selectedSeats.length;
    const totalSavings = totalBasePrice - totalDiscountedPrice;

    const handleFileUpload = async (index: number, file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setUploadingIndex(index);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `id-proofs/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('id-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('id-photos')
                .getPublicUrl(filePath);

            handleInputChange(index, 'idPhotoUrl', publicUrl);
            toast.success("ID Photo uploaded successfully!");
        } catch (error: unknown) {
            console.error("Upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
            toast.error(errorMessage);
        } finally {
            setUploadingIndex(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that all discounted passengers have an ID photo
        const missingPhoto = passengers.find(p => p.type !== 'regular' && !p.idPhotoUrl);
        if (missingPhoto) {
            toast.error(`Please upload an ID photo for Seat ${missingPhoto.seatNumber}`);
            return;
        }

        setIsSubmitting(true);

        try {
            const bookingData = {
                tripId,
                passengers: passengers.map(p => ({
                    ...p,
                    price: calculatePassengerPrice(p.type)
                })),
                totalPrice: totalDiscountedPrice,
                returnDate,
                returnOrigin,
                returnDestination
            };

            sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

            // Redirect to a summary/checkout page (placeholder for now)
            router.push(`/book/${tripId}/checkout`);
        } catch (error) {
            console.error("Error saving passenger details:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
                <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 p-8 text-white shadow-2xl">
                    {/* Static Bus Background Effect */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
                        <MapPin className="h-64 w-64" />
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-3xl font-black tracking-tight leading-none">Passenger <span className="text-red-500">Details</span></h1>
                        <p className="mt-3 text-zinc-400 font-medium max-w-sm">Almost there! Please provide the names of the travelers for the selected seats.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {passengers.map((passenger, index) => (
                        <Card key={passenger.seatNumber} className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b dark:border-zinc-800 py-4">
                                <div className="space-y-4 w-full">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                                                {index + 1}
                                            </div>
                                            Passenger Info
                                        </CardTitle>
                                        <span className="bg-zinc-200 dark:bg-zinc-800 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                            Seat {passenger.seatNumber}
                                        </span>
                                    </div>

                                    {recentPassengers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 w-full mb-1">Quick Select Recent:</p>
                                            {recentPassengers.slice(0, 3).map((rp, i) => (
                                                <Button
                                                    key={i}
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-[10px] font-bold rounded-full border-zinc-200 hover:border-red-600 hover:text-red-600 dark:border-zinc-800"
                                                    onClick={() => {
                                                        const newPassengers = [...passengers];
                                                        newPassengers[index] = { ...rp, seatNumber: passenger.seatNumber };
                                                        setPassengers(newPassengers);
                                                        toast.success(`Filled details for ${rp.name}`);
                                                    }}
                                                >
                                                    <User className="h-3 w-3 mr-1" />
                                                    {rp.name.split(' ')[0]}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`name-${index}`} className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            Full Name
                                        </Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within:text-red-500" />
                                            <Input
                                                id={`name-${index}`}
                                                placeholder="Enter passenger's full name"
                                                value={passenger.name}
                                                onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                                required
                                                className="pl-12 h-14 rounded-xl border-zinc-200 bg-white focus-visible:ring-red-500 dark:bg-zinc-950 dark:border-zinc-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            Select Passenger Type (Available Discounts)
                                        </Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { id: 'regular', label: 'Regular', icon: User, discount: 'None' },
                                                { id: 'student', label: 'Student', icon: CreditCard, discount: '20% OFF' },
                                                { id: 'senior', label: 'Senior', icon: Shield, discount: '20% OFF' },
                                                { id: 'pwd', label: 'PWD', icon: AlertTriangle, discount: '20% OFF' }
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => handleInputChange(index, 'type', t.id as PassengerDetails['type'])}
                                                    className={`
                                                    flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1.5
                                                    ${passenger.type === t.id
                                                            ? 'border-red-600 bg-red-50 text-red-600 shadow-sm'
                                                            : 'border-zinc-100 bg-white text-zinc-400 hover:border-red-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800'
                                                        }
                                                `}
                                                >
                                                    <t.icon className={`h-4 w-4 ${passenger.type === t.id ? 'text-red-600' : 'text-zinc-300'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-tight">{t.label}</span>
                                                    {t.discount !== 'None' && (
                                                        <span className={`text-[8px] font-bold px-1 rounded ${passenger.type === t.id ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                                                            {t.discount}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-zinc-400 italic">Please select a type to apply available mandated discounts.</p>
                                    </div>

                                    {passenger.type !== 'regular' && (
                                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`id-${index}`} className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                        ID Number ({passenger.type})
                                                    </Label>
                                                    <div className="relative group">
                                                        <Fingerprint className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within:text-red-500" />
                                                        <Input
                                                            id={`id-${index}`}
                                                            placeholder="Enter ID number"
                                                            value={passenger.idNumber}
                                                            onChange={(e) => handleInputChange(index, 'idNumber', e.target.value)}
                                                            required
                                                            className="pl-12 h-14 rounded-xl border-zinc-200 bg-white focus-visible:ring-red-500 dark:bg-zinc-950 dark:border-zinc-800"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                        Upload ID Photo
                                                    </Label>
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            id={`photo-${index}`}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleFileUpload(index, file);
                                                            }}
                                                        />

                                                        {passenger.idPhotoUrl ? (
                                                            <div className="relative h-32 w-full rounded-xl overflow-hidden border-2 border-emerald-500 shadow-lg group/preview">
                                                                { }
                                                                <img
                                                                    src={passenger.idPhotoUrl}
                                                                    alt="ID Preview"
                                                                    className="h-full w-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = '/poster1.jpg'; // Fallback
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-white hover:text-red-400 bg-black/20"
                                                                        onClick={() => handleInputChange(index, 'idPhotoUrl', '')}
                                                                    >
                                                                        <X className="h-4 w-4 mr-1" />
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                                <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
                                                                    <ImageIcon className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={uploadingIndex === index}
                                                                className={`
                                                                w-full h-14 rounded-xl border-dashed border-2 transition-all flex items-center justify-center gap-2 text-zinc-500 hover:text-red-600
                                                                ${uploadingIndex === index ? 'bg-zinc-50' : 'border-zinc-200 hover:border-red-500 hover:bg-red-50/50 dark:border-zinc-800'}
                                                            `}
                                                                onClick={() => document.getElementById(`photo-${index}`)?.click()}
                                                            >
                                                                {uploadingIndex === index ? (
                                                                    <>
                                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                                        <span className="font-bold">Uploading...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Camera className="h-5 w-5" />
                                                                        <span className="font-bold">Attach Photo</span>
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20 flex gap-3">
                                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-tight text-amber-600">Important Reminder</p>
                                                    <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                                                        Please ensure the physical {passenger.type} ID is presented upon boarding. Failure to present the ID will require payment of the regular fare difference.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl font-bold gap-2 text-zinc-600 dark:text-zinc-400"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Seats
                    </Button>
                    <Button
                        type="submit"
                        className="flex-[2] h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-xl shadow-red-200 dark:shadow-none transition-all active:scale-[0.98] gap-3 uppercase tracking-tight"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Review Booking
                                <ArrowRight className="h-5 w-5 stroke-[3]" />
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* Booking Sidebar Summary (Now inside the client component for reactivity) */}
            <div className="space-y-6">
                <Card className="rounded-[2rem] border-0 shadow-2xl shadow-zinc-200/50 dark:shadow-none overflow-hidden sticky top-8">
                    <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b dark:border-zinc-800">
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Booking Summary</CardTitle>
                        <CardDescription>Review your journey</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-red-600 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-400">Departure</p>
                                    <p className="font-bold text-sm">{trip.origin}</p>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                                        <Loader2 className="h-3 w-3 hidden" /> {/* For spacing */}
                                        {new Date(trip.departure_time).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-zinc-400">Destination</p>
                                    <p className="font-bold text-sm">{trip.destination}</p>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400 font-medium">Selected Seats</span>
                                <span className="font-black text-zinc-900 dark:text-zinc-50">{selectedSeats.join(', ')}</span>
                            </div>

                            {passengers.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-400 font-medium lowercase">Seat {p.seatNumber} ({p.type})</span>
                                    <span className="font-bold text-zinc-500">
                                        ₱{calculatePassengerPrice(p.type).toLocaleString()}
                                    </span>
                                </div>
                            ))}

                            {totalSavings > 0 && (
                                <div className="flex justify-between items-center text-sm text-emerald-600 font-bold">
                                    <span>Total Discount</span>
                                    <span>-₱{totalSavings.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase text-red-600">Total Charged</span>
                                <span className="text-2xl font-black text-red-600">
                                    ₱{totalDiscountedPrice.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-2xl bg-blue-50/50 p-5 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Important Notice</p>
                    <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed font-medium">
                        Please ensure names match the IDs to be presented during boarding. Tickets are non-transferable once issued.
                    </p>
                </div>
            </div>
        </div>
    );
}

