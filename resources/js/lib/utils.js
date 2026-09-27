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

/**
 * Sentence-case a raw slug for display: `upcoming` → `Upcoming`.
 *
 * Exists because `.tfe-acard__status` used to do this in CSS with
 * `text-transform: capitalize`, which also re-cased every WRITTEN label a
 * caller handed it ("Running a club" → "Running A Club"). Casing belongs at
 * the callsite, as it already does for `.tfe-btn`. Only pass a slug — a
 * label that is already written stays as written.
 */
export function titleCase(value) {
    if (typeof value !== 'string' || value === '') return value;

    const words = value.replace(/[_-]+/g, ' ').trim();

    return words.charAt(0).toUpperCase() + words.slice(1);
}
