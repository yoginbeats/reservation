"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Ticket,
    Calendar,
    Clock,
    Bus,
    MapPin,
    Printer,
    ShieldCheck,
    CheckCircle2,
    RotateCw,
    AlertTriangle,
    ArrowRight,
    DollarSign,
    RefreshCw,
    X,
    FileText,
    Check,
    Phone,
    User,
    Info,
    ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDatePH, formatTimePH, formatDateTimePH } from "@/lib/date-utils";

interface UserTicket {
    id: string;
    qr_token: string;
    ticket_status: string;
    created_at: string;
    refund_info?: {
        refund_ref: string;
        gcash_mobile_number: string;
        gcash_account_name: string;
        reason: string;
        original_fare: number;
        refund_amount: number;
        status: "PENDING_AUDIT" | "PROCESSING_GCASH" | "COMPLETED";
        requested_at: string;
        expected_settlement_timeline: string;
        estimated_settlement_date: string;
        status_notes?: string;
    };
    rebooking_info?: {
        rebooking_id: string;
        original_fare: number;
        hours_before_departure: number;
        is_within_3_days: boolean;
        deduction_rate: number;
        deduction_amount: number;
        usable_credit: number;
        new_fare: number;
        top_up_amount: number;
        rebooked_at: string;
        previous_trip: {
            origin: string;
            destination: string;
            departure_time: string;
            bus_number: string;
            seat_number: number;
        };
        new_trip: {
            origin: string;
            destination: string;
            departure_time: string;
            bus_number: string;
            seat_number: number;
        };
    };
    booking: {
        id: string;
        passenger_name: string;
        passenger_type?: string;
        discount_amount?: number;
        discount_count?: number;
        discounted_passengers?: Array<{ name: string; classification: string; id_number: string }>;
        discount_id?: string;
        original_price?: number;
        seat_number: number;
        seat_numbers?: number[];
        seat_count?: number;
        total_price: number;
        booking_source: string;
        passenger_id?: string | null;
        trip: {
            id?: string;
            departure_time: string;
            bus: { bus_number: string } | null;
            route: {
                origin: { name: string } | null;
                destination: { name: string } | null;
            } | null;
        } | null;
    } | null;
}

interface AvailableTrip {
    id: string;
    origin: string;
    destination: string;
    departure_time: string;
    fare_amount: number;
    bus_number: string;
    bus_type: string;
    seat_capacity: number;
    occupied_seats: number[];
}

function TicketsContent() {
    const [tickets, setTickets] = useState<UserTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const searchParams = useSearchParams();
    const paymentStatus = searchParams.get("payment");
    const statusParam = searchParams.get("status");
    const bookingId = searchParams.get("booking_id");
    const [isWaitingForApproval, setIsWaitingForApproval] = useState(statusParam === "pending_verification");
    const supabase = createClient();

    // Rebooking Modal State
    const [selectedTicketForRebooking, setSelectedTicketForRebooking] = useState<UserTicket | null>(null);
    const [availableTrips, setAvailableTrips] = useState<AvailableTrip[]>([]);
    const [tripsLoading, setTripsLoading] = useState(false);
    const [selectedTripForRebook, setSelectedTripForRebook] = useState<AvailableTrip | null>(null);
    const [selectedSeatForRebook, setSelectedSeatForRebook] = useState<number | null>(null);
    const [rebookSubmitting, setRebookSubmitting] = useState(false);
    const [rebookError, setRebookError] = useState<string | null>(null);
    const [rebookSuccess, setRebookSuccess] = useState<any | null>(null);

    // Online GCash Refund Modal State
    const [selectedTicketForRefund, setSelectedTicketForRefund] = useState<UserTicket | null>(null);
    const [gcashMobileInput, setGcashMobileInput] = useState("");
    const [gcashNameInput, setGcashNameInput] = useState("");
    const [refundReasonInput, setRefundReasonInput] = useState("Change of Travel Schedule");
    const [refundSubmitting, setRefundSubmitting] = useState(false);
    const [refundError, setRefundError] = useState<string | null>(null);
    const [refundSuccess, setRefundSuccess] = useState<any | null>(null);

    // Printable Slips State
    const [viewingRefundSlip, setViewingRefundSlip] = useState<any | null>(null);
    const [viewingBoardingPass, setViewingBoardingPass] = useState<UserTicket | null>(null);

    const fetchTickets = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        let fetchedTickets: UserTicket[] = [];

        if (user) {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    id,
                    qr_token,
                    ticket_status,
                    created_at,
                    booking:bookings!inner(
                        id,
                        passenger_name,
                        seat_number,
                        total_price,
                        booking_source,
                        passenger_id,
                        trip:trips(
                            id,
                            departure_time,
                            bus:buses(bus_number),
                            route:routes(
                                origin:origin_terminal_id(name),
                                destination:destination_terminal_id(name)
                            )
                        )
                    )
                `)
                .eq('booking.passenger_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn("Tickets relation query fallback:", error.message || error);
                try {
                    const { data: userReservations } = await supabase
                        .from('reservations')
                        .select('*, trip:trips(*)')
                        .eq('customer_id', user.id)
                        .order('created_at', { ascending: false });

                    if (userReservations && userReservations.length > 0) {
                        const resIds = userReservations.map((r: any) => r.id);
                        const { data: rawTickets } = await supabase
                            .from('tickets')
                            .select('*')
                            .in('reservation_id', resIds);

                        const ticketMap = new Map((rawTickets || []).map((t: any) => [t.reservation_id, t]));

                        const formattedTickets: UserTicket[] = userReservations.map((res: any) => {
                            const matchingTicket = ticketMap.get(res.id);
                            const trip = res.trip;
                            return {
                                id: matchingTicket?.id || res.id,
                                qr_token: matchingTicket?.qr_code || matchingTicket?.qr_token || `TKT-${res.id.slice(0, 8).toUpperCase()}`,
                                ticket_status: matchingTicket?.ticket_status || (res.status === 'CONFIRMED' || res.status === 'confirmed' ? 'VALID' : 'PENDING'),
                                created_at: res.created_at,
                                booking: {
                                    id: res.id,
                                    passenger_name: res.passenger_name || user.user_metadata?.full_name || "Passenger",
                                    seat_number: res.seat_number,
                                    total_price: res.total_price || 850,
                                    booking_source: "ONLINE",
                                    passenger_id: res.customer_id,
                                    trip: {
                                        id: trip?.id,
                                        departure_time: trip?.departure_time || new Date().toISOString(),
                                        bus: { bus_number: "Superlines Express" },
                                        route: {
                                            origin: { name: trip?.origin || "Cubao" },
                                            destination: { name: trip?.destination || "Daet" },
                                        }
                                    }
                                }
                            };
                        });
                        fetchedTickets = formattedTickets;
                    }
                } catch (fallbackErr) {
                    console.error("Fallback ticket fetch error:", fallbackErr);
                }
            } else if (data) {
                fetchedTickets = data as any;
            }
        }

        // Integrate client-side ticket storage (guest bookings & offline resilience)
        if (typeof window !== "undefined") {
            try {
                const keys = Object.keys(localStorage).filter(k => k.startsWith("superlines_booking_"));
                const localTickets: UserTicket[] = keys.map(k => {
                    const raw = localStorage.getItem(k);
                    if (!raw) return null;
                    const item = JSON.parse(raw);
                    return {
                        id: item.booking_id,
                        qr_token: item.qr_token,
                        ticket_status: item.ticket_status || "VALID",
                        created_at: item.created_at || new Date().toISOString(),
                        refund_info: item.refund_info,
                        rebooking_info: item.rebooking_info,
                        booking: {
                            id: item.booking_id,
                            passenger_name: item.passenger_name,
                            passenger_type: item.passenger_type || "REGULAR",
                            discount_amount: item.discount_amount || 0,
                            discount_count: item.discount_count || 0,
                            discounted_passengers: item.discounted_passengers || [],
                            discount_id: item.discount_id || "",
                            original_price: item.original_price || item.total_price,
                            seat_number: item.seat_number,
                            seat_numbers: item.seat_numbers || [item.seat_number],
                            seat_count: item.seat_count || (item.seat_numbers?.length || 1),
                            total_price: item.total_price,
                            booking_source: "ONLINE",
                            passenger_id: item.passenger_id || null,
                            trip: {
                                id: item.trip?.id,
                                departure_time: item.trip?.departure_time || new Date().toISOString(),
                                bus: { bus_number: item.trip?.bus?.bus_number || item.trip?.bus_number || "Superlines Express" },
                                route: {
                                    origin: { name: item.trip?.origin || item.trip?.route?.origin?.name || "Cubao" },
                                    destination: { name: item.trip?.destination || item.trip?.route?.destination?.name || "Daet" }
                                }
                            }
                        }
                    };
                }).filter(Boolean) as UserTicket[];

                if (localTickets.length > 0) {
                    const existingIds = new Set(fetchedTickets.map(t => t.id || t.booking?.id));
                    const additions = localTickets.filter(lt => !existingIds.has(lt.id) && !existingIds.has(lt.booking?.id));
                    fetchedTickets = [...additions, ...fetchedTickets];
                }
            } catch (err) {
                console.warn("Could not read local tickets:", err);
            }
        }

        // Fetch registered refunds to synchronize ticket status
        try {
            const refundRes = await fetch("/api/tickets/refund?all=true");
            const refundJson = await refundRes.json();
            if (refundJson?.success && Array.isArray(refundJson.refunds)) {
                const refundMap = new Map<string, any>(refundJson.refunds.map((r: any) => [r.refund_ref, r]));
                
                fetchedTickets = fetchedTickets.map(t => {
                    const matchingRefund = refundJson.refunds.find((r: any) =>
                        r.refund_ref === t.refund_info?.refund_ref ||
                        r.original_fare === t.booking?.total_price
                    );

                    if (t.refund_info) {
                        return {
                            ...t,
                            ticket_status: "REFUND_PENDING",
                            refund_info: refundMap.get(t.refund_info.refund_ref) || t.refund_info,
                        };
                    }
                    if (matchingRefund && t.ticket_status === "CANCELLED") {
                        return {
                            ...t,
                            ticket_status: "REFUND_PENDING",
                            refund_info: matchingRefund,
                        };
                    }
                    return t;
                });
            }
        } catch {}

        setTickets(fetchedTickets);
        setLoading(false);
    };

    useEffect(() => {
        if (paymentStatus === "success" && bookingId) {
            setPaymentVerified(true);
            setIsWaitingForApproval(false);
            fetch(`/api/payments/paymongo/verify?booking_id=${bookingId}`)
                .then((res) => res.json())
                .then(() => fetchTickets())
                .catch(() => fetchTickets());
        } else if (isWaitingForApproval && bookingId) {
            fetchTickets();
            const pollInterval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/payments/paymongo/verify?booking_id=${bookingId}`);
                    const data = await res.json();
                    if (data.status === "PAID" || data.status === "CONFIRMED") {
                        setIsWaitingForApproval(false);
                        setPaymentVerified(true);
                        clearInterval(pollInterval);
                        await fetchTickets();
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                }
            }, 2500);

            return () => clearInterval(pollInterval);
        } else {
            fetchTickets();
        }
    }, [paymentStatus, bookingId, isWaitingForApproval]);

    // Open Rebook Modal and fetch available trip schedules
    const handleOpenRebooking = async (ticket: UserTicket) => {
        setSelectedTicketForRebooking(ticket);
        setSelectedTripForRebook(null);
        setSelectedSeatForRebook(null);
        setRebookError(null);
        setRebookSuccess(null);
        setTripsLoading(true);

        try {
            const origin = ticket.booking?.trip?.route?.origin?.name || "Cubao";
            const dest = ticket.booking?.trip?.route?.destination?.name || "Daet";
            const res = await fetch(`/api/trips/available?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}`);
            const data = await res.json();
            if (data?.success && Array.isArray(data.trips)) {
                setAvailableTrips(data.trips);
                if (data.trips.length > 0) {
                    setSelectedTripForRebook(data.trips[0]);
                }
            }
        } catch (e) {
            console.error("Error loading trips for rebooking:", e);
        } finally {
            setTripsLoading(false);
        }
    };

    // Calculate dynamic 20% deduction policy for rebooking
    const getRebookCalculation = (ticket: UserTicket, targetTrip?: AvailableTrip | null) => {
        const depStr = ticket.booking?.trip?.departure_time;
        const depTime = depStr ? new Date(depStr) : new Date();
        const now = new Date();
        const diffMs = depTime.getTime() - now.getTime();
        const hoursLeft = Math.max(0, diffMs / (1000 * 60 * 60));
        
        // 🎯 20% DEDUCTION POLICY:
        // Within 3 days (<= 72 hours) prior to departure -> 20% automatic penalty
        // More than 3 days (> 72 hours) -> 0% penalty (FREE Rebooking)
        const isWithin3Days = hoursLeft <= 72;
        const originalFare = ticket.booking?.total_price || 850;
        const deductionRate = isWithin3Days ? 0.20 : 0.00;
        const deductionAmount = isWithin3Days ? Math.round(originalFare * 0.20) : 0;
        const usableCredit = originalFare - deductionAmount;
        const newFare = Number(targetTrip?.fare_amount || 850);
        const topUpAmount = Math.max(0, newFare - usableCredit);

        return {
            hoursLeft: Math.round(hoursLeft * 10) / 10,
            isWithin3Days,
            originalFare,
            deductionRate,
            deductionAmount,
            usableCredit,
            newFare,
            topUpAmount,
        };
    };

    // Confirm Rebooking API call
    const handleConfirmRebooking = async () => {
        if (!selectedTicketForRebooking || !selectedTripForRebook || !selectedSeatForRebook) return;
        setRebookSubmitting(true);
        setRebookError(null);

        try {
            const res = await fetch("/api/tickets/rebook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    booking_id: selectedTicketForRebooking.booking?.id || selectedTicketForRebooking.id,
                    qr_token: selectedTicketForRebooking.qr_token,
                    new_trip: {
                        id: selectedTripForRebook.id,
                        origin: selectedTripForRebook.origin,
                        destination: selectedTripForRebook.destination,
                        departure_time: selectedTripForRebook.departure_time,
                        bus_number: selectedTripForRebook.bus_number,
                        fare_amount: selectedTripForRebook.fare_amount || 850,
                    },
                    new_seat_number: selectedSeatForRebook,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setRebookSuccess(data.rebooking);

                // Update localStorage if guest
                if (typeof window !== "undefined") {
                    const localKey = `superlines_booking_${selectedTicketForRebooking.booking?.id || selectedTicketForRebooking.id}`;
                    const raw = localStorage.getItem(localKey);
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw);
                            parsed.seat_number = selectedSeatForRebook;
                            parsed.seat_numbers = [selectedSeatForRebook];
                            parsed.trip = {
                                origin: selectedTripForRebook.origin,
                                destination: selectedTripForRebook.destination,
                                departure_time: selectedTripForRebook.departure_time,
                                bus_number: selectedTripForRebook.bus_number,
                            };
                            parsed.rebooking_info = data.rebooking;
                            localStorage.setItem(localKey, JSON.stringify(parsed));
                        } catch {}
                    }
                }

                await fetchTickets();
            } else {
                setRebookError(data.error || "Failed to rebook trip.");
            }
        } catch (err: any) {
            setRebookError(err.message || "An unexpected network error occurred.");
        } finally {
            setRebookSubmitting(false);
        }
    };

    // Open GCash Refund Modal
    const handleOpenRefund = (ticket: UserTicket) => {
        setSelectedTicketForRefund(ticket);
        setGcashMobileInput("");
        setGcashNameInput(ticket.booking?.passenger_name || "");
        setRefundReasonInput("Change of Travel Schedule");
        setRefundError(null);
        setRefundSuccess(null);
    };

    // Submit GCash Refund Claim
    const handleConfirmRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketForRefund) return;

        const cleanMobile = gcashMobileInput.trim().replace(/[^0-9]/g, "");
        if (cleanMobile.length < 10) {
            setRefundError("Please enter a valid 11-digit GCash mobile number (e.g. 09171234567).");
            return;
        }

        if (!gcashNameInput.trim()) {
            setRefundError("Please enter the registered GCash account owner's full name.");
            return;
        }

        setRefundSubmitting(true);
        setRefundError(null);

        try {
            const res = await fetch("/api/tickets/refund", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    booking_id: selectedTicketForRefund.booking?.id || selectedTicketForRefund.id,
                    qr_token: selectedTicketForRefund.qr_token,
                    gcash_mobile: cleanMobile,
                    gcash_name: gcashNameInput.trim(),
                    reason: refundReasonInput.trim(),
                }),
            });

            const data = await res.json();
            if (data.success) {
                setRefundSuccess(data.refund);

                // Update local storage
                if (typeof window !== "undefined") {
                    const localKey = `superlines_booking_${selectedTicketForRefund.booking?.id || selectedTicketForRefund.id}`;
                    const raw = localStorage.getItem(localKey);
                    if (raw) {
                        try {
                            const parsed = JSON.parse(raw);
                            parsed.ticket_status = "REFUND_PENDING";
                            parsed.booking_status = "CANCELLED";
                            parsed.payment_status = "REFUND_PENDING";
                            parsed.refund_info = data.refund;
                            localStorage.setItem(localKey, JSON.stringify(parsed));
                        } catch {}
                    }
                }

                await fetchTickets();
            } else {
                setRefundError(data.error || "Failed to submit GCash refund request.");
            }
        } catch (err: any) {
            setRefundError(err.message || "An unexpected network error occurred.");
        } finally {
            setRefundSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto max-w-5xl py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">My Digital Tickets</h1>
                    <p className="text-muted-foreground">
                        Manage your trips, rebook departures, or file GCash refund claims with live tracking.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchTickets}
                        className="text-xs font-semibold"
                        disabled={loading}
                    >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh Tickets
                    </Button>
                </div>
            </div>

            {/* Waiting for Cashier Approval Banner */}
            {isWaitingForApproval && (
                <div className="flex items-start gap-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/40 dark:to-zinc-900 p-5 text-amber-900 dark:text-amber-200 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md">
                        <Clock className="h-5 w-5 animate-spin" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-extrabold text-base flex items-center gap-2">
                                <span>Awaiting Cashier Approval...</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 animate-pulse">
                                    Live Sync Active
                                </span>
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your payment reference has been submitted. As soon as the Superlines Cashier confirms your payment, your validated digital ticket will automatically appear here in real-time!
                        </p>
                    </div>
                </div>
            )}

            {/* Payment Verified & Confirmed Banner */}
            {paymentVerified && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400 shadow-sm">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                    <div>
                        <p className="font-bold">Payment Verified & Ticket Issued!</p>
                        <p className="text-sm">Your booking #{bookingId?.slice(0, 8)} has been confirmed and your digital ticket is now active for boarding.</p>
                    </div>
                </div>
            )}

            {/* Tickets Grid */}
            {loading ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium">Loading your Superlines tickets...</p>
                </div>
            ) : tickets.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                    {tickets.map((t) => {
                        const booking = t.booking;
                        const trip = booking?.trip;
                        const origin = trip?.route?.origin?.name || "Cubao";
                        const dest = trip?.route?.destination?.name || "Daet";
                        const busNum = trip?.bus?.bus_number || "Superlines Express";
                        const depTime = trip?.departure_time ? new Date(trip.departure_time) : new Date();

                        // Departure calculations
                        const now = new Date();
                        const diffHours = (depTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                        const isDeparted = diffHours <= 0;
                        const isWithin3Days = diffHours > 0 && diffHours <= 72;
                        const isMoreThan3Days = diffHours > 72;

                        const isRefundPending = t.ticket_status === "REFUND_PENDING" || Boolean(t.refund_info);
                        const isValid = t.ticket_status === "VALID" && !isRefundPending;

                        return (
                            <Card key={t.id} className="relative overflow-hidden border-2 shadow-lg flex flex-col justify-between">
                                {/* Ticket Status Header Banner */}
                                <div className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white flex justify-between items-center ${
                                    isRefundPending
                                        ? 'bg-amber-600'
                                        : t.ticket_status === 'USED'
                                        ? 'bg-zinc-600'
                                        : isValid
                                        ? 'bg-emerald-600'
                                        : 'bg-yellow-600'
                                }`}>
                                    <span className="flex items-center gap-1.5">
                                        <Bus className="h-3.5 w-3.5" />
                                        Superlines Digital Ticket
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-black/20 text-[11px] font-black tracking-wide">
                                        {isRefundPending ? "REFUND PENDING (GCASH)" : t.ticket_status}
                                    </span>
                                </div>

                                <CardContent className="p-6 space-y-5 flex-1">
                                    {/* Lead Passenger & Seat */}
                                    <div className="flex items-start justify-between border-b pb-3">
                                        <div>
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Lead Passenger</p>
                                            <p className="font-extrabold text-base text-foreground">{booking?.passenger_name || "Passenger"}</p>
                                            
                                            {/* Discount Badges */}
                                            {booking?.discounted_passengers && booking.discounted_passengers.length > 0 ? (
                                                <div className="mt-1.5 space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                                        Beneficiaries ({booking.discounted_passengers.length}):
                                                    </p>
                                                    {booking.discounted_passengers.map((dp, idx) => (
                                                        <span key={idx} className="inline-block mr-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border border-purple-200">
                                                            20% {dp.classification}: {dp.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : booking?.passenger_type && booking.passenger_type !== "REGULAR" ? (
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                    20% {booking.passenger_type} DISCOUNT
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                {booking?.seat_numbers && booking.seat_numbers.length > 1 ? "Seats" : "Seat"}
                                            </p>
                                            <p className="font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
                                                {booking?.seat_numbers && booking.seat_numbers.length > 1
                                                    ? booking.seat_numbers.map((s) => `#${s < 10 ? `0${s}` : s}`).join(", ")
                                                    : `#${booking?.seat_number ? (booking.seat_number < 10 ? `0${booking.seat_number}` : booking.seat_number) : "--"}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Route & Bus Details */}
                                    <div className="space-y-1 bg-muted/30 p-3 rounded-lg border">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Route & Bus Unit</p>
                                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                ₱{booking?.total_price || 850}.00
                                            </span>
                                        </div>
                                        <p className="text-lg font-black flex items-center gap-2">
                                            <span>{origin}</span>
                                            <ArrowRight className="h-4 w-4 text-blue-600" />
                                            <span>{dest}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span>{busNum}</span>
                                            <span>•</span>
                                            <span className="font-medium text-foreground">
                                                {formatDateTimePH(trip?.departure_time || depTime)}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Departure Countdown & Policy Alert Badge */}
                                    {!isDeparted && isValid && (
                                        <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                            isWithin3Days
                                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                                                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                                        }`}>
                                            <div className="flex items-center gap-2 font-medium">
                                                {isWithin3Days ? (
                                                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                )}
                                                <span>
                                                    {isWithin3Days
                                                        ? `Departing in ${Math.round(diffHours)}h (Within 3 Days: 20% rebook penalty applies)`
                                                        : `Departing in ${Math.round(diffHours / 24)} days (Early Rebooking: 0% Fee / Free!)`}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rebooking Stamp Notice (if this ticket was previously rebooked) */}
                                    {t.rebooking_info && (
                                        <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                                            <div className="flex items-center justify-between font-bold">
                                                <span className="flex items-center gap-1.5">
                                                    <RotateCw className="h-3.5 w-3.5" />
                                                    Rebooked Ticket (#{t.rebooking_info.rebooking_id})
                                                </span>
                                                <span className="font-mono text-[10px]">
                                                    {new Date(t.rebooking_info.rebooked_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Previous departure was {new Date(t.rebooking_info.previous_trip.departure_time).toLocaleDateString()}.
                                                {t.rebooking_info.is_within_3_days ? (
                                                    <span className="text-amber-700 dark:text-amber-300 font-semibold ml-1">
                                                        20% Penalty (₱{t.rebooking_info.deduction_amount}.00) was automatically deducted from prior payment.
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold ml-1">
                                                        Rebooked with 0% penalty (100% credit applied).
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {/* GCash Refund In-Progress Card */}
                                    {isRefundPending && (
                                        <div className="rounded-xl border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-zinc-900 p-4 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                                                        <Clock className="h-3 w-3" />
                                                        GCash Refund Active
                                                    </span>
                                                    <p className="font-mono text-sm font-extrabold text-foreground mt-1">
                                                        Ref: {t.refund_info?.refund_ref || `RFND-${t.id.slice(0, 8).toUpperCase()}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">Refund Amount</p>
                                                    <p className="font-mono text-base font-black text-emerald-600">
                                                        ₱{t.refund_info?.refund_amount || booking?.total_price || 850}.00
                                                    </p>
                                                </div>
                                            </div>

                                            {/* GCash SLA Timeline Box */}
                                            <div className="rounded-lg bg-white/80 dark:bg-zinc-800/80 p-3 border text-xs space-y-2">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-200">
                                                    <span>Turnaround Timeline:</span>
                                                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                                        3 Business Days to 1 Week
                                                    </span>
                                                </div>

                                                {/* 4-Step Visual Progress Bar */}
                                                <div className="grid grid-cols-4 gap-1 text-center text-[9px] pt-1 font-bold">
                                                    <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                                                        1. Filed ✅
                                                    </div>
                                                    <div className="p-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 animate-pulse">
                                                        2. Audit ⏳
                                                    </div>
                                                    <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200">
                                                        3. GCash Hub
                                                    </div>
                                                    <div className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200">
                                                        4. Credited 📱
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                                                    Destination: <strong>{t.refund_info?.gcash_mobile_number || "GCash Wallet"}</strong> ({t.refund_info?.gcash_account_name || booking?.passenger_name}). Direct wallet credit takes 3-7 business days per GCash clearing regulations.
                                                </p>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-bold border-amber-400 bg-white dark:bg-zinc-800 hover:bg-amber-50"
                                                onClick={() => setViewingRefundSlip(t.refund_info || {
                                                    refund_ref: `RFND-${t.id.slice(0, 8).toUpperCase()}`,
                                                    gcash_mobile_number: "09XX-XXX-XXXX",
                                                    gcash_account_name: booking?.passenger_name,
                                                    refund_amount: booking?.total_price || 850,
                                                    requested_at: t.created_at,
                                                    expected_settlement_timeline: "3 Business Days - 1 Week",
                                                    estimated_settlement_date: "3-7 Days",
                                                    reason: "Passenger online cancellation",
                                                })}
                                            >
                                                <FileText className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                                                View Official Refund Acknowledgment Slip
                                            </Button>
                                        </div>
                                    )}

                                    {/* QR Code Container (shown only if ticket is valid) */}
                                    {isValid && (
                                        <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 p-4 border border-dashed">
                                            <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-white p-2 border shadow-inner">
                                                <svg viewBox="0 0 100 100" className="h-full w-full">
                                                    <rect width="100" height="100" fill="white" />
                                                    <rect x="5" y="5" width="25" height="25" fill="black" />
                                                    <rect x="8" y="8" width="19" height="19" fill="white" />
                                                    <rect x="12" y="12" width="11" height="11" fill="black" />

                                                    <rect x="70" y="5" width="25" height="25" fill="black" />
                                                    <rect x="73" y="8" width="19" height="19" fill="white" />
                                                    <rect x="77" y="12" width="11" height="11" fill="black" />

                                                    <rect x="5" y="70" width="25" height="25" fill="black" />
                                                    <rect x="8" y="73" width="19" height="19" fill="white" />
                                                    <rect x="12" y="77" width="11" height="11" fill="black" />

                                                    <rect x="35" y="10" width="10" height="10" fill="black" />
                                                    <rect x="50" y="20" width="10" height="10" fill="black" />
                                                    <rect x="10" y="35" width="10" height="10" fill="black" />
                                                    <rect x="35" y="35" width="20" height="20" fill="black" />
                                                    <rect x="65" y="35" width="10" height="10" fill="black" />
                                                    <rect x="40" y="65" width="15" height="15" fill="black" />
                                                    <rect x="70" y="70" width="20" height="20" fill="black" />
                                                </svg>
                                            </div>
                                            <p className="mt-2 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wider">
                                                {t.qr_token}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons for Valid Tickets */}
                                    {isValid && !isDeparted && (
                                        <div className="pt-2 border-t grid grid-cols-2 gap-2">
                                            {/* Rebook Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-bold border-blue-500/50 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                onClick={() => handleOpenRebooking(t)}
                                            >
                                                <RotateCw className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                                                Rebook Trip
                                            </Button>

                                            {/* Online GCash Refund Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs font-bold border-rose-500/50 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                                onClick={() => handleOpenRefund(t)}
                                            >
                                                <DollarSign className="mr-1.5 h-3.5 w-3.5 text-rose-600" />
                                                GCash Refund
                                            </Button>
                                        </div>
                                    )}

                                    {/* Print Boarding Pass Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
                                        onClick={() => setViewingBoardingPass(t)}
                                    >
                                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                                        Print Boarding Pass / Thermal Stub
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-12 text-center text-muted-foreground">
                    <Ticket className="mx-auto h-12 w-12 text-zinc-400 mb-3" />
                    <h3 className="text-lg font-bold text-foreground">No Tickets Found</h3>
                    <p className="text-sm mt-1">You haven&apos;t booked any tickets yet.</p>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/book'}>
                        Book a Trip Now
                    </Button>
                </Card>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: TRIP REBOOKING (WITH AUTOMATIC 20% DEDUCTION WITHIN 3 DAYS)      */}
            {/* ========================================================================= */}
            {selectedTicketForRebooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border shadow-2xl p-6 space-y-5 my-8">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                                    <RotateCw className="h-5 w-5 text-blue-600" />
                                    Rebook Trip / Palit Biyahe
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Select a new schedule and seat. Automatic 20% deduction applies if within 3 days prior to travel.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedTicketForRebooking(null);
                                    setRebookSuccess(null);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {rebookSuccess ? (
                            <div className="space-y-4 py-4">
                                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center space-y-2">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                                    <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                                        Rebooking Confirmed!
                                    </h4>
                                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                        Your ticket has been re-issued with the new trip date and seat assignment.
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-xs">
                                    <div className="flex justify-between border-b pb-1.5 font-bold">
                                        <span>Rebooking Reference</span>
                                        <span className="font-mono text-blue-600">{rebookSuccess.rebooking_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>New Departure</span>
                                        <span className="font-semibold">
                                            {new Date(rebookSuccess.new_trip.departure_time).toLocaleDateString()} at {new Date(rebookSuccess.new_trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>New Assigned Seat</span>
                                        <span className="font-bold text-blue-600">Seat #{rebookSuccess.new_trip.seat_number}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1.5">
                                        <span>Policy Applied</span>
                                        <span className="font-semibold text-foreground">
                                            {rebookSuccess.is_within_3_days ? (
                                                <span className="text-amber-600 font-bold">20% Deduction (₱{rebookSuccess.deduction_amount}.00)</span>
                                            ) : (
                                                <span className="text-emerald-600 font-bold">0% Deduction (Free Rebooking)</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-bold text-sm pt-1 border-t">
                                        <span>Net Top-Up Balance Paid</span>
                                        <span className="font-mono text-emerald-600">₱{rebookSuccess.top_up_amount}.00</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs"
                                    onClick={() => {
                                        setSelectedTicketForRebooking(null);
                                        setRebookSuccess(null);
                                    }}
                                >
                                    Done & View Updated Boarding Pass
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Current Booking & Automatic 20% Policy Breakdown Card */}
                                {(() => {
                                    const calc = getRebookCalculation(selectedTicketForRebooking, selectedTripForRebook);
                                    return (
                                        <div className="rounded-xl border p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/40 dark:from-zinc-900 dark:to-zinc-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                                                    Current Ticket Information
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                                    calc.isWithin3Days
                                                        ? "bg-amber-200 text-amber-900 border border-amber-400"
                                                        : "bg-emerald-200 text-emerald-900 border border-emerald-400"
                                                }`}>
                                                    {calc.isWithin3Days
                                                        ? `⚠️ Departing in ${calc.hoursLeft}h: 20% Deduction Applies`
                                                        : `✨ Departing in ${calc.hoursLeft}h: 0% Deduction (Free Rebooking)`}
                                                </span>
                                            </div>

                                            {/* Deduction Math Table */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                                                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Previous Fare</p>
                                                    <p className="text-sm font-black font-mono mt-0.5">₱{calc.originalFare}.00</p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                                        {calc.isWithin3Days ? "20% Deduction" : "Deduction"}
                                                    </p>
                                                    <p className={`text-sm font-black font-mono mt-0.5 ${calc.isWithin3Days ? "text-amber-600" : "text-emerald-600"}`}>
                                                        {calc.isWithin3Days ? `-₱${calc.deductionAmount}.00` : "₱0.00"}
                                                    </p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Usable Credit</p>
                                                    <p className="text-sm font-black font-mono text-blue-600 mt-0.5">₱{calc.usableCredit}.00</p>
                                                </div>
                                                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Balance to Top-up</p>
                                                    <p className="text-sm font-black font-mono text-foreground mt-0.5">₱{calc.topUpAmount}.00</p>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-muted-foreground italic">
                                                * Notice: In accordance with Superlines policy, changes requested within 3 days (72 hours) prior to trip departure are subject to a 20% penalty fee automatically deducted from your previous transaction.
                                            </p>
                                        </div>
                                    );
                                })()}

                                {/* Step 1: Select New Departure Trip */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center justify-between">
                                        <span>1. Select New Travel Date & Departure</span>
                                        <span className="text-[11px] text-muted-foreground font-normal">
                                            {availableTrips.length} upcoming schedules available
                                        </span>
                                    </label>

                                    {tripsLoading ? (
                                        <div className="py-6 text-center text-xs text-muted-foreground">
                                            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-blue-600 mb-1" />
                                            Loading available departures...
                                        </div>
                                    ) : (
                                        <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                                            {availableTrips.map((trip) => {
                                                const isSelected = selectedTripForRebook?.id === trip.id;
                                                const tripDep = new Date(trip.departure_time);
                                                return (
                                                    <div
                                                        key={trip.id}
                                                        onClick={() => {
                                                            setSelectedTripForRebook(trip);
                                                            setSelectedSeatForRebook(null);
                                                        }}
                                                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                                            isSelected
                                                                ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500"
                                                                : "hover:border-zinc-400 bg-white dark:bg-zinc-950"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between font-bold">
                                                            <span>
                                                                {tripDep.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                                            </span>
                                                            <span className="text-blue-600 font-extrabold">
                                                                {tripDep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                                            {trip.origin} ➔ {trip.destination} • {trip.bus_type}
                                                        </p>
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 border-t pt-1">
                                                            <span>Fare: ₱{trip.fare_amount}.00</span>
                                                            <span className="text-emerald-600 font-semibold">
                                                                {45 - (trip.occupied_seats?.length || 0)} seats free
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Select New Seat (Interactive Grid 1 to 45) */}
                                {selectedTripForRebook && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center justify-between">
                                            <span>2. Choose New Seat Number (Bus Unit SL-401)</span>
                                            <span className="text-[11px] font-bold text-blue-600">
                                                {selectedSeatForRebook ? `Selected: Seat #${selectedSeatForRebook}` : "Please pick a seat"}
                                            </span>
                                        </label>

                                        {/* Seat Map Key */}
                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded bg-white dark:bg-zinc-800 border" /> Available
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded bg-blue-600 text-white" /> Selected
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="h-3 w-3 rounded bg-zinc-300 dark:bg-zinc-700" /> Booked
                                            </span>
                                        </div>

                                        {/* Bus Seat Grid */}
                                        <div className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center">
                                            {/* Driver Cab */}
                                            <div className="w-full max-w-xs flex justify-between items-center text-[10px] font-bold text-muted-foreground border-b pb-2 mb-3">
                                                <span>[FRONT / ENTRANCE]</span>
                                                <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">DRIVER CAB</span>
                                            </div>

                                            {/* 45 Seats Layout */}
                                            <div className="grid grid-cols-5 gap-2 max-w-xs w-full text-center">
                                                {Array.from({ length: 45 }, (_, i) => i + 1).map((seat) => {
                                                    const isOccupied = selectedTripForRebook.occupied_seats?.includes(seat);
                                                    const isCurrentSeat = seat === selectedTicketForRebooking.booking?.seat_number;
                                                    const isSelected = selectedSeatForRebook === seat;

                                                    // Middle aisle in 5-column grid (col 3 is aisle for rows 1 to 10)
                                                    return (
                                                        <button
                                                            key={seat}
                                                            type="button"
                                                            disabled={isOccupied}
                                                            onClick={() => setSelectedSeatForRebook(seat)}
                                                            className={`h-9 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center ${
                                                                isSelected
                                                                    ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400 scale-105"
                                                                    : isOccupied
                                                                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                                                    : isCurrentSeat
                                                                    ? "border-2 border-amber-500 bg-amber-50 text-amber-900"
                                                                    : "bg-white dark:bg-zinc-900 border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                            }`}
                                                            title={isOccupied ? `Seat ${seat} is occupied` : `Seat ${seat}`}
                                                        >
                                                            {seat < 10 ? `0${seat}` : seat}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error alert */}
                                {rebookError && (
                                    <div className="p-3 rounded-lg border border-red-500/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">
                                        {rebookError}
                                    </div>
                                )}

                                {/* Submit button */}
                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        variant="outline"
                                        className="w-1/3 text-xs"
                                        onClick={() => setSelectedTicketForRebooking(null)}
                                        disabled={rebookSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="w-2/3 bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                                        disabled={!selectedTripForRebook || !selectedSeatForRebook || rebookSubmitting}
                                        onClick={handleConfirmRebooking}
                                    >
                                        {rebookSubmitting ? (
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="mr-2 h-4 w-4" />
                                        )}
                                        Confirm Rebooking to Seat #{selectedSeatForRebook || "--"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: ONLINE GCASH REFUND (WITH 3-DAY TO 1-WEEK SLA ADVISORY)          */}
            {/* ========================================================================= */}
            {selectedTicketForRefund && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border shadow-2xl p-6 space-y-5 my-8">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-rose-600" />
                                    Online GCash Refund Request
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Submit a refund claim directly to your registered GCash wallet.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedTicketForRefund(null);
                                    setRefundSuccess(null);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {refundSuccess ? (
                            <div className="space-y-4 py-3">
                                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center space-y-2">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                                    <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                                        Refund Claim Submitted!
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Reference Number: <strong>{refundSuccess.refund_ref}</strong>
                                    </p>
                                </div>

                                {/* Official Claim Summary */}
                                <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-xs">
                                    <div className="flex justify-between border-b pb-1.5 font-bold">
                                        <span>Refund Amount to Receive</span>
                                        <span className="font-mono text-emerald-600 text-sm">₱{refundSuccess.refund_amount}.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Target GCash Mobile</span>
                                        <span className="font-mono font-semibold">{refundSuccess.gcash_mobile_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Account Name</span>
                                        <span className="font-semibold">{refundSuccess.gcash_account_name}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1.5">
                                        <span>Estimated Settlement</span>
                                        <span className="font-bold text-blue-600">3 Business Days - 1 Week</span>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 text-[11px] text-amber-900 dark:text-amber-200 border border-amber-300">
                                    <strong>Paunawa:</strong> Ang pondo ay pormal na ipapasa sa GCash Gateway matapos ang internal accounting audit. Awtomatikong papasok ito sa inyong GCash wallet sa loob ng 3 hanggang 7 business days kalakip ng opisyal na SMS text mula sa GCash.
                                </div>

                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-xs"
                                    onClick={() => {
                                        setSelectedTicketForRefund(null);
                                        setRefundSuccess(null);
                                    }}
                                >
                                    Close & Track on My Tickets
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleConfirmRefund} className="space-y-4">
                                {/* GCash SLA Advisory Callout */}
                                <div className="rounded-xl border border-blue-300 bg-blue-50/70 dark:bg-blue-950/40 p-4 space-y-2 text-xs">
                                    <div className="flex items-center gap-2 font-extrabold text-blue-950 dark:text-blue-100">
                                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <span>Bakit 3 Business Days hanggang 1 Linggo ang GCash Refund?</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Ayon sa settlement guidelines ng GCash at Merchant Banking Network, ang bawat online refund ay dumadaan sa dalawang yugto:
                                    </p>
                                    <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                                        <li><strong>Stage 1 (1-2 Days):</strong> Superlines Accounting Audit upang tiyakin na hindi pa nagamit o na-board ang ticket.</li>
                                        <li><strong>Stage 2 (3-5 Business Days):</strong> Pag-clear at wallet crediting ng GCash Payment Acquirer diretso sa inyong mobile number.</li>
                                    </ul>
                                </div>

                                {/* Ticket Details Summary */}
                                <div className="rounded-lg border bg-muted/40 p-3 text-xs flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground">Original Transaction Fare:</p>
                                        <p className="font-extrabold text-sm text-foreground">
                                            {selectedTicketForRefund.booking?.trip?.route?.origin?.name || "Cubao"} ➔ {selectedTicketForRefund.booking?.trip?.route?.destination?.name || "Daet"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground">Refundable Amount</p>
                                        <p className="font-mono text-base font-black text-emerald-600">
                                            ₱{selectedTicketForRefund.booking?.total_price || 850}.00
                                        </p>
                                    </div>
                                </div>

                                {/* GCash Mobile Number Input */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-blue-600" />
                                        GCash Registered Mobile Number
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={11}
                                        placeholder="09171234567"
                                        value={gcashMobileInput}
                                        onChange={(e) => setGcashMobileInput(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-950"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Must be the 11-digit mobile number linked to your GCash wallet.</p>
                                </div>

                                {/* GCash Account Owner Name Input */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-blue-600" />
                                        GCash Registered Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Juan Dela Cruz"
                                        value={gcashNameInput}
                                        onChange={(e) => setGcashNameInput(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-950"
                                    />
                                </div>

                                {/* Refund Reason Dropdown */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Reason for Refund / Cancellation
                                    </label>
                                    <select
                                        value={refundReasonInput}
                                        onChange={(e) => setRefundReasonInput(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-950"
                                    >
                                        <option value="Change of Travel Schedule">Change of Travel Schedule</option>
                                        <option value="Medical Emergency / Illness">Medical Emergency / Illness</option>
                                        <option value="Family / Personal Matters">Family / Personal Matters</option>
                                        <option value="Inclement Weather / Typhoon">Inclement Weather / Typhoon</option>
                                        <option value="Accidental Duplicate Booking">Accidental Duplicate Booking</option>
                                        <option value="Other Passenger Reasons">Other Passenger Reasons</option>
                                    </select>
                                </div>

                                {refundError && (
                                    <div className="p-3 rounded-lg border border-red-500/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs">
                                        {refundError}
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-1/3 text-xs"
                                        onClick={() => setSelectedTicketForRefund(null)}
                                        disabled={refundSubmitting}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-2/3 bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white"
                                        disabled={refundSubmitting}
                                    >
                                        {refundSubmitting ? (
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="mr-2 h-4 w-4" />
                                        )}
                                        Submit GCash Refund Claim
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: PRINTABLE GCASH REFUND CLAIM SLIP                                */}
            {/* ========================================================================= */}
            {viewingRefundSlip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border shadow-2xl p-6 space-y-4 my-8 font-mono text-xs">
                        {/* Printable Thermal Receipt Container */}
                        <div className="border-2 border-dashed border-zinc-400 p-5 space-y-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                            <div className="text-center space-y-1 border-b pb-3">
                                <h4 className="font-extrabold text-sm uppercase tracking-wider text-foreground">SUPERLINES TRANSPORTATION CO.</h4>
                                <p className="text-[10px] text-muted-foreground">Official GCash Electronic Refund Voucher</p>
                                <p className="font-black text-sm text-blue-600 mt-1">{viewingRefundSlip.refund_ref}</p>
                            </div>

                            <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between">
                                    <span>Date Filed:</span>
                                    <span>{new Date(viewingRefundSlip.requested_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Passenger Name:</span>
                                    <span className="font-bold">{viewingRefundSlip.gcash_account_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GCash Wallet Number:</span>
                                    <span className="font-bold">{viewingRefundSlip.gcash_mobile_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Reason:</span>
                                    <span>{viewingRefundSlip.reason}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-sm font-black">
                                    <span>REFUND AMOUNT:</span>
                                    <span className="text-emerald-600">₱{viewingRefundSlip.refund_amount}.00</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed pt-3 text-[10px] text-muted-foreground space-y-1">
                                <p className="font-bold text-foreground">SETTLEMENT TIMELINE:</p>
                                <p>• Standard Processing: 3 Business Days to 1 Week (3-7 working days).</p>
                                <p>• Notification: SMS will be received from GCash (2882) upon wallet adjustment.</p>
                                <p>• Helpline: support@superlines.ph | (02) 8928-8888</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="w-1/2 text-xs"
                                onClick={() => setViewingRefundSlip(null)}
                            >
                                Close
                            </Button>
                            <Button
                                className="w-1/2 bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                                onClick={() => window.print()}
                            >
                                <Printer className="mr-1.5 h-3.5 w-3.5" />
                                Print Voucher
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: THERMAL BOARDING PASS STUB MODAL                                 */}
            {/* ========================================================================= */}
            {viewingBoardingPass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border shadow-2xl p-6 space-y-4 my-8 font-mono text-xs">
                        <div className="border-2 border-dashed border-zinc-400 p-5 space-y-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                            <div className="text-center space-y-1 border-b pb-3">
                                <h4 className="font-extrabold text-sm uppercase tracking-wider text-foreground">SUPERLINES EXPRESS</h4>
                                <p className="text-[10px] text-muted-foreground">Official Passenger Boarding Pass</p>
                                <p className="font-black text-xs text-blue-600">{viewingBoardingPass.qr_token}</p>
                            </div>

                            <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between">
                                    <span>Passenger:</span>
                                    <span className="font-bold">{viewingBoardingPass.booking?.passenger_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Route:</span>
                                    <span className="font-bold">
                                        {viewingBoardingPass.booking?.trip?.route?.origin?.name || "Cubao"} ➔ {viewingBoardingPass.booking?.trip?.route?.destination?.name || "Daet"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Seat Number:</span>
                                    <span className="font-extrabold text-blue-600 text-sm">#{viewingBoardingPass.booking?.seat_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Departure:</span>
                                    <span className="font-semibold text-foreground">
                                        {formatDateTimePH(viewingBoardingPass.booking?.trip?.departure_time)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-1 font-bold">
                                    <span>Fare Paid:</span>
                                    <span>₱{viewingBoardingPass.booking?.total_price || 850}.00</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed pt-2 text-center text-[10px] text-muted-foreground">
                                Present this stub or QR code upon boarding at the terminal platform.
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="w-1/2 text-xs"
                                onClick={() => setViewingBoardingPass(null)}
                            >
                                Close
                            </Button>
                            <Button
                                className="w-1/2 bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                                onClick={() => window.print()}
                            >
                                <Printer className="mr-1.5 h-3.5 w-3.5" />
                                Print Stub
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MyTicketsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto max-w-4xl py-12 text-center text-muted-foreground">Loading tickets...</div>}>
            <TicketsContent />
        </Suspense>
    );
}
