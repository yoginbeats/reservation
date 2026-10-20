// Resilient In-Memory & File-backed Store for GCash Bookings & Verifications
// Ensures presentation never fails even if database RLS or network delays occur

import fs from "fs";
import path from "path";

export interface DiscountedPassengerInfo {
    name: string;
    classification: "SENIOR" | "STUDENT" | "PWD";
    id_number: string;
}

export interface RebookingRecord {
    rebooking_id: string;
    original_fare: number;
    hours_before_departure: number;
    is_within_3_days: boolean;
    deduction_rate: number; // 0.20 or 0
    deduction_amount: number; // 20% of previous transaction if <= 72 hours
    usable_credit: number; // original_fare - deduction_amount
    new_fare: number;
    top_up_amount: number; // Math.max(0, new_fare - usable_credit)
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
}

export interface RefundRecord {
    refund_ref: string; // e.g. RFND-20261020-XXXX
    gcash_mobile_number: string;
    gcash_account_name: string;
    reason: string;
    original_fare: number;
    refund_amount: number;
    status: "PENDING_AUDIT" | "PROCESSING_GCASH" | "COMPLETED";
    requested_at: string;
    expected_settlement_timeline: string; // "3 Business Days - 1 Week"
    estimated_settlement_date: string;
    status_notes?: string;
    processed_at?: string;
    gcash_dispatched_ref?: string;
}

export interface CachedBooking {
    id: string;
    created_at: string;
    passenger_name: string;
    passenger_contact: string;
    passenger_email: string;
    passenger_type?: "REGULAR" | "SENIOR" | "STUDENT" | "PWD" | "MIXED";
    discount_amount?: number;
    discount_id?: string;
    discount_count?: number;
    discounted_passengers?: DiscountedPassengerInfo[];
    seat_number: number;
    seat_numbers?: number[];
    seat_count?: number;
    total_price: number;
    original_price?: number;
    booking_status: "CONFIRMED" | "PENDING_VERIFICATION" | "CANCELLED" | "REFUND_PENDING";
    payment_status: "PAID" | "PENDING_VERIFICATION" | "REJECTED" | "REFUND_PENDING";
    ticket_status?: "VALID" | "USED" | "CANCELLED" | "REFUND_PENDING";
    payment_method: string;
    transaction_ref: string;
    qr_token: string;
    trip: {
        origin: string;
        destination: string;
        departure_time: string;
        bus_number: string;
    };
    refund_info?: RefundRecord;
    rebooking_info?: RebookingRecord;
}

const globalForStore = globalThis as unknown as {
    localBookingsCache?: CachedBooking[];
};

if (!globalForStore.localBookingsCache) {
    globalForStore.localBookingsCache = [];
}

const CACHE_FILE = path.join(process.cwd(), ".local_bookings.json");

function loadFromFile(): CachedBooking[] {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, "utf-8");
            return JSON.parse(data);
        }
    } catch {}
    return [];
}

function saveToFile(bookings: CachedBooking[]) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(bookings.slice(0, 100), null, 2), "utf-8");
    } catch {}
}

// Initialize from file
if (globalForStore.localBookingsCache.length === 0) {
    globalForStore.localBookingsCache = loadFromFile();
}

export function saveLocalBooking(booking: CachedBooking) {
    const list = globalForStore.localBookingsCache || [];
    const idx = list.findIndex(b => b.id === booking.id);
    if (idx >= 0) {
        list[idx] = booking;
    } else {
        list.unshift(booking);
    }
    globalForStore.localBookingsCache = list;
    saveToFile(list);
}

export function getLocalBookings(): CachedBooking[] {
    if (!globalForStore.localBookingsCache || globalForStore.localBookingsCache.length === 0) {
        globalForStore.localBookingsCache = loadFromFile();
    }
    return globalForStore.localBookingsCache || [];
}

export function getLocalBookingById(id: string): CachedBooking | undefined {
    const list = getLocalBookings();
    return list.find(b => b.id === id);
}

export function updateLocalBookingStatus(
    id: string,
    bookingStatus: "CONFIRMED" | "PENDING_VERIFICATION" | "CANCELLED",
    paymentStatus: "PAID" | "PENDING_VERIFICATION" | "REJECTED"
): CachedBooking | undefined {
    const list = getLocalBookings();
    const target = list.find(b => b.id === id);
    if (target) {
        target.booking_status = bookingStatus;
        target.payment_status = paymentStatus;
        saveToFile(list);
    }
    return target;
}

export function getLocalBookingByQrToken(qrToken: string): CachedBooking | undefined {
    if (!qrToken) return undefined;
    const cleanToken = qrToken.trim().toUpperCase();
    const list = getLocalBookings();
    return list.find(b => b.qr_token && b.qr_token.trim().toUpperCase() === cleanToken);
}

export function updateLocalTicketStatus(
    qrToken: string,
    ticketStatus: "VALID" | "USED" | "CANCELLED"
): CachedBooking | undefined {
    if (!qrToken) return undefined;
    const cleanToken = qrToken.trim().toUpperCase();
    const list = getLocalBookings();
    const target = list.find(b => b.qr_token && b.qr_token.trim().toUpperCase() === cleanToken);
    if (target) {
        target.ticket_status = ticketStatus;
        if (ticketStatus === "USED") {
            target.booking_status = "CONFIRMED";
            target.payment_status = "PAID";
        }
        saveToFile(list);
    }
    return target;
}

export function rebookLocalSeat(
    idOrToken: string,
    newSeatNumber: number
): CachedBooking | undefined {
    const clean = idOrToken.trim().toUpperCase();
    const list = getLocalBookings();
    const target = list.find(b => b.id === idOrToken || (b.qr_token && b.qr_token.toUpperCase() === clean));
    if (target) {
        target.seat_number = newSeatNumber;
        target.seat_numbers = [newSeatNumber];
        saveToFile(list);
    }
    return target;
}

export function voidLocalBooking(
    idOrToken: string,
    _reason?: string
): CachedBooking | undefined {
    const clean = idOrToken.trim().toUpperCase();
    const list = getLocalBookings();
    const target = list.find(b => b.id === idOrToken || (b.qr_token && b.qr_token.toUpperCase() === clean));
    if (target) {
        target.booking_status = "CANCELLED";
        target.ticket_status = "CANCELLED";
        target.payment_status = "REJECTED";
        saveToFile(list);
    }
    return target;
}

function getSettlementDateEstimate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function requestLocalRefund(
    idOrToken: string,
    gcashMobile: string,
    gcashName: string,
    reason: string
): { success: boolean; refund?: RefundRecord; booking?: CachedBooking; error?: string } {
    const clean = idOrToken.trim().toUpperCase();
    const list = getLocalBookings();
    const target = list.find(b => b.id === idOrToken || (b.qr_token && b.qr_token.toUpperCase() === clean));

    if (!target) {
        return { success: false, error: "Ticket booking not found." };
    }

    if (target.ticket_status === "USED") {
        return { success: false, error: "Ticket has already been used and boarded. Refund not allowed." };
    }

    if (target.ticket_status === "CANCELLED" || target.booking_status === "REFUND_PENDING") {
        return { success: false, error: "Refund has already been requested or ticket is already cancelled." };
    }

    // Check if trip already departed
    try {
        const depTime = new Date(target.trip?.departure_time);
        if (!isNaN(depTime.getTime()) && depTime.getTime() < Date.now()) {
            return { success: false, error: "Trip has already departed. Online refund is closed." };
        }
    } catch {}

    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const refundRef = `RFND-${dateCode}-${randCode}`;

    const originalFare = target.total_price || 850;

    const refundRecord: RefundRecord = {
        refund_ref: refundRef,
        gcash_mobile_number: gcashMobile.trim(),
        gcash_account_name: gcashName.trim(),
        reason: reason.trim() || "Passenger requested online cancellation",
        original_fare: originalFare,
        refund_amount: originalFare,
        status: "PENDING_AUDIT",
        requested_at: now.toISOString(),
        expected_settlement_timeline: "3 Business Days - 1 Week",
        estimated_settlement_date: getSettlementDateEstimate(),
        status_notes: "Awaiting Superlines Accounting audit and dispatch to GCash Gateway."
    };

    target.booking_status = "CANCELLED";
    target.ticket_status = "REFUND_PENDING";
    target.payment_status = "REFUND_PENDING";
    target.refund_info = refundRecord;

    saveToFile(list);
    return { success: true, refund: refundRecord, booking: target };
}

export function rebookOnlineBooking(
    idOrToken: string,
    newTripData: {
        origin: string;
        destination: string;
        departure_time: string;
        bus_number?: string;
        fare_amount?: number;
        seat_number: number;
    }
): { success: boolean; rebooking?: RebookingRecord; booking?: CachedBooking; error?: string } {
    const clean = idOrToken.trim().toUpperCase();
    const list = getLocalBookings();
    const target = list.find(b => b.id === idOrToken || (b.qr_token && b.qr_token.toUpperCase() === clean));

    if (!target) {
        return { success: false, error: "Ticket booking not found." };
    }

    if (target.ticket_status === "USED") {
        return { success: false, error: "Ticket has already been used. Rebooking is not permitted." };
    }

    if (target.ticket_status === "CANCELLED" || target.booking_status === "REFUND_PENDING") {
        return { success: false, error: "Cancelled or refund-pending tickets cannot be rebooked." };
    }

    // Check departure time of current ticket
    const now = new Date();
    let depTime = new Date(target.trip?.departure_time);
    if (isNaN(depTime.getTime())) {
        depTime = new Date(now.getTime() + 24 * 3600 * 1000);
    }

    const diffMs = depTime.getTime() - now.getTime();
    const hoursBeforeDeparture = diffMs / (1000 * 60 * 60);

    if (hoursBeforeDeparture <= 0) {
        return { success: false, error: "The scheduled trip has already departed. Please contact terminal counter." };
    }

    // 🎯 POLICY: Within 3 days (<= 72 hours) prior to travel -> 20% deduction from previous transaction
    // If > 72 hours prior to travel -> 0% deduction (FREE rebooking)
    const isWithin3Days = hoursBeforeDeparture <= 72;
    const originalFare = target.total_price || 850;
    const deductionRate = isWithin3Days ? 0.20 : 0.00;
    const deductionAmount = isWithin3Days ? Math.round(originalFare * 0.20) : 0;
    const usableCredit = originalFare - deductionAmount;
    const newFare = Number(newTripData.fare_amount || 850);
    const topUpAmount = Math.max(0, newFare - usableCredit);

    const rebookingId = `RBK-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const rebookingRecord: RebookingRecord = {
        rebooking_id: rebookingId,
        original_fare: originalFare,
        hours_before_departure: Math.round(hoursBeforeDeparture * 10) / 10,
        is_within_3_days: isWithin3Days,
        deduction_rate: deductionRate,
        deduction_amount: deductionAmount,
        usable_credit: usableCredit,
        new_fare: newFare,
        top_up_amount: topUpAmount,
        rebooked_at: now.toISOString(),
        previous_trip: {
            origin: target.trip?.origin || "Origin",
            destination: target.trip?.destination || "Destination",
            departure_time: target.trip?.departure_time || depTime.toISOString(),
            bus_number: target.trip?.bus_number || "Superlines Express",
            seat_number: target.seat_number,
        },
        new_trip: {
            origin: newTripData.origin,
            destination: newTripData.destination,
            departure_time: newTripData.departure_time,
            bus_number: newTripData.bus_number || "Superlines Express",
            seat_number: newTripData.seat_number,
        }
    };

    // Update target booking
    target.trip = {
        origin: newTripData.origin,
        destination: newTripData.destination,
        departure_time: newTripData.departure_time,
        bus_number: newTripData.bus_number || "Superlines Express",
    };
    target.seat_number = newTripData.seat_number;
    target.seat_numbers = [newTripData.seat_number];
    target.total_price = newFare;
    target.booking_status = "CONFIRMED";
    target.ticket_status = "VALID";
    target.payment_status = "PAID";
    target.rebooking_info = rebookingRecord;

    saveToFile(list);
    return { success: true, rebooking: rebookingRecord, booking: target };
}

export function getAllLocalRefunds(): RefundRecord[] {
    const list = getLocalBookings();
    return list
        .filter(b => Boolean(b.refund_info))
        .map(b => b.refund_info!)
        .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
}

export function updateLocalRefundStatus(
    refundRef: string,
    newStatus: "PENDING_AUDIT" | "PROCESSING_GCASH" | "COMPLETED",
    gcashDispatchedRef?: string,
    notes?: string
): CachedBooking | undefined {
    const list = getLocalBookings();
    const target = list.find(b => b.refund_info?.refund_ref === refundRef);
    if (target && target.refund_info) {
        target.refund_info.status = newStatus;
        if (gcashDispatchedRef) target.refund_info.gcash_dispatched_ref = gcashDispatchedRef;
        if (notes) target.refund_info.status_notes = notes;
        if (newStatus === "COMPLETED") {
            target.refund_info.processed_at = new Date().toISOString();
        }
        saveToFile(list);
    }
    return target;
}


