/**
 * Swipe-down-to-close for TfeModal's bottom sheet on phones (Sprint 69).
 * JSX-free so `node --test` loads it.
 *
 * A sheet closes when it has been pulled far enough, OR flicked fast
 * enough — a short quick flick is as clear an intent as a long slow drag.
 */
export const SHEET_DISTANCE = 120; // px
export const SHEET_VELOCITY = 0.6; // px per ms

/** How far the sheet follows the finger: down only, never up. */
export function sheetOffset(startY, currentY) {
    return Math.max(0, currentY - startY);
}

export function shouldDismissSheet(dy, ms) {
    if (dy <= 0) return false;
    if (dy >= SHEET_DISTANCE) return true;
    return ms > 0 && dy >= 24 && dy / ms >= SHEET_VELOCITY;
}
