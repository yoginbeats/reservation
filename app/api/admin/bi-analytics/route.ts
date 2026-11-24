import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalBookings } from "@/lib/local-booking-store";
import { getActiveScheduledTrips } from "@/lib/trip-store";

interface RemittanceRecord {
    id: string;
    terminal_name: string;
    teller_name: string;
    counter_number: string;
    gross_sales: number;
    total_discounts: number;
    net_cash_expected: number;
    total_cash_counted: number;
    total_tickets: number;
    variance: number;
    status: string;
    timestamp: string;
}

const tellerAuditStore = globalThis as unknown as {
    tellerRemittances?: RemittanceRecord[];
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "30DAYS";
        const terminalFilter = searchParams.get("terminal") || "ALL";
        const busTypeFilter = searchParams.get("bus_type") || "ALL";

        const supabase = await createClient();

        // 1. Gather all Bookings from Supabase
        let dbBookings: any[] = [];
        try {
            const { data } = await supabase
                .from("bookings")
                .select("*, trip:trips(*, bus:buses(*)), terminal:terminals(*)")
                .order("created_at", { ascending: false });
            if (data && data.length > 0) dbBookings = data;
        } catch (e) {
            console.warn("Could not fetch bookings from Supabase:", e);
        }

        // Fallback to reservations if bookings empty
        if (dbBookings.length === 0) {
            try {
                const { data: resData } = await supabase
                    .from("reservations")
                    .select("*, trip:trips(*, bus:buses(*))")
                    .order("created_at", { ascending: false });
                if (resData && resData.length > 0) {
                    dbBookings = resData.map((r: any) => ({
                        id: r.id,
                        created_at: r.created_at,
                        passenger_name: r.passenger_name,
                        passenger_contact: r.passenger_contact || "",
                        seat_number: r.seat_number,
                        total_price: Number(r.total_price || 850),
                        booking_source: r.booking_source || "WALK_IN",
                        booking_status: r.status || "CONFIRMED",
                        trip: r.trip,
                        terminal: { name: r.trip?.origin || "Cubao" }
                    }));
                }
            } catch {}
        }

        // 2. Merge with Local Bookings Cache
        const localList = getLocalBookings();
        const mergedBookings: any[] = [...dbBookings];

        for (const lb of localList) {
            const exists = mergedBookings.some(b => b.id === lb.id || (lb.qr_token && b.qr_token === lb.qr_token));
            if (!exists) {
                mergedBookings.push({
                    id: lb.id,
                    created_at: lb.created_at,
                    passenger_name: lb.passenger_name,
                    passenger_contact: lb.passenger_contact,
                    seat_number: lb.seat_number,
                    total_price: Number(lb.total_price) || 850,
                    original_price: Number(lb.original_price) || (Number(lb.total_price) + (Number(lb.discount_amount) || 0)),
                    discount_amount: Number(lb.discount_amount) || 0,
                    is_discounted: Boolean(lb.discount_amount && lb.discount_amount > 0),
                    passenger_type: lb.passenger_type || (lb.discount_amount ? "20% DISCOUNT" : "REGULAR"),
                    booking_source: lb.booking_source || "ONLINE",
                    booking_status: lb.booking_status || "CONFIRMED",
                    payment_method: lb.payment_method || "GCASH",
                    trip: {
                        id: lb.trip.departure_time + "-" + lb.trip.origin,
                        origin: lb.trip.origin || "Cubao",
                        destination: lb.trip.destination || "Daet",
                        departure_time: lb.trip.departure_time,
                        bus_number: lb.trip.bus_number || "SL-101",
                        bus_type: (lb.trip as any).bus_type || "REGULAR AIRCON",
                    },
                    terminal: { name: lb.trip.origin || "Cubao" }
                });
            }
        }

        // 3. Gather Scheduled Trips
        const scheduledTrips = getActiveScheduledTrips();

        // 4. Filter Bookings by Period
        const now = new Date();
        const filteredBookings = mergedBookings.filter(b => {
            const bDate = new Date(b.created_at || now);
            if (period === "TODAY") {
                return bDate.toDateString() === now.toDateString();
            }
            if (period === "7DAYS") {
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return bDate >= sevenDaysAgo;
            }
            if (period === "30DAYS") {
                const thirtyDaysAgo = new Date(now);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return bDate >= thirtyDaysAgo;
            }
            return true; // "ALL"
        }).filter(b => {
            if (terminalFilter === "ALL") return true;
            const term = (b.terminal?.name || b.trip?.origin || "").toLowerCase();
            return term.includes(terminalFilter.toLowerCase());
        }).filter(b => {
            if (busTypeFilter === "ALL") return true;
            const bType = (b.trip?.bus?.bus_type || b.trip?.bus_type || "").toUpperCase();
            return bType.includes(busTypeFilter.toUpperCase());
        });

        // =========================================================================
        // SECTION 1: PEAK SALES TIME ANALYTICS
        // =========================================================================
        const hourlySalesMap: { [hour: number]: { sales: number; tickets: number; departures: number } } = {};
        for (let h = 0; h < 24; h++) {
            hourlySalesMap[h] = { sales: 0, tickets: 0, departures: 0 };
        }

        // Populate from filtered bookings (using created_at for ticket selling time)
        filteredBookings.forEach(b => {
            if (b.booking_status === "CANCELLED") return;
            const date = new Date(b.created_at || now);
            const hour = date.getHours();
            const fare = Number(b.total_price) || 850;
            if (hourlySalesMap[hour]) {
                hourlySalesMap[hour].sales += fare;
                hourlySalesMap[hour].tickets += 1;
            }
        });

        // Also track scheduled bus departures by hour
        scheduledTrips.forEach(t => {
            const depTime = new Date(t.departure_time);
            if (!isNaN(depTime.getTime())) {
                const hour = depTime.getHours();
                if (hourlySalesMap[hour]) {
                    hourlySalesMap[hour].departures += 1;
                }
            }
        });

        const hourlySalesArray = Object.keys(hourlySalesMap).map(hStr => {
            const h = parseInt(hStr, 10);
            const periodLabel = h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
            const fullLabel = `${periodLabel}:00 - ${h === 23 ? "12 AM" : h + 1 > 12 ? `${h + 1 - 12} PM` : `${h + 1} AM`}:00`;
            return {
                hour_24: h,
                hour_label: periodLabel,
                full_time_window: fullLabel,
                sales_amount: hourlySalesMap[h].sales,
                ticket_count: hourlySalesMap[h].tickets,
                passenger_volume: hourlySalesMap[h].tickets,
                departures_count: hourlySalesMap[h].departures,
            };
        });

        // Calculate live peak metrics
        const hasSales = hourlySalesArray.some(item => item.sales_amount > 0);
        const hasDepartures = hourlySalesArray.some(item => item.departures_count > 0);

        // Determine Peak Selling Time
        const peakSellingItem = hasSales
            ? [...hourlySalesArray].sort((a, b) => b.sales_amount - a.sales_amount)[0]
            : null;

        // Determine Peak Departure Time
        const peakDepartureItem = hasDepartures
            ? [...hourlySalesArray].sort((a, b) => b.departures_count - a.departures_count)[0]
            : null;

        // Determine Least Busy Time (filter out extreme off-hours if 0 or pick lowest)
        const leastBusyItem = hasSales
            ? [...hourlySalesArray]
                .filter(item => item.hour_24 >= 1 && item.hour_24 <= 5)
                .sort((a, b) => a.sales_amount - b.sales_amount)[0] || hourlySalesArray[2]
            : null;

        // Morning vs Afternoon vs Evening Sales Breakdown
        let morningSales = 0;
        let morningTickets = 0;
        let afternoonSales = 0;
        let afternoonTickets = 0;
        let eveningSales = 0;
        let eveningTickets = 0;

        hourlySalesArray.forEach(item => {
            if (item.hour_24 >= 5 && item.hour_24 < 12) {
                morningSales += item.sales_amount;
                morningTickets += item.ticket_count;
            } else if (item.hour_24 >= 12 && item.hour_24 < 18) {
                afternoonSales += item.sales_amount;
                afternoonTickets += item.ticket_count;
            } else {
                eveningSales += item.sales_amount;
                eveningTickets += item.ticket_count;
            }
        });

        const totalDaySales = morningSales + afternoonSales + eveningSales || 1;
        const timeOfDayBreakdown = {
            morning: {
                label: "Morning (05:00 AM - 11:59 AM)",
                time_range: "05:00 AM - 11:59 AM",
                sales: morningSales,
                tickets: morningTickets,
                percentage: Math.round((morningSales / totalDaySales) * 100),
            },
            afternoon: {
                label: "Afternoon (12:00 PM - 05:59 PM)",
                time_range: "12:00 PM - 05:59 PM",
                sales: afternoonSales,
                tickets: afternoonTickets,
                percentage: Math.round((afternoonSales / totalDaySales) * 100),
            },
            evening: {
                label: "Evening / Night (06:00 PM - 04:59 AM)",
                time_range: "06:00 PM - 04:59 AM",
                sales: eveningSales,
                tickets: eveningTickets,
                percentage: Math.round((eveningSales / totalDaySales) * 100),
            },
        };

        // =========================================================================
        // SECTION 2: BUS TYPE PERFORMANCE ANALYTICS
        // =========================================================================
        const busClassDefaults: { [key: string]: { name: string; capacity: number; baseFare: number; color: string } } = {
            "REGULAR_AIRCON": { name: "Regular Aircon (49 Seats)", capacity: 49, baseFare: 850, color: "#2563eb" },
            "SUPER_DELUXE": { name: "Super Deluxe (43 Seats • CR)", capacity: 43, baseFare: 950, color: "#059669" },
            "FIRST_CLASS": { name: "First Class (41 Seats • CR)", capacity: 41, baseFare: 1100, color: "#7c3aed" },
        };

        const busClassMap: { [key: string]: {
            bus_type: string;
            display_name: string;
            seat_capacity: number;
            total_revenue: number;
            passenger_count: number;
            trips_count: number;
            color: string;
        } } = {};

        Object.keys(busClassDefaults).forEach(key => {
            busClassMap[key] = {
                bus_type: key,
                display_name: busClassDefaults[key].name,
                seat_capacity: busClassDefaults[key].capacity,
                total_revenue: 0,
                passenger_count: 0,
                trips_count: 0,
                color: busClassDefaults[key].color,
            };
        });

        // Tally from filteredBookings
        filteredBookings.forEach(b => {
            if (b.booking_status === "CANCELLED") return;
            const rawType = (b.trip?.bus?.bus_type || b.trip?.bus_type || "REGULAR_AIRCON").toUpperCase();
            let key = "REGULAR_AIRCON";
            if (rawType.includes("FIRST")) key = "FIRST_CLASS";
            else if (rawType.includes("SUPER") || rawType.includes("DELUXE")) key = "SUPER_DELUXE";

            const netPrice = Number(b.total_price) || busClassDefaults[key].baseFare;
            busClassMap[key].total_revenue += netPrice;
            busClassMap[key].passenger_count += 1;
        });

        // Count actual trips per bus class from scheduledTrips
        scheduledTrips.forEach(t => {
            const rawType = ((t as any).bus?.bus_type || t.bus_type || "REGULAR_AIRCON").toUpperCase();
            let key = "REGULAR_AIRCON";
            if (rawType.includes("FIRST")) key = "FIRST_CLASS";
            else if (rawType.includes("SUPER") || rawType.includes("DELUXE")) key = "SUPER_DELUXE";
            busClassMap[key].trips_count += 1;
        });

        const busPerformanceList = Object.values(busClassMap).map(item => {
            const totalAvailableSeats = item.trips_count * item.seat_capacity;
            const occupancyRate = totalAvailableSeats > 0 ? Math.min(100, Math.round((item.passenger_count / totalAvailableSeats) * 100)) : 0;
            const avgRevPerTrip = item.trips_count > 0 ? Math.round(item.total_revenue / item.trips_count) : 0;
            const avgFare = item.passenger_count > 0 ? Math.round(item.total_revenue / item.passenger_count) : 0;

            return {
                ...item,
                occupancy_rate: occupancyRate,
                average_revenue_per_trip: avgRevPerTrip,
                average_fare: avgFare,
            };
        }).sort((a, b) => b.total_revenue - a.total_revenue);

        const mostPopularBusType = [...busPerformanceList].sort((a, b) => b.passenger_count - a.passenger_count)[0] || busPerformanceList[0];
        const leastPopularBusType = [...busPerformanceList].sort((a, b) => a.passenger_count - b.passenger_count)[0] || busPerformanceList[busPerformanceList.length - 1];

        // =========================================================================
        // SECTION 3: TERMINAL PERFORMANCE ANALYTICS
        // =========================================================================
        const terminalDefaults: { [key: string]: { name: string; code: string; location: string; baseTrips: number; peakHours: string } } = {
            "Cubao": {
                name: "Cubao Central Terminal",
                code: "CUB",
                location: "Superlines Bus Terminal, EDSA, Cubao, Quezon City",
                baseTrips: 0,
                peakHours: "06:00 PM - 09:30 PM",
            },
            "Daet": {
                name: "Daet Main Terminal",
                code: "DAE",
                location: "Daet Central Terminal, Camarines Norte, Bicol",
                baseTrips: 0,
                peakHours: "05:00 AM - 08:30 AM",
            },
            "PITX": {
                name: "PITX Integrated Terminal",
                code: "PTX",
                location: "Parañaque Integrated Terminal Exchange, Bay 12",
                baseTrips: 0,
                peakHours: "04:30 PM - 07:30 PM",
            },
        };

        const terminalStatsMap: { [key: string]: {
            terminal_id: string;
            name: string;
            code: string;
            location: string;
            ticket_sales: number;
            passenger_count: number;
            bus_departure_frequency: number;
            peak_hours: string;
            tellers: Array<{
                name: string;
                counter: string;
                tickets_sold: number;
                sales_amount: number;
                remittance_status: string;
            }>;
        } } = {};

        Object.keys(terminalDefaults).forEach(tKey => {
            terminalStatsMap[tKey] = {
                terminal_id: `term-${tKey.toLowerCase()}`,
                name: terminalDefaults[tKey].name,
                code: terminalDefaults[tKey].code,
                location: terminalDefaults[tKey].location,
                ticket_sales: 0,
                passenger_count: 0,
                bus_departure_frequency: 0,
                peak_hours: terminalDefaults[tKey].peakHours,
                tellers: [],
            };
        });

        // Count actual departures per terminal from scheduledTrips
        scheduledTrips.forEach(t => {
            const origin = (t.origin || "").toLowerCase();
            if (origin.includes("cubao")) terminalStatsMap["Cubao"].bus_departure_frequency += 1;
            else if (origin.includes("daet")) terminalStatsMap["Daet"].bus_departure_frequency += 1;
            else if (origin.includes("pitx")) terminalStatsMap["PITX"].bus_departure_frequency += 1;
        });

        // Tally from filteredBookings
        filteredBookings.forEach(b => {
            if (b.booking_status === "CANCELLED") return;
            const originTerm = (b.terminal?.name || b.trip?.origin || "Cubao").toLowerCase();
            let key = "Cubao";
            if (originTerm.includes("daet")) key = "Daet";
            else if (originTerm.includes("pitx")) key = "PITX";

            const netPrice = Number(b.total_price) || 850;
            if (terminalStatsMap[key]) {
                terminalStatsMap[key].ticket_sales += netPrice;
                terminalStatsMap[key].passenger_count += 1;
            }
        });

        // Incorporate tellerRemittances from live store if available
        if (tellerAuditStore.tellerRemittances && tellerAuditStore.tellerRemittances.length > 0) {
            tellerAuditStore.tellerRemittances.forEach(remit => {
                const termName = remit.terminal_name.toLowerCase();
                let key = "Cubao";
                if (termName.includes("daet")) key = "Daet";
                else if (termName.includes("pitx")) key = "PITX";

                const tellerList = terminalStatsMap[key].tellers;
                const existingTeller = tellerList.find(t => t.name.toLowerCase().includes(remit.teller_name.toLowerCase()));
                if (existingTeller) {
                    existingTeller.sales_amount += remit.net_cash_expected;
                    existingTeller.tickets_sold += remit.total_tickets;
                    existingTeller.remittance_status = remit.status === "CLOSED_RESET" ? "CLOSED & RESET" : "REMITTED";
                } else {
                    tellerList.push({
                        name: remit.teller_name,
                        counter: (remit as any).counter_window || (remit as any).counter || "Counter 1",
                        tickets_sold: remit.total_tickets,
                        sales_amount: remit.net_cash_expected,
                        remittance_status: remit.status === "CLOSED_RESET" ? "CLOSED & RESET" : "REMITTED",
                    });
                }
            });
        }

        const networkTotalTerminalSales = Object.values(terminalStatsMap).reduce((sum, t) => sum + t.ticket_sales, 0);
        const networkTotalPassengers = Object.values(terminalStatsMap).reduce((sum, t) => sum + t.passenger_count, 0);

        const terminalPerformanceList = Object.values(terminalStatsMap).map(term => {
            const sharePct = networkTotalTerminalSales > 0 ? Math.round((term.ticket_sales / networkTotalTerminalSales) * 100) : 0;
            const avgTicketVal = term.passenger_count > 0 ? Math.round(term.ticket_sales / term.passenger_count) : 0;
            const isSelected = terminalFilter !== "ALL" && term.name.toLowerCase().includes(terminalFilter.toLowerCase());
            return {
                ...term,
                share_percentage: sharePct,
                average_ticket_value: avgTicketVal,
                is_selected: isSelected,
            };
        }).sort((a, b) => b.ticket_sales - a.ticket_sales);

        const highestGrossingTerminal = terminalPerformanceList[0];
        const lowestGrossingTerminal = terminalPerformanceList[terminalPerformanceList.length - 1];

        const activeTerminalRecord = terminalFilter !== "ALL"
            ? terminalPerformanceList.find(t => t.name.toLowerCase().includes(terminalFilter.toLowerCase()))
            : null;

        // =========================================================================
        // SECTION 5: DAY OF THE WEEK ANALYTICS
        // =========================================================================
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayStatsMap: { [dayIndex: number]: {
            day: string;
            day_index: number;
            short_day: string;
            sales: number;
            passengers: number;
            is_weekend: boolean;
        } } = {};

        dayNames.forEach((dName, idx) => {
            dayStatsMap[idx] = {
                day: dName,
                day_index: idx,
                short_day: dName.substring(0, 3).toUpperCase(),
                sales: 0,
                passengers: 0,
                is_weekend: idx === 0 || idx === 5 || idx === 6, // Fri, Sat, Sun
            };
        });

        filteredBookings.forEach(b => {
            if (b.booking_status === "CANCELLED") return;
            const bDate = new Date(b.created_at || now);
            const dayIdx = bDate.getDay();
            const fare = Number(b.total_price) || 850;
            if (dayStatsMap[dayIdx]) {
                dayStatsMap[dayIdx].sales += fare;
                dayStatsMap[dayIdx].passengers += 1;
            }
        });

        // Order days Monday (1) through Sunday (0)
        const orderedDayIndices = [1, 2, 3, 4, 5, 6, 0];
        const dayOfWeekList = orderedDayIndices.map(dIdx => {
            const item = dayStatsMap[dIdx];
            const avgFare = item.passengers > 0 ? Math.round(item.sales / item.passengers) : 0;
            return {
                ...item,
                average_fare: avgFare,
            };
        });

        const peakDay = [...dayOfWeekList].sort((a, b) => b.sales - a.sales)[0] || dayOfWeekList[0];
        const leastBusyDay = [...dayOfWeekList].sort((a, b) => a.sales - b.sales)[0] || dayOfWeekList[1];

        // Weekday vs Weekend Comparison
        const weekdayItems = dayOfWeekList.filter(d => !d.is_weekend);
        const weekendItems = dayOfWeekList.filter(d => d.is_weekend);

        const weekdayTotalSales = weekdayItems.reduce((acc, curr) => acc + curr.sales, 0);
        const weekdayTotalPassengers = weekdayItems.reduce((acc, curr) => acc + curr.passengers, 0);
        const weekdayAvgDaily = Math.round(weekdayTotalSales / Math.max(1, weekdayItems.length));

        const weekendTotalSales = weekendItems.reduce((acc, curr) => acc + curr.sales, 0);
        const weekendTotalPassengers = weekendItems.reduce((acc, curr) => acc + curr.passengers, 0);
        const weekendAvgDaily = Math.round(weekendTotalSales / Math.max(1, weekendItems.length));

        const weekendSurgePercentage = weekdayAvgDaily > 0
            ? Math.round(((weekendAvgDaily - weekdayAvgDaily) / weekdayAvgDaily) * 100)
            : 0;

        return NextResponse.json({
            success: true,
            filters: {
                period,
                terminal: terminalFilter,
                bus_type: busTypeFilter,
                sample_count: filteredBookings.length,
            },
            peak_sales_time: {
                hourly_breakdown: hourlySalesArray,
                peak_selling_time: {
                    hour_window: peakSellingItem?.full_time_window || "No sales yet",
                    short_label: peakSellingItem?.hour_label || "N/A",
                    sales_amount: peakSellingItem?.sales_amount || 0,
                    ticket_count: peakSellingItem?.ticket_count || 0,
                },
                peak_departure_time: {
                    hour_window: peakDepartureItem?.full_time_window || "No trips scheduled",
                    short_label: peakDepartureItem?.hour_label || "N/A",
                    departures_count: peakDepartureItem?.departures_count || 0,
                    passenger_volume: peakDepartureItem?.passenger_volume || 0,
                },
                least_busy_time: {
                    hour_window: leastBusyItem?.full_time_window || "N/A",
                    short_label: leastBusyItem?.hour_label || "N/A",
                    sales_amount: leastBusyItem?.sales_amount || 0,
                    ticket_count: leastBusyItem?.ticket_count || 0,
                },
                time_of_day: timeOfDayBreakdown,
            },
            bus_type_performance: {
                bus_types: busPerformanceList,
                most_popular: {
                    bus_type: mostPopularBusType.bus_type,
                    display_name: mostPopularBusType.display_name,
                    passenger_count: mostPopularBusType.passenger_count,
                    occupancy_rate: mostPopularBusType.occupancy_rate,
                    total_revenue: mostPopularBusType.total_revenue,
                },
                least_popular: {
                    bus_type: leastPopularBusType.bus_type,
                    display_name: leastPopularBusType.display_name,
                    passenger_count: leastPopularBusType.passenger_count,
                    occupancy_rate: leastPopularBusType.occupancy_rate,
                    total_revenue: leastPopularBusType.total_revenue,
                },
            },
            terminal_performance: {
                terminals: terminalPerformanceList,
                network_total_sales: networkTotalTerminalSales,
                network_total_passengers: networkTotalPassengers,
                active_terminal: activeTerminalRecord,
                highest_grossing: {
                    terminal_id: highestGrossingTerminal.terminal_id,
                    name: highestGrossingTerminal.name,
                    sales: highestGrossingTerminal.ticket_sales,
                    passengers: highestGrossingTerminal.passenger_count,
                    share: highestGrossingTerminal.share_percentage,
                },
                lowest_grossing: {
                    terminal_id: lowestGrossingTerminal.terminal_id,
                    name: lowestGrossingTerminal.name,
                    sales: lowestGrossingTerminal.ticket_sales,
                    passengers: lowestGrossingTerminal.passenger_count,
                    share: lowestGrossingTerminal.share_percentage,
                },
            },
            day_of_week_analytics: {
                days: dayOfWeekList,
                peak_day: {
                    day: peakDay.day,
                    sales: peakDay.sales,
                    passengers: peakDay.passengers,
                },
                least_busy_day: {
                    day: leastBusyDay.day,
                    sales: leastBusyDay.sales,
                    passengers: leastBusyDay.passengers,
                },
                weekday_vs_weekend: {
                    weekday_total_sales: weekdayTotalSales,
                    weekday_passengers: weekdayTotalPassengers,
                    weekday_avg_daily: weekdayAvgDaily,
                    weekend_total_sales: weekendTotalSales,
                    weekend_passengers: weekendTotalPassengers,
                    weekend_avg_daily: weekendAvgDaily,
                    surge_percentage: weekendSurgePercentage,
                },
            },
        });
    } catch (err: any) {
        console.error("BI Analytics GET error:", err);
        return NextResponse.json({ error: err.message || "Failed to load BI analytics." }, { status: 500 });
    }
}
