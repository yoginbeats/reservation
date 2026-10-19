// Resilient In-Memory & File-backed Store for GCash Bookings & Verifications
// Ensures presentation never fails even if database RLS or network delays occur

import fs from "fs";
import path from "path";

export interface DiscountedPassengerInfo {
    name: string;
    classification: "SENIOR" | "STUDENT" | "PWD";
    id_number: string;
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
    booking_status: "CONFIRMED" | "PENDING_VERIFICATION" | "CANCELLED";
    payment_status: "PAID" | "PENDING_VERIFICATION" | "REJECTED";
    ticket_status?: "VALID" | "USED" | "CANCELLED";
    payment_method: string;
    transaction_ref: string;
    qr_token: string;
    trip: {
        origin: string;
        destination: string;
        departure_time: string;
        bus_number: string;
    };
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
