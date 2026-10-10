/**
 * One booking's whole trip as a run of steps (Sprint 66), so "where is my
 * trip?" is answered on one page instead of across Journey, Itineraries,
 * Tickets and the booking.
 *
 * Every state is read from a real field. Flights and stay have no
 * confirmation record of their own yet, so that step only ever reads
 * "with the partner" — it never claims a confirmation nobody gave.
 * JSX-free so `node --test` can load it.
 */
export function bookingTimeline({
    status = 'pending_payment',
    total = 0,
    paid = 0,
    matchCount = 0,
    ticketsBought = 0,
    firstMatchAt = null,
    now = new Date(),
} = {}) {
    const fullyPaid = Number(paid) + 0.001 >= Number(total) && Number(total) > 0;
    const cancelled = status === 'cancelled';
    const travelled = firstMatchAt ? new Date(firstMatchAt) <= now : false;

    const steps = [
        { key: 'booked', title: 'Booked', state: 'done' },
        {
            key: 'paid',
            title: fullyPaid ? 'Paid' : Number(paid) > 0 ? 'Part paid' : 'Payment due',
            state: fullyPaid ? 'done' : cancelled ? 'todo' : 'current',
        },
        {
            key: 'arrangements',
            title: 'Flights & stay',
            detail: fullyPaid ? 'Your partner is arranging these' : 'Arranged once you have paid',
            state: fullyPaid && !travelled ? 'current' : travelled ? 'done' : 'todo',
        },
        {
            key: 'tickets',
            title: matchCount ? `Tickets ${Math.min(ticketsBought, matchCount)}/${matchCount}` : 'Match tickets',
            state: matchCount && ticketsBought >= matchCount ? 'done' : 'todo',
        },
        { key: 'travel', title: 'Matchday', state: travelled ? 'done' : 'todo' },
    ];

    return cancelled ? steps.map((s) => (s.key === 'booked' ? s : { ...s, state: 'todo' })) : steps;
}
