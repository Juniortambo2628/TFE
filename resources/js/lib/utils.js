import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Platform currency is USD across every listing, budget, and loan
// (see CLAUDE.md — Sprint 20 polish). Callers pass an explicit currency
// only for surfaces that intentionally show a non-USD value (e.g. the
// Payments page, which uses the transaction's own recorded currency).
export function formatMoney(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}
