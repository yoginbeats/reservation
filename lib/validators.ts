// ==============================================================================
// STRICT INPUT VALIDATION & SANITIZATION (Zod / Joi / Express-Validator compatible)
// Validates: Emails, Dates, Number of Guests / Seats before hitting the database.
// ==============================================================================

import { z } from "zod";

/**
 * HTML/Script Sanitizer to strip dangerous tags and script injection
 */
export function sanitizeString(input: unknown): string {
    if (typeof input !== "string") return "";
    return input
        .replace(/<[^>]*>/g, "") // Strip HTML tags
        .replace(/['"`;\\]/g, "") // Strip raw quote/SQL breakout characters
        .trim();
}

/**
 * Strict Email Validator & Sanitizer
 */
export function validateAndSanitizeEmail(rawEmail: unknown): { isValid: boolean; sanitized: string; error?: string } {
    if (typeof rawEmail !== "string") {
        return { isValid: false, sanitized: "", error: "Email must be a valid string." };
    }

    const trimmed = rawEmail.trim().toLowerCase();
    // Strict RFC 5322 compliant regex pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!trimmed || trimmed.length > 254) {
        return { isValid: false, sanitized: "", error: "Email length is invalid (must be 1-254 characters)." };
    }

    if (!emailRegex.test(trimmed)) {
        return { isValid: false, sanitized: "", error: "Please enter a valid email address format (e.g. passenger@example.com)." };
    }

    return { isValid: true, sanitized: trimmed };
}

/**
 * Strict Date Validator (YYYY-MM-DD or ISO string)
 */
export function validateDate(rawDate: unknown, options: { allowPast?: boolean } = {}): { isValid: boolean; date?: Date; error?: string } {
    if (typeof rawDate !== "string" && !(rawDate instanceof Date)) {
        return { isValid: false, error: "Date must be a string or Date object." };
    }

    const dateStr = typeof rawDate === "string" ? rawDate.trim() : rawDate.toISOString();
    const parsed = new Date(dateStr);

    if (isNaN(parsed.getTime())) {
        return { isValid: false, error: "Invalid calendar date provided." };
    }

    // Check YYYY-MM-DD format if string matches
    if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-").map(Number);
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return { isValid: false, error: "Date values (month/day) are out of range." };
        }
    }

    if (!options.allowPast) {
        // Disallow travel dates in the past (allowing 24-hour grace for timezones)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (parsed < yesterday) {
            return { isValid: false, error: "Travel date cannot be in the past." };
        }
    }

    return { isValid: true, date: parsed };
}

/**
 * Strict Number of Guests / Seat Count Validator (1 to 45)
 */
export function validateGuestCount(rawCount: unknown): { isValid: boolean; count: number; error?: string } {
    const num = Number(rawCount);

    if (isNaN(num) || !Number.isInteger(num)) {
        return { isValid: false, count: 0, error: "Number of guests must be a valid whole integer." };
    }

    if (num < 1) {
        return { isValid: false, count: 0, error: "Number of guests must be at least 1." };
    }

    if (num > 45) {
        return { isValid: false, count: 0, error: "Number of guests cannot exceed maximum bus capacity of 45." };
    }

    return { isValid: true, count: num };
}

// ==============================================================================
// ZOD SCHEMAS (Industry-Standard for Node.js / Next.js)
// ==============================================================================

export const BookingInputSchema = z.object({
    tripId: z.string().min(1, "Trip ID is required"),
    seatNumber: z.coerce.number().int().min(1, "Seat number must be between 1 and 45").max(45, "Seat number cannot exceed 45"),
    seatNumbers: z.array(z.coerce.number().int().min(1).max(45)).optional(),
    passengerName: z.string().min(2, "Passenger name must be at least 2 characters").max(100).transform(sanitizeString),
    passengerContact: z.string().min(7, "Contact number is required").max(30).transform(sanitizeString).optional(),
    passengerEmail: z.string().email("Invalid email address").max(254).transform((v) => v.toLowerCase().trim()),
    totalPrice: z.coerce.number().min(0, "Total price cannot be negative"),
    gcashRefNumber: z.string().min(6, "Valid GCash reference number required").max(50).transform(sanitizeString).optional(),
});

export const LoginInputSchema = z.object({
    email: z.string().email("Invalid email address").max(254).transform((v) => v.toLowerCase().trim()),
    password: z.string().min(1, "Password is required").max(128),
});

export const TripSearchInputSchema = z.object({
    origin: z.string().max(100).transform(sanitizeString).optional(),
    destination: z.string().max(100).transform(sanitizeString).optional(),
    travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    guests: z.coerce.number().int().min(1, "At least 1 guest required").max(45, "Max 45 guests").optional(),
});
