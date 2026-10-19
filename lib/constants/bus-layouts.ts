// Official Superlines Transportation Co., Inc. (Atimonan Quezon)
// Seating Arrangement & Bus Classification Layouts

export type SuperlinesBusType = "REGULAR_AIRCON" | "SUPER_DELUXE" | "FIRST_CLASS";

export interface SeatGridCell {
    type: "seat" | "cr" | "stairs" | "empty";
    seatNumber?: number;
    label?: string;
}

export interface BusRowConfig {
    rowNumber: number;
    leftSeats: SeatGridCell[];   // Driver side (typically 2 seats)
    rightSeats: SeatGridCell[];  // Conductor side (2 seats, CR, or Stairs)
    aisleSeat?: SeatGridCell;    // Middle seat (only on the last / back row)
}

export interface BusClassification {
    id: SuperlinesBusType;
    name: string;
    alias: string[];
    capacity: number;
    hasCR: boolean;
    hasStairs: boolean;
    assignedBuses: string[];
    rows: BusRowConfig[];
}

/**
 * 1. REGULAR AIRCON (49 Seater)
 * 12 Rows total.
 * Rows 1-11: 2 left seats, aisle, 2 right seats
 * Row 12 (Back row): 5 seats across (45, 46, 47 [aisle], 48, 49)
 */
export const REGULAR_AIRCON_LAYOUT: BusClassification = {
    id: "REGULAR_AIRCON",
    name: "Regular Aircon",
    alias: ["REGULAR AIRCON", "AIRCON", "STANDARD", "REGULAR_AIRCON"],
    capacity: 49,
    hasCR: false,
    hasStairs: false,
    assignedBuses: ["101", "102", "103", "104", "105"],
    rows: [
        { rowNumber: 1,  leftSeats: [{ type: "seat", seatNumber: 1 }, { type: "seat", seatNumber: 2 }], rightSeats: [{ type: "seat", seatNumber: 3 }, { type: "seat", seatNumber: 4 }] },
        { rowNumber: 2,  leftSeats: [{ type: "seat", seatNumber: 5 }, { type: "seat", seatNumber: 6 }], rightSeats: [{ type: "seat", seatNumber: 7 }, { type: "seat", seatNumber: 8 }] },
        { rowNumber: 3,  leftSeats: [{ type: "seat", seatNumber: 9 }, { type: "seat", seatNumber: 10 }], rightSeats: [{ type: "seat", seatNumber: 11 }, { type: "seat", seatNumber: 12 }] },
        { rowNumber: 4,  leftSeats: [{ type: "seat", seatNumber: 13 }, { type: "seat", seatNumber: 14 }], rightSeats: [{ type: "seat", seatNumber: 15 }, { type: "seat", seatNumber: 16 }] },
        { rowNumber: 5,  leftSeats: [{ type: "seat", seatNumber: 17 }, { type: "seat", seatNumber: 18 }], rightSeats: [{ type: "seat", seatNumber: 19 }, { type: "seat", seatNumber: 20 }] },
        { rowNumber: 6,  leftSeats: [{ type: "seat", seatNumber: 21 }, { type: "seat", seatNumber: 22 }], rightSeats: [{ type: "seat", seatNumber: 23 }, { type: "seat", seatNumber: 24 }] },
        { rowNumber: 7,  leftSeats: [{ type: "seat", seatNumber: 25 }, { type: "seat", seatNumber: 26 }], rightSeats: [{ type: "seat", seatNumber: 27 }, { type: "seat", seatNumber: 28 }] },
        { rowNumber: 8,  leftSeats: [{ type: "seat", seatNumber: 29 }, { type: "seat", seatNumber: 30 }], rightSeats: [{ type: "seat", seatNumber: 31 }, { type: "seat", seatNumber: 32 }] },
        { rowNumber: 9,  leftSeats: [{ type: "seat", seatNumber: 33 }, { type: "seat", seatNumber: 34 }], rightSeats: [{ type: "seat", seatNumber: 35 }, { type: "seat", seatNumber: 36 }] },
        { rowNumber: 10, leftSeats: [{ type: "seat", seatNumber: 37 }, { type: "seat", seatNumber: 38 }], rightSeats: [{ type: "seat", seatNumber: 39 }, { type: "seat", seatNumber: 40 }] },
        { rowNumber: 11, leftSeats: [{ type: "seat", seatNumber: 41 }, { type: "seat", seatNumber: 42 }], rightSeats: [{ type: "seat", seatNumber: 43 }, { type: "seat", seatNumber: 44 }] },
        {
            rowNumber: 12,
            leftSeats: [{ type: "seat", seatNumber: 45 }, { type: "seat", seatNumber: 46 }],
            aisleSeat: { type: "seat", seatNumber: 47 },
            rightSeats: [{ type: "seat", seatNumber: 48 }, { type: "seat", seatNumber: 49 }],
        },
    ],
};

/**
 * 2. SUPER DELUXE (43 Seater)
 * Bus # 311 & 316 & 319
 * Row 2 Right: STAIRS
 * Row 6 Right: COMFORT ROOM
 * Row 7 Right: STAIRS
 * Back Row (Row 12): 39, 40 | 41 [aisle] | 42, 43
 */
export const SUPER_DELUXE_LAYOUT: BusClassification = {
    id: "SUPER_DELUXE",
    name: "Super Deluxe",
    alias: ["SUPER DELUXE", "SUPER_DELUXE", "DELUXE"],
    capacity: 43,
    hasCR: true,
    hasStairs: true,
    assignedBuses: ["311", "316", "319"],
    rows: [
        { rowNumber: 1,  leftSeats: [{ type: "seat", seatNumber: 1 }, { type: "seat", seatNumber: 2 }], rightSeats: [{ type: "seat", seatNumber: 3 }, { type: "seat", seatNumber: 4 }] },
        { rowNumber: 2,  leftSeats: [{ type: "seat", seatNumber: 5 }, { type: "seat", seatNumber: 6 }], rightSeats: [{ type: "stairs", label: "STAIRS" }] },
        { rowNumber: 3,  leftSeats: [{ type: "seat", seatNumber: 7 }, { type: "seat", seatNumber: 8 }], rightSeats: [{ type: "seat", seatNumber: 9 }, { type: "seat", seatNumber: 10 }] },
        { rowNumber: 4,  leftSeats: [{ type: "seat", seatNumber: 11 }, { type: "seat", seatNumber: 12 }], rightSeats: [{ type: "seat", seatNumber: 13 }, { type: "seat", seatNumber: 14 }] },
        { rowNumber: 5,  leftSeats: [{ type: "seat", seatNumber: 15 }, { type: "seat", seatNumber: 16 }], rightSeats: [{ type: "seat", seatNumber: 17 }, { type: "seat", seatNumber: 18 }] },
        { rowNumber: 6,  leftSeats: [{ type: "seat", seatNumber: 19 }, { type: "seat", seatNumber: 20 }], rightSeats: [{ type: "cr", label: "COMFORT ROOM" }] },
        { rowNumber: 7,  leftSeats: [{ type: "seat", seatNumber: 21 }, { type: "seat", seatNumber: 22 }], rightSeats: [{ type: "stairs", label: "STAIRS" }] },
        { rowNumber: 8,  leftSeats: [{ type: "seat", seatNumber: 23 }, { type: "seat", seatNumber: 24 }], rightSeats: [{ type: "seat", seatNumber: 25 }, { type: "seat", seatNumber: 26 }] },
        { rowNumber: 9,  leftSeats: [{ type: "seat", seatNumber: 27 }, { type: "seat", seatNumber: 28 }], rightSeats: [{ type: "seat", seatNumber: 29 }, { type: "seat", seatNumber: 30 }] },
        { rowNumber: 10, leftSeats: [{ type: "seat", seatNumber: 31 }, { type: "seat", seatNumber: 32 }], rightSeats: [{ type: "seat", seatNumber: 33 }, { type: "seat", seatNumber: 34 }] },
        { rowNumber: 11, leftSeats: [{ type: "seat", seatNumber: 35 }, { type: "seat", seatNumber: 36 }], rightSeats: [{ type: "seat", seatNumber: 37 }, { type: "seat", seatNumber: 38 }] },
        {
            rowNumber: 12,
            leftSeats: [{ type: "seat", seatNumber: 39 }, { type: "seat", seatNumber: 40 }],
            aisleSeat: { type: "seat", seatNumber: 41 },
            rightSeats: [{ type: "seat", seatNumber: 42 }, { type: "seat", seatNumber: 43 }],
        },
    ],
};

/**
 * 3. FIRST CLASS (41 Seater)
 * Bus # 330 & 331 & 336
 * Row 5 Right: COMFORT ROOM
 * Row 6 Right: STAIRS
 * Back Row (Row 11): 37, 38 | 39 [aisle] | 40, 41
 */
export const FIRST_CLASS_LAYOUT: BusClassification = {
    id: "FIRST_CLASS",
    name: "First Class",
    alias: ["FIRST CLASS", "FIRST_CLASS"],
    capacity: 41,
    hasCR: true,
    hasStairs: true,
    assignedBuses: ["330", "331", "336"],
    rows: [
        { rowNumber: 1,  leftSeats: [{ type: "seat", seatNumber: 1 }, { type: "seat", seatNumber: 2 }], rightSeats: [{ type: "seat", seatNumber: 3 }, { type: "seat", seatNumber: 4 }] },
        { rowNumber: 2,  leftSeats: [{ type: "seat", seatNumber: 5 }, { type: "seat", seatNumber: 6 }], rightSeats: [{ type: "seat", seatNumber: 7 }, { type: "seat", seatNumber: 8 }] },
        { rowNumber: 3,  leftSeats: [{ type: "seat", seatNumber: 9 }, { type: "seat", seatNumber: 10 }], rightSeats: [{ type: "seat", seatNumber: 11 }, { type: "seat", seatNumber: 12 }] },
        { rowNumber: 4,  leftSeats: [{ type: "seat", seatNumber: 13 }, { type: "seat", seatNumber: 14 }], rightSeats: [{ type: "seat", seatNumber: 15 }, { type: "seat", seatNumber: 16 }] },
        { rowNumber: 5,  leftSeats: [{ type: "seat", seatNumber: 17 }, { type: "seat", seatNumber: 18 }], rightSeats: [{ type: "cr", label: "COMFORT ROOM" }] },
        { rowNumber: 6,  leftSeats: [{ type: "seat", seatNumber: 19 }, { type: "seat", seatNumber: 20 }], rightSeats: [{ type: "stairs", label: "STAIRS" }] },
        { rowNumber: 7,  leftSeats: [{ type: "seat", seatNumber: 21 }, { type: "seat", seatNumber: 22 }], rightSeats: [{ type: "seat", seatNumber: 23 }, { type: "seat", seatNumber: 24 }] },
        { rowNumber: 8,  leftSeats: [{ type: "seat", seatNumber: 25 }, { type: "seat", seatNumber: 26 }], rightSeats: [{ type: "seat", seatNumber: 27 }, { type: "seat", seatNumber: 28 }] },
        { rowNumber: 9,  leftSeats: [{ type: "seat", seatNumber: 29 }, { type: "seat", seatNumber: 30 }], rightSeats: [{ type: "seat", seatNumber: 31 }, { type: "seat", seatNumber: 32 }] },
        { rowNumber: 10, leftSeats: [{ type: "seat", seatNumber: 33 }, { type: "seat", seatNumber: 34 }], rightSeats: [{ type: "seat", seatNumber: 35 }, { type: "seat", seatNumber: 36 }] },
        {
            rowNumber: 11,
            leftSeats: [{ type: "seat", seatNumber: 37 }, { type: "seat", seatNumber: 38 }],
            aisleSeat: { type: "seat", seatNumber: 39 },
            rightSeats: [{ type: "seat", seatNumber: 40 }, { type: "seat", seatNumber: 41 }],
        },
    ],
};

export const SUPERLINES_BUS_CLASSIFICATIONS: BusClassification[] = [
    REGULAR_AIRCON_LAYOUT,
    SUPER_DELUXE_LAYOUT,
    FIRST_CLASS_LAYOUT,
];

/**
 * Helper to resolve any input string or bus number to the proper Superlines bus classification.
 */
export function getBusClassification(input?: string | null, busNumber?: string | null): BusClassification {
    // 1. Check by bus number first if available
    if (busNumber) {
        const cleanNum = busNumber.replace(/[^0-9]/g, "");
        if (cleanNum) {
            const foundByNum = SUPERLINES_BUS_CLASSIFICATIONS.find(c => 
                c.assignedBuses.includes(cleanNum) || c.assignedBuses.includes(busNumber)
            );
            if (foundByNum) return foundByNum;
        }
    }

    if (!input) return REGULAR_AIRCON_LAYOUT;

    const normalized = input.toUpperCase().trim().replace(/[-_]/g, " ");

    if (normalized.includes("FIRST")) {
        return FIRST_CLASS_LAYOUT;
    }
    if (normalized.includes("SUPER") || normalized.includes("DELUXE")) {
        return SUPER_DELUXE_LAYOUT;
    }
    if (normalized.includes("AIRCON") || normalized.includes("REGULAR") || normalized.includes("STANDARD")) {
        return REGULAR_AIRCON_LAYOUT;
    }

    return REGULAR_AIRCON_LAYOUT;
}
