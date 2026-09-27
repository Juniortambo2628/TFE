/**
 * stepFlow — the pure half of the StepFlow primitive.
 *
 * Kept JSX-free and dependency-free so `node --test` can load it directly
 * (same arrangement as lib/modalTabs.js and lib/stadiumBowl.js). The
 * renderer is Components/Common/StepFlow.jsx; everything here is a plain
 * data transform and is guarded by tests/JS/stepFlow.test.mjs.
 */

/** A step's progress state. `unstated` is the public-hub case: the bar
 *  explains a flow that has no instance behind it, so no step is "current"
 *  and none should render as complete. */
export const STEP_STATES = ['done', 'current', 'todo', 'unstated'];

const DEFAULT_STATE = 'unstated';

/**
 * Normalize whatever a call site passes into a uniform step list.
 *
 * Accepts bare strings (`['Brief', 'Quote']`) or objects. Numbering is
 * derived from position rather than read from the payload — a hand-written
 * `n` that disagrees with the order is a display bug waiting to happen,
 * and the server has no reason to send one.
 */
export function normalizeSteps(steps) {
    if (!Array.isArray(steps)) return [];

    return steps
        .filter((s) => s !== null && s !== undefined && s !== '')
        .map((step, i) => {
            const raw = typeof step === 'string' ? { title: step } : step;
            const title = String(raw.title ?? raw.label ?? '').trim();

            return {
                n: i + 1,
                title,
                icon: raw.icon || null,
                hint: raw.hint || null,
                state: STEP_STATES.includes(raw.state) ? raw.state : DEFAULT_STATE,
            };
        })
        .filter((s) => s.title !== '');
}

/**
 * Derive each step's state from a single 1-based cursor, for the common
 * case where a caller tracks one "you are here" index (a wizard's
 * `wizardStep`, a booking's stage) rather than labelling every step.
 *
 * A cursor of 0 or null means "not started" — every step reads `todo`,
 * which is different from `unstated`: the flow HAS an instance, it just
 * has not begun. Passing a cursor past the end marks everything done,
 * which is what a completed booking should look like.
 */
export function stepsWithCursor(steps, cursor) {
    const list = normalizeSteps(steps);
    if (cursor === null || cursor === undefined) return list;

    const at = Number(cursor);
    if (!Number.isFinite(at)) return list;

    return list.map((step) => {
        if (step.n < at) return { ...step, state: 'done' };
        if (step.n === at) return { ...step, state: 'current' };

        return { ...step, state: 'todo' };
    });
}

/**
 * The step a compact viewport should show when there is no room for the
 * full list. The current step is the useful one; failing that the first
 * step still to do. A flow whose every step is done reads as its LAST
 * step — it finished there, and falling back to step 1 would tell the fan
 * their completed booking is back at the brief. Anything else (an
 * explanatory bar with no progress at all) reads as its first step.
 */
export function primaryStep(steps) {
    const list = normalizeSteps(steps);
    if (!list.length) return null;

    const current = list.find((s) => s.state === 'current');
    if (current) return current;

    const todo = list.find((s) => s.state === 'todo');
    if (todo) return todo;

    if (list.every((s) => s.state === 'done')) return list[list.length - 1];

    return list[0];
}

/**
 * Completion as a 0-100 percentage, for the slim fill behind an inline
 * bar. A `current` step counts as half — it has been reached but not
 * finished, and rendering it as either 0 or 100 misreports the flow.
 */
export function completionPct(steps) {
    const list = normalizeSteps(steps);
    if (!list.length) return 0;

    const scored = list.reduce((sum, s) => {
        if (s.state === 'done') return sum + 1;
        if (s.state === 'current') return sum + 0.5;

        return sum;
    }, 0);

    return Math.round((scored / list.length) * 100);
}

/**
 * True when any step carries real progress — the signal for whether to
 * draw the completion fill and the done/current affordances at all. A
 * purely explanatory bar (the public partner hub) must not imply that a
 * fan is partway through anything.
 */
export function hasProgress(steps) {
    return normalizeSteps(steps).some((s) => s.state !== 'unstated');
}
