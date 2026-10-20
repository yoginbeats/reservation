export interface SystemCredential {
    id: string;
    email: string;
    password: string;
    role: "ADMIN" | "TELLER" | "CONDUCTOR";
    name: string;
    terminal?: {
        id: string;
        name: string;
        location: string;
    };
    busAssignment?: string;
    routeAssignment?: string;
    badgeColor: string;
    description: string;
    portalUrl: string;
}

export const SYSTEM_CREDENTIALS: SystemCredential[] = [
    {
        id: "usr-admin-001",
        email: "admin@superlines.com",
        password: "admin123",
        role: "ADMIN",
        name: "Superlines Head Admin",
        description: "Full master administrative privileges. Access to real-time sales reports, terminal remittances, fleet assignment, route configurations, and dual manifest anti-double booking monitor.",
        badgeColor: "bg-red-500/10 text-red-500 border-red-500/30",
        portalUrl: "/admin",
    },
    {
        id: "usr-teller-cubao",
        email: "teller.cubao@superlines.com",
        password: "teller123",
        role: "TELLER",
        name: "Maria Santos (Cubao Counter)",
        terminal: {
            id: "term-cubao",
            name: "Cubao",
            location: "Superlines Cubao Terminal, EDSA, Quezon City",
        },
        description: "Cubao ticketing booth. Issues walk-in tickets, accepts cash payments, processes supervisor rebookings, and prints end-of-shift Z-Reading remittance slips.",
        badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
        portalUrl: "/teller/walk-in",
    },
    {
        id: "usr-teller-daet",
        email: "teller.daet@superlines.com",
        password: "teller123",
        role: "TELLER",
        name: "Elena Magno (Daet Counter)",
        terminal: {
            id: "term-daet",
            name: "Daet",
            location: "Superlines Daet Central Terminal, Camarines Norte",
        },
        description: "Daet ticketing booth. Issues walk-in tickets, accepts cash payments, processes supervisor rebookings, and prints end-of-shift Z-Reading remittance slips.",
        badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
        portalUrl: "/teller/walk-in",
    },
    {
        id: "usr-teller-pitx",
        email: "teller.pitx@superlines.com",
        password: "teller123",
        role: "TELLER",
        name: "Roberto Gomez (PITX Counter)",
        terminal: {
            id: "term-pitx",
            name: "PITX",
            location: "Parañaque Integrated Terminal Exchange, Bay 4",
        },
        description: "PITX ticketing booth. Issues walk-in tickets, accepts cash payments, processes supervisor rebookings, and prints end-of-shift Z-Reading remittance slips.",
        badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        portalUrl: "/teller/walk-in",
    },
    {
        id: "usr-conductor-1",
        email: "conductor1@superlines.com",
        password: "conductor123",
        role: "CONDUCTOR",
        name: "Eduardo Ramos",
        busAssignment: "SL-401 (Superlines Aircon)",
        routeAssignment: "Cubao ⇄ Daet",
        description: "Bus Conductor assigned to SL-401. Validates passenger QR tickets via built-in camera/scanner, checks boarding status, and oversees the live passenger manifest.",
        badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
        portalUrl: "/conductor",
    },
    {
        id: "usr-conductor-2",
        email: "conductor2@superlines.com",
        password: "conductor123",
        role: "CONDUCTOR",
        name: "Nestor Dela Cruz",
        busAssignment: "SL-212 (Executive Express)",
        routeAssignment: "PITX ⇄ Daet",
        description: "Bus Conductor assigned to SL-212. Validates passenger QR tickets via built-in camera/scanner, checks boarding status, and oversees the live passenger manifest.",
        badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
        portalUrl: "/conductor",
    },
];

export function findSystemCredential(email: string): SystemCredential | undefined {
    const clean = (email || "").trim().toLowerCase();
    return SYSTEM_CREDENTIALS.find(c => c.email.toLowerCase() === clean);
}
