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
 * Counts (seats, reviews, km) — pinned to en-US like formatMoney, so the same
 * number reads the same on every machine (Sprint 69). Bare
 * `formatNumber(n)` follows the host locale and ICU build; 46 call sites
 * used it, so "1.234" and "1,234" could sit on the same screen.
 */
export function formatNumber(value, maximumFractionDigits = 0) {
    const n = Number(value);
    return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(Number.isFinite(n) ? n : 0);
}

/**
 * Date + time for a timestamp, e.g. "Jun 14, 2027, 7:00 PM". Pinned locale
 * for the same reason; the TIME ZONE is still the viewer's, which is what a
 * kickoff or a hold expiry should be read in. '' for a missing/invalid date.
 */
export function formatDateTime(value, options = {}) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', ...options,
    }).format(d);
}

/** Kickoff time on a ticket or fixture: "Mon, Jun 14, 7:00 PM". */
export function formatKickoff(value) {
    return formatDateTime(value, { weekday: 'short', year: undefined });
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
