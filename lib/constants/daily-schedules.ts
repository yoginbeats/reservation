export interface DailyScheduleItem {
    id: string;
    time: string;           // e.g. "5:00 AM", "7:00 PM"
    route: string;          // e.g. "Daet ➔ Cubao - Alabang"
    bus_type: string;       // e.g. "REGULAR AIRCON (A/C)", "FIRST CLASS (F/C) W/ CR", "ORDINARY"
    bus_number?: string;    // e.g. "Bus 976", "Bus 310"
    via?: string;           // e.g. "Via Vinzons", "San Vicente", "Fr. Mercedes"
    period: "AM" | "PM" | "FEEDER";
    is_active: boolean;
    order_index: number;
    created_at?: string;
}

export const INITIAL_WHITEBOARD_SCHEDULES: DailyScheduleItem[] = [
    // AM Departures
    { id: "am-1", time: "5:00 AM", route: "Daet ➔ Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "", via: "Direct Express", period: "AM", is_active: true, order_index: 1 },
    { id: "am-2", time: "5:45 AM", route: "Daet ➔ Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 976", via: "Direct Express", period: "AM", is_active: true, order_index: 2 },
    { id: "am-3", time: "7:30 AM", route: "Daet ➔ Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 961", via: "Via Vinzons", period: "AM", is_active: true, order_index: 3 },
    { id: "am-4", time: "9:00 AM", route: "Daet ➔ Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 971", via: "Direct Express", period: "AM", is_active: true, order_index: 4 },
    { id: "am-5", time: "10:30 AM", route: "Daet ➔ Cubao - Alabang", bus_type: "ORDINARY", bus_number: "", via: "Regular Non-Aircon", period: "AM", is_active: true, order_index: 5 },
    { id: "am-6", time: "12:30 PM", route: "Daet ➔ PITX - Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 141", via: "Direct Express", period: "AM", is_active: true, order_index: 6 },

    // PM Departures
    { id: "pm-1", time: "2:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "", via: "Direct Express", period: "PM", is_active: true, order_index: 7 },
    { id: "pm-2", time: "3:30 PM", route: "Daet ➔ PITX - Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 146", via: "Direct Express", period: "PM", is_active: true, order_index: 8 },
    { id: "pm-3", time: "4:45 PM", route: "Daet ➔ PITX - Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "", via: "Direct Express", period: "PM", is_active: true, order_index: 9 },
    { id: "pm-4", time: "5:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 197", via: "Direct Express", period: "PM", is_active: true, order_index: 10 },
    { id: "pm-5", time: "6:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 1177", via: "San Vicente Origin", period: "PM", is_active: true, order_index: 11 },
    { id: "pm-6", time: "7:00 PM", route: "Daet ➔ PITX - Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 709", via: "Fr. Tarum PITX", period: "PM", is_active: true, order_index: 12 },
    { id: "pm-7", time: "7:00 PM", route: "Daet ➔ PITX - Cubao", bus_type: "FIRST CLASS (F/C) W/ CR", bus_number: "Bus 310", via: "Deluxe Recliner", period: "PM", is_active: true, order_index: 13 },
    { id: "pm-8", time: "7:30 PM", route: "Daet ➔ PITX - Cubao", bus_type: "FIRST CLASS (F/C) W/ CR", bus_number: "", via: "Deluxe Recliner", period: "PM", is_active: true, order_index: 14 },
    { id: "pm-9", time: "7:45 PM", route: "Daet ➔ PITX - Cubao", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 900", via: "Direct Express", period: "PM", is_active: true, order_index: 15 },
    { id: "pm-10", time: "8:00 PM", route: "Daet ➔ Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 109", via: "Fr. Mercedes Origin", period: "PM", is_active: true, order_index: 16 },
    { id: "pm-11", time: "8:30 PM", route: "Daet ➔ Alabang - Cubao", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 973", via: "Via Vinzons (Reg A/C)", period: "PM", is_active: true, order_index: 17 },
    { id: "pm-12", time: "8:45 PM", route: "Daet ➔ PITX - Alabang", bus_type: "AIRCON (A/C) W/ CR", bus_number: "Bus 330", via: "Onboard Restroom", period: "PM", is_active: true, order_index: 18 },
    { id: "pm-13", time: "9:00 PM", route: "Daet ➔ Alabang - Cubao", bus_type: "FIRST CLASS (F/C) W/ CR", bus_number: "Bus 336", via: "Deluxe Recliner", period: "PM", is_active: true, order_index: 19 },
    { id: "pm-14", time: "9:15 PM", route: "Daet ➔ Alabang - Cubao", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 333", via: "Direct Express", period: "PM", is_active: true, order_index: 20 },
    { id: "pm-15", time: "9:30 PM", route: "Daet ➔ Cubao - Alabang", bus_type: "REGULAR AIRCON (A/C)", bus_number: "Bus 914", via: "Direct Express", period: "PM", is_active: true, order_index: 21 },

    // Provincial Feeder Lines
    { id: "feed-1", time: "A.M. Service", route: "Capalonga / Larap", bus_type: "FEEDER CONNECTING", bus_number: "Bus 704", via: "Daet Central Connecting", period: "FEEDER", is_active: true, order_index: 22 },
    { id: "feed-2", time: "A.M. Service", route: "Capalonga", bus_type: "FEEDER CONNECTING", bus_number: "Bus 196", via: "Daet Central Connecting", period: "FEEDER", is_active: true, order_index: 23 },
    { id: "feed-3", time: "A.M. Service", route: "Tabas (Tab. Tnl)", bus_type: "FEEDER CONNECTING", bus_number: "Bus 111", via: "Daet Central Connecting", period: "FEEDER", is_active: true, order_index: 24 },
    { id: "feed-4", time: "P.M. Service", route: "Ordinary Passenger (ORD P/P)", bus_type: "FEEDER CONNECTING", bus_number: "Bus 710", via: "Daet Central Connecting", period: "FEEDER", is_active: true, order_index: 25 },
    { id: "feed-5", time: "P.M. Service", route: "Aircon Panganiban (A/C Pang.)", bus_type: "FEEDER CONNECTING", bus_number: "Bus 974", via: "Daet Central Connecting", period: "FEEDER", is_active: true, order_index: 26 },
    { id: "feed-6", time: "P.M. Service", route: "Aircon Paracale (A/C Par.)", bus_type: "FEEDER CONNECTING", bus_number: "Bus 1169", via: "Daet Central Connecting", period: "FEEDER", is_active: true, order_index: 27 },
];
