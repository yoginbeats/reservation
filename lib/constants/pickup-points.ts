// Superlines Official Pick-up Points & Waypoint Boarding Stations

export interface PickupPoint {
    id: string;
    name: string;
    label: string;
    description: string;
    isMainTerminal?: boolean;
}

// 1. Pick-up Points for trips originating from Daet / Camarines Norte (Bound for Manila: Cubao / PITX)
export const DAET_BOUND_FOR_MANILA_PICKUPS: PickupPoint[] = [
    {
        id: "pickup-daet",
        name: "Daet",
        label: "Daet Central Terminal",
        description: "Superlines Daet Central Terminal, Vinzons Avenue (Main Terminal)",
        isMainTerminal: true,
    },
    {
        id: "pickup-talisay",
        name: "Talisay",
        label: "Talisay",
        description: "Talisay Highway Junction / Poblacion Waiting Station",
        isMainTerminal: false,
    },
    {
        id: "pickup-vinzons",
        name: "Vinzons",
        label: "Vinzons",
        description: "Vinzons Superlines Booking Office & Highway Stop",
        isMainTerminal: false,
    },
    {
        id: "pickup-talobatib",
        name: "Talobatib, Labo",
        label: "Talobatib, Labo",
        description: "Talobatib Junction & Labo Passenger Waiting Bay",
        isMainTerminal: false,
    },
    {
        id: "pickup-staelena",
        name: "Sta. Elena",
        label: "Sta. Elena",
        description: "Sta. Elena Highway Checkpoint & Provincial Boundary",
        isMainTerminal: false,
    },
];

// 2. Pick-up Points for trips originating from Metro Manila (Cubao / PITX bound for Daet / Camarines Norte)
export const MANILA_BOUND_FOR_DAET_PICKUPS: PickupPoint[] = [
    {
        id: "pickup-cubao",
        name: "Cubao",
        label: "Cubao Terminal",
        description: "Superlines Cubao Terminal, EDSA, Quezon City (Main Terminal)",
        isMainTerminal: true,
    },
    {
        id: "pickup-pitx",
        name: "PITX",
        label: "PITX Terminal",
        description: "Parañaque Integrated Terminal Exchange (Main Departure Bay)",
        isMainTerminal: true,
    },
    {
        id: "pickup-alabang",
        name: "Alabang",
        label: "Alabang",
        description: "Alabang South Station / Starmall Highway Waiting Area",
        isMainTerminal: false,
    },
    {
        id: "pickup-turbina",
        name: "Turbina, Calamba",
        label: "Turbina, Calamba",
        description: "Turbina Highway Checkpoint & Calamba Passenger Bay",
        isMainTerminal: false,
    },
];

/**
 * Returns the relevant pick-up / boarding points based on the trip's origin.
 */
export function getPickupPointsForTrip(origin?: string, destination?: string): PickupPoint[] {
    const orig = (origin || "").toLowerCase();

    // Outbound from Daet / Camarines Norte (heading to Cubao / PITX / Manila)
    if (orig.includes("daet") || orig.includes("camarines") || orig.includes("vinzons") || orig.includes("labo")) {
        return DAET_BOUND_FOR_MANILA_PICKUPS;
    }

    // Outbound from Cubao (heading to Daet / Bicol)
    if (orig.includes("cubao")) {
        return [
            MANILA_BOUND_FOR_DAET_PICKUPS[0], // Cubao
            MANILA_BOUND_FOR_DAET_PICKUPS[2], // Alabang
            MANILA_BOUND_FOR_DAET_PICKUPS[3], // Turbina, Calamba
        ];
    }

    // Outbound from PITX (heading to Daet / Bicol)
    if (orig.includes("pitx")) {
        return [
            MANILA_BOUND_FOR_DAET_PICKUPS[1], // PITX
            MANILA_BOUND_FOR_DAET_PICKUPS[2], // Alabang
            MANILA_BOUND_FOR_DAET_PICKUPS[3], // Turbina, Calamba
        ];
    }

    // Default fallback
    return [
        {
            id: `pickup-${orig || "default"}`,
            name: origin || "Terminal",
            label: `${origin || "Terminal"} (Main Station)`,
            description: `Superlines ${origin || "Terminal"} Departure Bay`,
            isMainTerminal: true,
        },
    ];
}
