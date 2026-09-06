/**
 * QR Code & Ticket Token Helper Utilities
 */

/**
 * Generates a unique secure QR token for a ticket.
 * Example format: TKT-20260903-X8A2K9
 */
export function generateQrToken(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TKT-${dateStr}-${randomHex}`;
}

/**
 * Validates the syntax of a QR token
 */
export function isValidQrTokenFormat(token: string): boolean {
    if (!token) return false;
    return /^TKT-\d{8}-[A-Z0-9]{6}$/i.test(token.trim());
}
