/**
 * Budget Calculator save errors → a message and the wizard step that sets
 * the field (Sprint 69). A failed save used to be a generic toast plus the
 * validation bag dumped to the console, which nobody but a developer reads.
 * JSX-free so `node --test` can load it.
 */
const FIELD_STEP = {
    match_ids: 2,
    nights: 3,
    accommodation_level: 3,
    flight_class: 3,
    currency: 3,
};

const FIELD_LABEL = {
    match_ids: 'matches',
    nights: 'nights',
    accommodation_level: 'accommodation',
    flight_class: 'flight class',
    total_cost: 'estimate',
    breakdown: 'estimate',
    name: 'itinerary name',
    currency: 'currency',
};

function firstKey(errors) {
    return Object.keys(errors || {})[0] || null;
}

/** 1-based wizard step that owns the first failing field, or null. */
export function saveErrorStep(errors) {
    const key = firstKey(errors);
    return key && Object.prototype.hasOwnProperty.call(FIELD_STEP, key) ? FIELD_STEP[key] : null;
}

/** One readable sentence for a toast. */
export function saveErrorMessage(errors) {
    const key = firstKey(errors);
    if (!key) return "Couldn't save your itinerary. Please try again.";
    const raw = errors[key];
    const text = Array.isArray(raw) ? raw[0] : raw;
    const label = FIELD_LABEL[key] || key.replace(/_/g, ' ');
    return text ? `Couldn't save — ${label}: ${text}` : `Couldn't save — check your ${label}.`;
}
