import fs from "fs";
import path from "path";

export interface OtpRecord {
    email: string;
    secondaryEmail?: string;
    otp: string;
    action: "GOOGLE_SIGNUP" | "GOOGLE_SIGNIN" | "EMAIL_LOGIN";
    createdAt: string;
    expiresAt: string;
    verified: boolean;
    attempts: number;
    metadata?: {
        userAgent?: string;
        ip?: string;
        device?: string;
        location?: string;
    };
}

export interface SecurityAlertLog {
    id: string;
    timestamp: string;
    primaryEmail: string;
    secondaryEmail?: string;
    action: string;
    status: "DISPATCHED" | "DELIVERED" | "SIMULATED";
    deviceInfo: string;
    subject: string;
    otp: string;
}

interface OtpStoreData {
    activeOtps: Record<string, OtpRecord>;
    secondaryEmails: Record<string, string>; // primaryEmail -> secondaryEmail mapping
    alertLogs: SecurityAlertLog[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const OTP_STORE_FILE = path.join(DATA_DIR, "otp-security-store.json");

function ensureDirectoryExists() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function readStore(): OtpStoreData {
    ensureDirectoryExists();
    if (!fs.existsSync(OTP_STORE_FILE)) {
        const initial: OtpStoreData = {
            activeOtps: {},
            secondaryEmails: {},
            alertLogs: [],
        };
        fs.writeFileSync(OTP_STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
        return initial;
    }

    try {
        const content = fs.readFileSync(OTP_STORE_FILE, "utf-8");
        return JSON.parse(content);
    } catch (e) {
        console.error("Error reading OTP security store:", e);
        return {
            activeOtps: {},
            secondaryEmails: {},
            alertLogs: [],
        };
    }
}

function writeStore(data: OtpStoreData) {
    ensureDirectoryExists();
    try {
        fs.writeFileSync(OTP_STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
        console.error("Error writing OTP security store:", e);
    }
}

/**
 * Generate a new 6-digit OTP for Google 2-Step / Double Verification
 */
export function generateSecurityOtp(
    primaryEmail: string,
    secondaryEmail?: string,
    action: "GOOGLE_SIGNUP" | "GOOGLE_SIGNIN" | "EMAIL_LOGIN" = "GOOGLE_SIGNUP",
    metadata?: any
): OtpRecord {
    const store = readStore();
    const cleanPrimary = primaryEmail.trim().toLowerCase();
    
    // Auto-resolve secondary email if not provided but saved previously
    const resolvedSecondary = (secondaryEmail?.trim().toLowerCase()) || store.secondaryEmails[cleanPrimary] || "";

    if (resolvedSecondary) {
        store.secondaryEmails[cleanPrimary] = resolvedSecondary;
    }

    // Generate clean 6-digit code (e.g. "482915")
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const record: OtpRecord = {
        email: cleanPrimary,
        secondaryEmail: resolvedSecondary || undefined,
        otp: code,
        action,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
        metadata: metadata || {
            device: "Web Browser (Chrome/Safari)",
            location: "Philippines",
        },
    };

    store.activeOtps[cleanPrimary] = record;

    // Create a logged Security Alert entry
    const alertEntry: SecurityAlertLog = {
        id: `SEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: now.toISOString(),
        primaryEmail: cleanPrimary,
        secondaryEmail: resolvedSecondary || undefined,
        action,
        status: "DISPATCHED",
        deviceInfo: metadata?.device || "Web Browser (Desktop / Mobile)",
        subject: `Security Alert: New Google Sign-In & Two-Step Verification for ${cleanPrimary}`,
        otp: code,
    };

    store.alertLogs.unshift(alertEntry);
    if (store.alertLogs.length > 50) {
        store.alertLogs = store.alertLogs.slice(0, 50);
    }

    writeStore(store);
    return record;
}

/**
 * Verify the submitted 6-digit OTP
 */
export function verifySecurityOtp(primaryEmail: string, submittedCode: string): { success: boolean; error?: string } {
    const store = readStore();
    const cleanPrimary = primaryEmail.trim().toLowerCase();
    const record = store.activeOtps[cleanPrimary];

    if (!record) {
        return { success: false, error: "No pending verification code found. Please request a new OTP." };
    }

    if (new Date() > new Date(record.expiresAt)) {
        return { success: false, error: "Verification code has expired. Please request a new OTP." };
    }

    if (record.attempts >= 5) {
        return { success: false, error: "Too many failed attempts. Please request a new OTP." };
    }

    record.attempts += 1;

    if (record.otp !== submittedCode.trim()) {
        writeStore(store);
        return { success: false, error: `Invalid OTP code. ${5 - record.attempts} attempts remaining.` };
    }

    record.verified = true;
    writeStore(store);
    return { success: true };
}

/**
 * Update the secondary / other Google email for security notifications
 */
export function setSecondaryEmailForUser(primaryEmail: string, secondaryEmail: string): void {
    const store = readStore();
    const cleanPrimary = primaryEmail.trim().toLowerCase();
    const cleanSecondary = secondaryEmail.trim().toLowerCase();

    store.secondaryEmails[cleanPrimary] = cleanSecondary;
    if (store.activeOtps[cleanPrimary]) {
        store.activeOtps[cleanPrimary].secondaryEmail = cleanSecondary;
    }
    writeStore(store);
}

/**
 * Get the saved secondary email
 */
export function getSecondaryEmailForUser(primaryEmail: string): string | null {
    const store = readStore();
    const cleanPrimary = primaryEmail.trim().toLowerCase();
    return store.secondaryEmails[cleanPrimary] || null;
}

/**
 * Retrieve the current active OTP record (for defense demo preview / inspection)
 */
export function getActiveOtpRecord(primaryEmail: string): OtpRecord | null {
    const store = readStore();
    const cleanPrimary = primaryEmail.trim().toLowerCase();
    return store.activeOtps[cleanPrimary] || null;
}

/**
 * Retrieve recent security alert logs
 */
export function getRecentSecurityAlertLogs(primaryEmail?: string): SecurityAlertLog[] {
    const store = readStore();
    if (!primaryEmail) return store.alertLogs;
    const clean = primaryEmail.trim().toLowerCase();
    return store.alertLogs.filter(
        (log) => log.primaryEmail === clean || log.secondaryEmail === clean
    );
}

