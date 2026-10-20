/**
 * Utility functions for 100% accurate Philippine Standard Time (PST / Asia/Manila, UTC+8)
 * date and time handling across Home, Search & Book, My Tickets, and APIs.
 */

/**
 * Returns current date in Asia/Manila timezone formatted as YYYY-MM-DD.
 * e.g. "2026-10-20"
 */
export function getTodayPH(): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    return formatter.format(new Date());
}

/**
 * Builds an ISO string with explicit Asia/Manila (+08:00) timezone offset.
 * Example: buildDepartureIsoPH("2026-10-25", "06:00") => "2026-10-25T06:00:00+08:00"
 */
export function buildDepartureIsoPH(dateStr: string, timeStr: string): string {
    const cleanDate = dateStr.slice(0, 10);
    const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return `${cleanDate}T${cleanTime}+08:00`;
}

/**
 * Formats an ISO string or Date into human-readable date in Philippine Standard Time.
 * Example: "Sun, Oct 25, 2026"
 */
export function formatDatePH(isoOrDate: string | Date | undefined | null): string {
    if (!isoOrDate) return "--";
    try {
        const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
        if (isNaN(d.getTime())) return String(isoOrDate).slice(0, 10);
        return d.toLocaleDateString("en-US", {
            timeZone: "Asia/Manila",
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    } catch {
        return "--";
    }
}

/**
 * Formats an ISO string or Date into human-readable 12-hour time in Philippine Standard Time.
 * Example: "6:00 AM", "8:30 PM"
 */
export function formatTimePH(isoOrDate: string | Date | undefined | null): string {
    if (!isoOrDate) return "--";
    try {
        const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
        if (isNaN(d.getTime())) return "--";
        return d.toLocaleTimeString("en-US", {
            timeZone: "Asia/Manila",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    } catch {
        return "--";
    }
}

/**
 * Formats combined date and time in Philippine Standard Time.
 * Example: "Sun, Oct 25, 2026 • 6:00 AM"
 */
export function formatDateTimePH(isoOrDate: string | Date | undefined | null): string {
    if (!isoOrDate) return "--";
    return `${formatDatePH(isoOrDate)} • ${formatTimePH(isoOrDate)}`;
}

/**
 * Checks if an ISO timestamp falls on target YYYY-MM-DD in Asia/Manila.
 */
export function isSameDatePH(isoTimestamp: string, targetYmd: string): boolean {
    if (!isoTimestamp || !targetYmd) return false;
    try {
        const d = new Date(isoTimestamp);
        if (isNaN(d.getTime())) return false;
        const ymd = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(d);
        return ymd === targetYmd.slice(0, 10);
    } catch {
        return false;
    }
}
