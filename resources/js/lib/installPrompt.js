/**
 * When to offer "Install TFE" (installable website, Nov 2026 —
 * docs/proposals/mobile-app.md, phase 0). JSX- and DOM-free so `node --test`
 * loads it (tests/JS/installPrompt.test.mjs); Components/Common/InstallPrompt
 * applies it.
 *
 * The rule: never on a first visit (nobody installs a site they have not
 * used yet), never once installed, and not again for 30 days after "Not
 * now". Android/Chrome can install in one tap (the browser's own
 * `beforeinstallprompt`); iPhone Safari can't be prompted at all, so it gets
 * a two-line how-to instead; every other browser gets nothing.
 */

export const DISMISS_DAYS = 30;
export const MIN_VISIT_DAYS = 2;

/** 'native' (one-tap install), 'ios' (show how), or null (say nothing). */
export function installMode({ userAgent = '', standalone = false, hasNativePrompt = false } = {}) {
    if (standalone) return null;
    if (hasNativePrompt) return 'native';
    const ua = String(userAgent);
    const iOS = /iPhone|iPad|iPod/i.test(ua);
    // Only Safari itself can add to the home screen on iOS: Chrome and
    // Firefox there (CriOS, FxiOS) and in-app browsers (Instagram, FB) cannot.
    const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|GSA\//i.test(ua);
    return iOS && safari ? 'ios' : null;
}

/** Whether to show the offer now. `visitDays` is distinct days seen. */
export function shouldOffer({ mode, visitDays = 0, dismissedAt = null, now = Date.now() } = {}) {
    if (!mode) return false;
    if (visitDays < MIN_VISIT_DAYS) return false;
    if (dismissedAt && now - dismissedAt < DISMISS_DAYS * 86400000) return false;
    return true;
}

/**
 * Record today's visit in the stored list of visit days (YYYY-MM-DD, last
 * 10 kept) and return the new list. A second visit the same day is not a
 * returning visitor.
 */
export function recordVisit(days = [], today) {
    const list = Array.isArray(days) ? days.filter((d) => typeof d === 'string') : [];
    if (!list.includes(today)) list.push(today);
    return list.slice(-10);
}
