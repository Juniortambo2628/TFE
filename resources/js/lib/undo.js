/**
 * Deferred commit for "undo instead of are-you-sure" (Sprint 69).
 *
 * The item disappears at once and the request is only SENT when the undo
 * window closes, so Undo never has to un-delete anything server-side. If the
 * tab is closed inside the window the action simply never happens — the
 * safe way for it to fail. JSX-free so `node --test` loads it.
 */
export const UNDO_WINDOW_MS = 5000;

export function scheduleUndoable({ commit, delay = UNDO_WINDOW_MS, timers = globalThis }) {
    let state = 'pending';
    const handle = timers.setTimeout(() => {
        if (state !== 'pending') return;
        state = 'committed';
        commit();
    }, delay);

    return {
        /** true when the undo landed in time. */
        undo() {
            if (state !== 'pending') return false;
            state = 'undone';
            timers.clearTimeout(handle);
            return true;
        },
        /** Commit now (e.g. the page is being left). */
        flush() {
            if (state !== 'pending') return;
            timers.clearTimeout(handle);
            state = 'committed';
            commit();
        },
        get state() { return state; },
    };
}
