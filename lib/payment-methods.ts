// Shared by the client tracker and the payments API (no server imports here).
export const PAYMENT_METHODS = ["Cash App", "Zelle"] as const;
export const MAX_METHOD_LENGTH = 50;
