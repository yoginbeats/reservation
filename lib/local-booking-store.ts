// Resilient In-Memory & File-backed Store for GCash Bookings & Verifications
// Ensures presentation never fails even if database RLS or network delays occur

let fsModule: any = null;
let pathModule: any = null;

function getFs() {
    if (!fsModule && typeof window === "undefined") {
        try {
            fsModule = eval("require")("fs");
        } catch {}
    }
    return fsModule;
}

function getPath() {
    if (!pathModule && typeof window === "undefined") {
        try {
            pathModule = eval("require")("path");
        } catch {}
    }
    return pathModule;
}

function getCacheFilePath(): string {
    const p = getPath();
    if (p && typeof process !== "undefined" && process.cwd) {
        return p.join(process.cwd(), ".local_bookings.json");
    }
    return ".local_bookings.json";
}

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
    trip_id?: string;
    trip: {
        id?: string;
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


const OCT_30_CUBAO_ID = "oct30-cubao-daet-401";
const OCT_30_DAET_ID = "oct30-daet-cubao-401";
const OCT_30_PITX_ID = "oct30-pitx-daet-212";
const OCT_30_DAET_PITX_ID = "oct30-daet-pitx-212";

function ensureOctober30SeedData(list: CachedBooking[]) {
    // 1. CUBAO ⇄ DAET (SL-401)
    if (!list.some(b => b.id === OCT_30_CUBAO_ID)) {
        list.push({
            id: OCT_30_CUBAO_ID,
            created_at: "2026-10-20T08:00:00.000Z",
            passenger_name: "Juan Dela Cruz",
            passenger_contact: "09171234567",
            passenger_email: "juan.delacruz@gmail.com",
            passenger_type: "REGULAR",
            seat_number: 12,
            seat_numbers: [12],
            seat_count: 1,
            total_price: 850,
            original_price: 850,
            booking_status: "CONFIRMED",
            payment_status: "PAID",
            ticket_status: "VALID",
            payment_method: "GCASH_DIRECT",
            transaction_ref: "GCASH-982144729110",
            qr_token: "TKT-20261030-JD401",
            trip: {
                origin: "Cubao",
                destination: "Daet",
                departure_time: "2026-10-30T20:00:00.000Z",
                bus_number: "SL-401 (Superlines Aircon)",
            }
        });
    }

    if (!list.some(b => b.id === OCT_30_DAET_ID)) {
        list.push({
            id: OCT_30_DAET_ID,
            created_at: "2026-10-20T08:30:00.000Z",
            passenger_name: "Elena Magno",
            passenger_contact: "09987654321",
            passenger_email: "elena.magno@gmail.com",
            passenger_type: "REGULAR",
            seat_number: 15,
            seat_numbers: [15],
            seat_count: 1,
            total_price: 850,
            original_price: 850,
            booking_status: "CONFIRMED",
            payment_status: "PAID",
            ticket_status: "VALID",
            payment_method: "GCASH_DIRECT",
            transaction_ref: "GCASH-982144729155",
            qr_token: "TKT-20261030-EM401",
            trip: {
                origin: "Daet",
                destination: "Cubao",
                departure_time: "2026-10-30T20:00:00.000Z",
                bus_number: "SL-401 (Superlines Aircon)",
            }
        });
    }

    // 2. PITX ⇄ DAET (SL-212)
    if (!list.some(b => b.id === OCT_30_PITX_ID)) {
        list.push({
            id: OCT_30_PITX_ID,
            created_at: "2026-10-20T08:15:00.000Z",
            passenger_name: "Ramon Valderama",
            passenger_contact: "09201112233",
            passenger_email: "ramon.valderama@yahoo.com",
            passenger_type: "REGULAR",
            seat_number: 18,
            seat_numbers: [18],
            seat_count: 1,
            total_price: 850,
            original_price: 850,
            booking_status: "CONFIRMED",
            payment_status: "PAID",
            ticket_status: "VALID",
            payment_method: "GCASH_DIRECT",
            transaction_ref: "GCASH-982144729212",
            qr_token: "TKT-20261030-RV212",
            trip: {
                origin: "PITX",
                destination: "Daet",
                departure_time: "2026-10-30T20:30:00.000Z",
                bus_number: "SL-212 (Executive Express)",
            }
        });
    }

    if (!list.some(b => b.id === OCT_30_DAET_PITX_ID)) {
        list.push({
            id: OCT_30_DAET_PITX_ID,
            created_at: "2026-10-20T08:45:00.000Z",
            passenger_name: "Teresa Morales",
            passenger_contact: "09183334455",
            passenger_email: "teresa.morales@gmail.com",
            passenger_type: "REGULAR",
            seat_number: 21,
            seat_numbers: [21],
            seat_count: 1,
            total_price: 850,
            original_price: 850,
            booking_status: "CONFIRMED",
            payment_status: "PAID",
            ticket_status: "VALID",
            payment_method: "GCASH_DIRECT",
            transaction_ref: "GCASH-982144729215",
            qr_token: "TKT-20261030-TM212",
            trip: {
                origin: "Daet",
                destination: "PITX",
                departure_time: "2026-10-30T20:30:00.000Z",
                bus_number: "SL-212 (Executive Express)",
            }
        });
    }
}

function loadFromFile(): CachedBooking[] {
    try {
        const fs = getFs();
        const cacheFile = getCacheFilePath();
        if (fs && fs.existsSync(cacheFile)) {
            const data = fs.readFileSync(cacheFile, "utf-8");
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                // Filter out any removed terminals (Alabang, Naga, Turbina)
                const excluded = ["alabang", "naga", "turbina"];
                const filtered = parsed.filter(b => {
                    const orig = (b.trip?.origin || "").toLowerCase();
                    const dest = (b.trip?.destination || "").toLowerCase();
                    return !excluded.some(ex => orig.includes(ex) || dest.includes(ex));
                });
                ensureOctober30SeedData(filtered);
                return filtered;
            }
        }
    } catch {}
    const defaultList: CachedBooking[] = [];
    ensureOctober30SeedData(defaultList);
    return defaultList;
}

function saveToFile(bookings: CachedBooking[]) {
    try {
        const fs = getFs();
        const cacheFile = getCacheFilePath();
        if (fs) {
            fs.writeFileSync(cacheFile, JSON.stringify(bookings.slice(0, 100), null, 2), "utf-8");
        }
    } catch {}
}

// Initialize from file
globalForStore.localBookingsCache = loadFromFile();
saveToFile(globalForStore.localBookingsCache);

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

export function checkSeatOccupiedAcrossTerminals(
    seatNumber: number,
    busNumber?: string,
    departureTime?: string,
    tripId?: string
): { isOccupied: boolean; conflictInfo?: { passengerName: string; terminal: string; busNumber: string } } {
    const list = getLocalBookings();
    const cleanBus = (busNumber || "").split(" ")[0].trim().toLowerCase();

    for (const b of list) {
        if (b.booking_status === "CANCELLED" || b.ticket_status === "CANCELLED") continue;

        const hasSeat = b.seat_number === seatNumber || (b.seat_numbers && b.seat_numbers.includes(seatNumber));
        if (!hasSeat) continue;

        const bTripId = b.trip_id || b.trip?.id;
        const matchesTripId = tripId && bTripId ? tripId === bTripId : false;

        const bBus = (b.trip?.bus_number || "").split(" ")[0].trim().toLowerCase();
        const sameBus = !cleanBus || !bBus || cleanBus === bBus || cleanBus.includes(bBus) || bBus.includes(cleanBus);

        let sameTime = false;
        if (departureTime && b.trip?.departure_time) {
            const bTime = new Date(b.trip.departure_time).getTime();
            const tTime = new Date(departureTime).getTime();
            // Within 6 hours is considered the same schedule departure leg
            if (Math.abs(bTime - tTime) <= 6 * 3600 * 1000) {
                sameTime = true;
            }
        } else {
            sameTime = true;
        }

        if (matchesTripId || (sameBus && sameTime)) {
            return {
                isOccupied: true,
                conflictInfo: {
                    passengerName: b.passenger_name,
                    terminal: b.trip?.origin || "Counter/Online",
                    busNumber: b.trip?.bus_number || "Superlines Express",
                }
            };
        }
    }

    return { isOccupied: false };
}

export function getOccupiedSeatsForSchedule(
    busNumber?: string,
    departureTime?: string,
    tripId?: string
): number[] {
    const list = getLocalBookings();
    const cleanBus = (busNumber || "").split(" ")[0].trim().toLowerCase();
    const seats = new Set<number>();

    for (const b of list) {
        if (b.booking_status === "CANCELLED" || b.ticket_status === "CANCELLED") continue;

        const bTripId = b.trip_id || b.trip?.id;
        const matchesTripId = tripId && bTripId ? tripId === bTripId : false;

        const bBus = (b.trip?.bus_number || "").split(" ")[0].trim().toLowerCase();
        const sameBus = !cleanBus || !bBus || cleanBus === bBus || cleanBus.includes(bBus) || bBus.includes(cleanBus);

        let sameTime = false;
        if (departureTime && b.trip?.departure_time) {
            const bTime = new Date(b.trip.departure_time).getTime();
            const tTime = new Date(departureTime).getTime();
            if (Math.abs(bTime - tTime) <= 6 * 3600 * 1000) {
                sameTime = true;
            }
        } else {
            sameTime = true;
        }

        if (matchesTripId || (sameBus && sameTime)) {
            if (b.seat_number) seats.add(b.seat_number);
            if (b.seat_numbers && Array.isArray(b.seat_numbers)) {
                b.seat_numbers.forEach(s => seats.add(s));
            }
        }
    }

    return Array.from(seats);
}


