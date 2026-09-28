/**
 * schedule — reading and writing a listing's `starts_at` / `ends_at` /
 * `location`.
 *
 * Pure and dependency-free so `node --test` loads it directly, like
 * lib/stepFlow.js and lib/stadiumBowl.js. Guarded by
 * tests/JS/schedule.test.mjs.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n) => String(n).padStart(2, '0');

function parse(value) {
    if (!value) return null;

    const d = value instanceof Date ? value : new Date(value);

    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * An `<input type="datetime-local">` value: `YYYY-MM-DDTHH:mm`, in LOCAL
 * time.
 *
 * Handing the input a raw ISO string leaves it blank — it accepts only that
 * exact naive shape — and `toISOString()` is worse than useless here,
 * because it converts to UTC and silently shifts the time the partner typed.
 * So the parts are read with the local getters.
 */
export function toLocalInput(value) {
    const d = parse(value);
    if (!d) return '';

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        + `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * A human range: "12–15 Jun 2026", "28 Jun – 3 Jul 2026", "12 Jun 2026".
 *
 * Deliberately NOT `toLocaleDateString` — its output varies with the host's
 * locale and ICU build, so the same listing would read differently on two
 * machines and no test could pin it.
 */
export function formatDateRange(startsAt, endsAt) {
    const start = parse(startsAt);
    const end = parse(endsAt);

    if (!start && !end) return null;
    if (!start) return `Until ${day(end)}`;
    if (!end) return `From ${day(start)}`;

    // Same day: one date, not a range of a date with itself.
    if (sameDay(start, end)) return day(start);

    if (start.getFullYear() === end.getFullYear()) {
        if (start.getMonth() === end.getMonth()) {
            return `${start.getDate()}–${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
        }

        return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${day(end)}`;
    }

    return `${day(start)} – ${day(end)}`;
}

/**
 * The one line a card shows: the range, the place, or both. Null when there
 * is nothing to say — a caller must not render an empty chip, and a listing
 * with no schedule is a legitimate state (a grant that is open all season).
 */
export function formatSchedule(startsAt, endsAt, location = null) {
    const range = formatDateRange(startsAt, endsAt);
    const place = typeof location === 'string' && location.trim() !== '' ? location.trim() : null;

    if (range && place) return `${range} · ${place}`;

    return range || place || null;
}

/** True when the listing has finished — used to sort a past run to the back. */
export function hasEnded(endsAt, now = new Date()) {
    const end = parse(endsAt);

    return end ? end.getTime() < now.getTime() : false;
}

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function day(d) {
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
