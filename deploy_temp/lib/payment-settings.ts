// Shared runtime setting for GCash Verification Mode on globalThis
// 'AUTO': Instant automatic validation & ticket generation
// 'MANUAL': Requires Teller / Admin to click 'Approve'

const globalForPayment = globalThis as unknown as {
    paymentVerificationMode?: "AUTO" | "MANUAL";
};

export function getVerificationMode(): "AUTO" | "MANUAL" {
    return globalForPayment.paymentVerificationMode || "AUTO";
}

export function setVerificationMode(mode: "AUTO" | "MANUAL"): void {
    globalForPayment.paymentVerificationMode = mode;
}
