import fs from "fs";
import path from "path";
import { BusUnit, DEFAULT_BUSES } from "@/lib/constants/bus-units";

export type { BusClassificationType, BusUnit } from "@/lib/constants/bus-units";
export { DEFAULT_BUSES } from "@/lib/constants/bus-units";

const DATA_DIR = path.join(process.cwd(), "data");
const BUSES_FILE = path.join(DATA_DIR, "buses-store.json");

function ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readStore(): { buses: BusUnit[] } {
    ensureDirectoryExists();
    if (!fs.existsSync(BUSES_FILE)) {
        const initial = { buses: DEFAULT_BUSES };
        fs.writeFileSync(BUSES_FILE, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
    }

    try {
        const content = fs.readFileSync(BUSES_FILE, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed?.buses) && parsed.buses.length > 0) {
            return parsed;
        }
        return { buses: DEFAULT_BUSES };
    } catch (e) {
        console.error("Error reading buses store:", e);
        return { buses: DEFAULT_BUSES };
    }
}

function writeStore(data: { buses: BusUnit[] }) {
    ensureDirectoryExists();
    fs.writeFileSync(BUSES_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function getAllBuses(): BusUnit[] {
    const store = readStore();
    return store.buses;
}

export function addBus(bus: Omit<BusUnit, "id"> & { id?: string }): BusUnit {
    const store = readStore();
    const newBus: BusUnit = {
        ...bus,
        id: bus.id || `bus-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    store.buses.push(newBus);
    writeStore(store);
    return newBus;
}

export function resetDefaultBuses(): BusUnit[] {
    const store = { buses: DEFAULT_BUSES };
    writeStore(store);
    return store.buses;
}
