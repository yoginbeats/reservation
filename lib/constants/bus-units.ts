// Client-safe Bus Classification and Fleet Definitions

export type BusClassificationType = "REGULAR_AIRCON" | "SUPER_DELUXE" | "FIRST_CLASS";

export interface BusUnit {
    id: string;
    bus_number: string;
    bus_type: BusClassificationType;
    category: string;
    seat_capacity: number;
    fare: number;
    has_cr: boolean;
    features: string[];
    status: "ACTIVE" | "MAINTENANCE";
}

export const DEFAULT_BUSES: BusUnit[] = [
    // 1. REGULAR AIRCON (49 Seater • ₱850)
    {
        id: "bus-sl101",
        bus_number: "SL-101",
        bus_type: "REGULAR_AIRCON",
        category: "Regular Aircon",
        seat_capacity: 49,
        fare: 850,
        has_cr: false,
        features: ["49 Reclining Seats", "Full Air-conditioning", "Overhead Luggage", "Audio/Video Entertainment"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl102",
        bus_number: "SL-102",
        bus_type: "REGULAR_AIRCON",
        category: "Regular Aircon",
        seat_capacity: 49,
        fare: 850,
        has_cr: false,
        features: ["49 Reclining Seats", "Full Air-conditioning", "Overhead Luggage", "Audio/Video Entertainment"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl103",
        bus_number: "SL-103",
        bus_type: "REGULAR_AIRCON",
        category: "Regular Aircon",
        seat_capacity: 49,
        fare: 850,
        has_cr: false,
        features: ["49 Reclining Seats", "Full Air-conditioning", "Overhead Luggage", "Audio/Video Entertainment"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl104",
        bus_number: "SL-104",
        bus_type: "REGULAR_AIRCON",
        category: "Regular Aircon",
        seat_capacity: 49,
        fare: 850,
        has_cr: false,
        features: ["49 Reclining Seats", "Full Air-conditioning", "Overhead Luggage", "Audio/Video Entertainment"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl105",
        bus_number: "SL-105",
        bus_type: "REGULAR_AIRCON",
        category: "Regular Aircon",
        seat_capacity: 49,
        fare: 850,
        has_cr: false,
        features: ["49 Reclining Seats", "Full Air-conditioning", "Overhead Luggage", "Audio/Video Entertainment"],
        status: "ACTIVE",
    },

    // 2. SUPER DELUXE / DELUXE (43 Seater • With Restroom • ₱950)
    {
        id: "bus-sl311",
        bus_number: "SL-311",
        bus_type: "SUPER_DELUXE",
        category: "Super Deluxe",
        seat_capacity: 43,
        fare: 950,
        has_cr: true,
        features: ["43 Deluxe Seats", "Onboard Comfort Room (CR)", "Stairs Mid-Door", "USB Charging Ports"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl312",
        bus_number: "SL-312",
        bus_type: "SUPER_DELUXE",
        category: "Super Deluxe",
        seat_capacity: 43,
        fare: 950,
        has_cr: true,
        features: ["43 Deluxe Seats", "Onboard Comfort Room (CR)", "Stairs Mid-Door", "USB Charging Ports"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl316",
        bus_number: "SL-316",
        bus_type: "SUPER_DELUXE",
        category: "Super Deluxe",
        seat_capacity: 43,
        fare: 950,
        has_cr: true,
        features: ["43 Deluxe Seats", "Onboard Comfort Room (CR)", "Stairs Mid-Door", "USB Charging Ports"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl319",
        bus_number: "SL-319",
        bus_type: "SUPER_DELUXE",
        category: "Super Deluxe",
        seat_capacity: 43,
        fare: 950,
        has_cr: true,
        features: ["43 Deluxe Seats", "Onboard Comfort Room (CR)", "Stairs Mid-Door", "USB Charging Ports"],
        status: "ACTIVE",
    },

    // 3. FIRST CLASS (41 Seater • Premier Sleeper & CR • ₱1,100)
    {
        id: "bus-sl501",
        bus_number: "SL-501",
        bus_type: "FIRST_CLASS",
        category: "First Class Premier",
        seat_capacity: 41,
        fare: 1100,
        has_cr: true,
        features: ["41 Premier Sleeper Recliners", "Onboard Comfort Room (CR)", "Leg Rest & Extra Spacing", "VIP Cabin Service"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl502",
        bus_number: "SL-502",
        bus_type: "FIRST_CLASS",
        category: "First Class Premier",
        seat_capacity: 41,
        fare: 1100,
        has_cr: true,
        features: ["41 Premier Sleeper Recliners", "Onboard Comfort Room (CR)", "Leg Rest & Extra Spacing", "VIP Cabin Service"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl330",
        bus_number: "SL-330",
        bus_type: "FIRST_CLASS",
        category: "First Class Premier",
        seat_capacity: 41,
        fare: 1100,
        has_cr: true,
        features: ["41 Premier Sleeper Recliners", "Onboard Comfort Room (CR)", "Leg Rest & Extra Spacing", "VIP Cabin Service"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl331",
        bus_number: "SL-331",
        bus_type: "FIRST_CLASS",
        category: "First Class Premier",
        seat_capacity: 41,
        fare: 1100,
        has_cr: true,
        features: ["41 Premier Sleeper Recliners", "Onboard Comfort Room (CR)", "Leg Rest & Extra Spacing", "VIP Cabin Service"],
        status: "ACTIVE",
    },
    {
        id: "bus-sl336",
        bus_number: "SL-336",
        bus_type: "FIRST_CLASS",
        category: "First Class Premier",
        seat_capacity: 41,
        fare: 1100,
        has_cr: true,
        features: ["41 Premier Sleeper Recliners", "Onboard Comfort Room (CR)", "Leg Rest & Extra Spacing", "VIP Cabin Service"],
        status: "ACTIVE",
    },
];
