import fs from "fs";
import path from "path";

export interface ScheduledTrip {
    id: string;
    origin: string;
    destination: string;
    departure_time: string;
    fare_amount: number;
    price?: number;
    status: "SCHEDULED" | "BOARDING" | "COMPLETED" | "CANCELLED";
    bus_id?: string;
    bus_number: string;
    bus_type: string;
    seat_capacity: number;
    route_id?: string;
    created_at: string;
    created_by?: string;
}

interface TripStoreData {
    clearedAll: boolean;
    clearedAt: string | null;
    deletedTripIds: string[];
    trips: ScheduledTrip[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const TRIPS_FILE = path.join(DATA_DIR, "scheduled-trips.json");

function ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readStore(): TripStoreData {
    ensureDirectoryExists();
    if (!fs.existsSync(TRIPS_FILE)) {
        const initial: TripStoreData = {
            clearedAll: true, // Default to clean slate
            clearedAt: new Date().toISOString(),
            deletedTripIds: [],
            trips: [],
        };
        fs.writeFileSync(TRIPS_FILE, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
    }

    try {
        const content = fs.readFileSync(TRIPS_FILE, "utf-8");
        return JSON.parse(content);
    } catch (e) {
        console.error("Error reading scheduled trips store:", e);
        return {
            clearedAll: true,
            clearedAt: new Date().toISOString(),
            deletedTripIds: [],
            trips: [],
        };
    }
}

function writeStore(data: TripStoreData) {
    ensureDirectoryExists();
    fs.writeFileSync(TRIPS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Returns all active scheduled trips created by the Admin.
 * If the Admin has cleared all trips, returns an empty array.
 */
export function getActiveScheduledTrips(): ScheduledTrip[] {
    const store = readStore();
    if (store.clearedAll && store.trips.length === 0) {
        return [];
    }

    const deletedSet = new Set(store.deletedTripIds || []);
    return (store.trips || []).filter(t => !deletedSet.has(t.id));
}

/**
 * Add a new scheduled trip created by Admin.
 */
export function addScheduledTrip(trip: Omit<ScheduledTrip, "id" | "created_at"> & { id?: string }): ScheduledTrip {
    const store = readStore();
    const newTrip: ScheduledTrip = {
        ...trip,
        id: trip.id || `trip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        status: trip.status || "SCHEDULED",
        fare_amount: Number(trip.fare_amount || trip.price || 850),
        price: Number(trip.fare_amount || trip.price || 850),
        created_at: new Date().toISOString(),
    };

    store.trips.unshift(newTrip);
    writeStore(store);
    return newTrip;
}

/**
 * Delete a specific scheduled trip by ID (Admin only).
 */
export function deleteScheduledTrip(tripId: string): boolean {
    const store = readStore();
    if (!store.deletedTripIds) store.deletedTripIds = [];
    store.deletedTripIds.push(tripId);
    store.trips = store.trips.filter(t => t.id !== tripId);
    writeStore(store);
    return true;
}

/**
 * Wipes ALL scheduled trips clean (Admin only).
 * Ensures zero schedules appear across Admin, Teller, Conductor, and Passenger.
 */
export function clearAllScheduledTrips(): boolean {
    const store: TripStoreData = {
        clearedAll: true,
        clearedAt: new Date().toISOString(),
        deletedTripIds: [],
        trips: [],
    };
    writeStore(store);
    return true;
}
