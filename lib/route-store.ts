import fs from "fs";
import path from "path";

export interface Terminal {
    id: string;
    name: string;
    location: string;
    code: string;
}

export interface RouteItem {
    id: string;
    origin_terminal_id: string;
    destination_terminal_id: string;
    origin: { name: string; location?: string };
    destination: { name: string; location?: string };
    distance_km: number;
    estimated_hours: number;
    status: "ACTIVE" | "INACTIVE";
    created_at: string;
}

interface RouteStoreData {
    terminals: Terminal[];
    routes: RouteItem[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const ROUTES_FILE = path.join(DATA_DIR, "routes-store.json");

export const DEFAULT_TERMINALS: Terminal[] = [
    {
        id: "term-cubao",
        name: "Cubao",
        location: "Superlines Cubao Terminal, EDSA, Quezon City",
        code: "CUB",
    },
    {
        id: "term-daet",
        name: "Daet",
        location: "Daet Central Terminal, Camarines Norte",
        code: "DAE",
    },
    {
        id: "term-pitx",
        name: "PITX",
        location: "Parañaque Integrated Terminal Exchange, Metro Manila",
        code: "PTX",
    },
];

export const DEFAULT_ROUTES: RouteItem[] = [
    {
        id: "route-cubao-daet",
        origin_terminal_id: "term-cubao",
        destination_terminal_id: "term-daet",
        origin: { name: "Cubao", location: "Superlines Cubao Terminal, EDSA" },
        destination: { name: "Daet", location: "Daet Central Terminal" },
        distance_km: 340,
        estimated_hours: 8.0,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
    },
    {
        id: "route-daet-cubao",
        origin_terminal_id: "term-daet",
        destination_terminal_id: "term-cubao",
        origin: { name: "Daet", location: "Daet Central Terminal" },
        destination: { name: "Cubao", location: "Superlines Cubao Terminal, EDSA" },
        distance_km: 340,
        estimated_hours: 8.0,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
    },
    {
        id: "route-pitx-daet",
        origin_terminal_id: "term-pitx",
        destination_terminal_id: "term-daet",
        origin: { name: "PITX", location: "Parañaque Integrated Terminal Exchange" },
        destination: { name: "Daet", location: "Daet Central Terminal" },
        distance_km: 355,
        estimated_hours: 8.5,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
    },
    {
        id: "route-daet-pitx",
        origin_terminal_id: "term-daet",
        destination_terminal_id: "term-pitx",
        origin: { name: "Daet", location: "Daet Central Terminal" },
        destination: { name: "PITX", location: "Parañaque Integrated Terminal Exchange" },
        distance_km: 355,
        estimated_hours: 8.5,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
    },
    {
        id: "route-cubao-pitx",
        origin_terminal_id: "term-cubao",
        destination_terminal_id: "term-pitx",
        origin: { name: "Cubao", location: "Superlines Cubao Terminal, EDSA" },
        destination: { name: "PITX", location: "Parañaque Integrated Terminal Exchange" },
        distance_km: 25,
        estimated_hours: 1.5,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
    },
    {
        id: "route-pitx-cubao",
        origin_terminal_id: "term-pitx",
        destination_terminal_id: "term-cubao",
        origin: { name: "PITX", location: "Parañaque Integrated Terminal Exchange" },
        destination: { name: "Cubao", location: "Superlines Cubao Terminal, EDSA" },
        distance_km: 25,
        estimated_hours: 1.5,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
    },
];

function ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readStore(): RouteStoreData {
    ensureDirectoryExists();
    if (!fs.existsSync(ROUTES_FILE)) {
        const initial: RouteStoreData = {
            terminals: DEFAULT_TERMINALS,
            routes: DEFAULT_ROUTES,
        };
        fs.writeFileSync(ROUTES_FILE, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
    }

    try {
        const content = fs.readFileSync(ROUTES_FILE, "utf-8");
        const parsed = JSON.parse(content);
        return {
            terminals: parsed.terminals && parsed.terminals.length > 0 ? parsed.terminals : DEFAULT_TERMINALS,
            routes: parsed.routes && parsed.routes.length > 0 ? parsed.routes : DEFAULT_ROUTES,
        };
    } catch (e) {
        console.error("Error reading routes store:", e);
        return {
            terminals: DEFAULT_TERMINALS,
            routes: DEFAULT_ROUTES,
        };
    }
}

function writeStore(data: RouteStoreData) {
    ensureDirectoryExists();
    try {
        fs.writeFileSync(ROUTES_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
        console.error("Error writing routes store:", e);
    }
}

export function getAllTerminals(): Terminal[] {
    const store = readStore();
    return store.terminals;
}

export function getAllRoutes(): RouteItem[] {
    const store = readStore();
    return store.routes;
}

export function addRoute(payload: {
    originName: string;
    destinationName: string;
    distance_km?: number;
    estimated_hours?: number;
}): RouteItem {
    const store = readStore();
    const origin = payload.originName.trim();
    const destination = payload.destinationName.trim();

    if (!origin || !destination) {
        throw new Error("Both Origin and Destination terminals are required.");
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
        throw new Error("Origin and Destination cannot be the same terminal.");
    }

    // Resolve or add terminal IDs
    const originTerm = store.terminals.find(t => t.name.toLowerCase() === origin.toLowerCase()) || {
        id: `term-${origin.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        name: origin,
        location: `${origin} Bus Terminal`,
        code: origin.slice(0, 3).toUpperCase(),
    };

    const destTerm = store.terminals.find(t => t.name.toLowerCase() === destination.toLowerCase()) || {
        id: `term-${destination.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        name: destination,
        location: `${destination} Bus Terminal`,
        code: destination.slice(0, 3).toUpperCase(),
    };

    if (!store.terminals.some(t => t.id === originTerm.id)) {
        store.terminals.push(originTerm);
    }
    if (!store.terminals.some(t => t.id === destTerm.id)) {
        store.terminals.push(destTerm);
    }

    // Default distance estimate if not provided
    let distance = Number(payload.distance_km) || 340;
    let hours = Number(payload.estimated_hours) || 8.0;
    if (origin.toLowerCase().includes("pitx") && destination.toLowerCase().includes("daet")) {
        distance = 355;
        hours = 8.5;
    } else if (origin.toLowerCase().includes("cubao") && destination.toLowerCase().includes("pitx")) {
        distance = 25;
        hours = 1.5;
    }

    const routeId = `route-${originTerm.name.toLowerCase()}-${destTerm.name.toLowerCase()}`;

    // Check if route already exists
    const existingIdx = store.routes.findIndex(r => 
        (r.origin.name.toLowerCase() === origin.toLowerCase() && r.destination.name.toLowerCase() === destination.toLowerCase()) ||
        r.id === routeId
    );

    const newRoute: RouteItem = {
        id: routeId,
        origin_terminal_id: originTerm.id,
        destination_terminal_id: destTerm.id,
        origin: { name: originTerm.name, location: originTerm.location },
        destination: { name: destTerm.name, location: destTerm.location },
        distance_km: distance,
        estimated_hours: hours,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
        store.routes[existingIdx] = newRoute;
    } else {
        store.routes.unshift(newRoute);
    }

    writeStore(store);
    return newRoute;
}

export function deleteRoute(routeId: string): boolean {
    const store = readStore();
    const beforeCount = store.routes.length;
    store.routes = store.routes.filter(r => r.id !== routeId);
    if (store.routes.length !== beforeCount) {
        writeStore(store);
        return true;
    }
    return false;
}

export function resetDefaultRoutes(): RouteItem[] {
    const store: RouteStoreData = {
        terminals: DEFAULT_TERMINALS,
        routes: DEFAULT_ROUTES,
    };
    writeStore(store);
    return store.routes;
}

