/**
 * One meaning per count (UX plan, Nov 2026). JSX-free for `node --test`.
 *
 * The envelope in the header and the sidebar's Messages row both lead to the
 * Messages page, but the envelope counted unread direct messages while the
 * row counted new announcements, so "1" beside each could mean two different
 * things. Both now show what is waiting on that page: messages + announcements.
 */

/** Each role's Messages page. */
export const MESSAGES_ROUTE = {
    fan: 'fan.communication',
    admin: 'admin.messages',
    partner: 'partner.messages',
};

const MESSAGE_ROUTES = new Set(Object.values(MESSAGES_ROUTE));

/** The sidebar/tab counts, with unread messages added to the Messages page. */
export function sectionCounts(activityBadges = {}, unreadMessages = 0) {
    const out = { ...activityBadges };
    if (unreadMessages > 0) {
        for (const r of MESSAGE_ROUTES) out[r] = (out[r] || 0) + unreadMessages;
    }
    return out;
}

/** What the envelope shows: everything waiting on this role's Messages page. */
export function messagesCount(activityBadges = {}, unreadMessages = 0, role = 'fan') {
    const r = MESSAGES_ROUTE[role] || MESSAGES_ROUTE.fan;
    return sectionCounts(activityBadges, unreadMessages)[r] || 0;
}
