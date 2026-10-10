/**
 * Progress toward a savings goal from the bank's live balances (Sprint 67).
 * JSX-free so `node --test` can load it.
 *
 * Only the balance held in the GOAL's currency counts. Converting the others
 * would need a rate, and the rate is the bank's to quote — showing our own
 * guess as progress would be a number the bank might not honour.
 */
export function savingsProgress({ balances = {}, goal = null, now = new Date() } = {}) {
    if (!goal || !(Number(goal.target_amount) > 0)) return null;

    const currency = goal.currency || 'USD';
    const saved = Math.max(0, Number(balances[currency]) || 0);
    const target = Number(goal.target_amount);
    const pct = Math.min(100, Math.round((saved / target) * 100));

    let perMonth = null;
    if (goal.target_date && saved < target) {
        const end = new Date(goal.target_date);
        const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
        if (months >= 1) perMonth = Math.ceil((target - saved) / months);
    }

    return { currency, saved, target, pct, perMonth };
}
