import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useActiveNav } from '@/Layouts/DashboardV2';
import { formatDateTime, formatMoney } from '@/lib/utils';

/**
 * Naoa's side panel, beside the content on every v2 dashboard page (wide
 * screens): what changed and where to go next, without leaving the page.
 *
 *  - "Next step" (fans): the one thing to do next, from the same NextStep
 *    the fan dashboard leads with (shared as `nextStep`).
 *  - "In {section}": the other pages in the current sidebar group — the
 *    Naoa panel's section list, taken from the menu so it cannot drift.
 *  - "Recent activity": the latest notifications, the same rows as the bell
 *    (`auth.notifications`), each opening where it points.
 *
 * It folds to a slim rail (remembered per browser) for pages that need the
 * width, and is not drawn below 1280px, where the content needs it more.
 */
export default function SidePanel() {
    const { item } = useActiveNav();
    const { auth, nextStep } = usePage().props;
    const notifications = auth?.notifications || [];
    const unread = auth?.unreadNotificationsCount || 0;
    // Open by default from 1440px (UX plan, Nov 2026); folded below that,
    // where a wide table needs the width more. A person's choice is kept.
    const [collapsed, setCollapsed] = useState(() => {
        let saved = null;
        try { saved = localStorage.getItem('tfe-dv2-panel'); } catch { /* private mode */ }
        if (saved) return saved === 'collapsed';
        return typeof window !== 'undefined' && window.innerWidth < 1440;
    });

    const toggle = (next) => {
        setCollapsed(next);
        try { localStorage.setItem('tfe-dv2-panel', next ? 'collapsed' : 'open'); } catch { /* private mode */ }
    };

    const siblings = item?.group?.heading && item.group.items.length > 1 ? item.group.items : [];

    if (collapsed) {
        return (
            <aside className="tfe-dv2-panel is-rail" aria-label="Activity">
                <button type="button" className="tfe-dv2-panel__btn" onClick={() => toggle(false)} aria-label="Show activity" title="Show activity">
                    <i className="fas fa-angles-left" aria-hidden="true"></i>
                </button>
                <button type="button" className="tfe-dv2-panel__btn" onClick={() => toggle(false)} aria-label={`${unread} unread`} title="Recent activity">
                    <i className="fas fa-bell" aria-hidden="true"></i>
                    {unread > 0 && <span className="tfe-dv2-panel__count">{unread > 99 ? '99+' : unread}</span>}
                </button>
            </aside>
        );
    }

    return (
        <aside className="tfe-dv2-panel" aria-label="Activity">
            <div className="tfe-dv2-panel__head">
                <span className="tfe-dv2-panel__icon" aria-hidden="true"><i className="fas fa-bell"></i></span>
                <div className="tfe-dv2-panel__heading">
                    <p className="tfe-dv2-panel__title">Activity</p>
                    <p className="tfe-dv2-panel__sub">{unread > 0 ? `${unread} unread` : 'You are up to date'}</p>
                </div>
                <button type="button" className="tfe-dv2-panel__btn" onClick={() => toggle(true)} aria-label="Hide activity" title="Hide activity">
                    <i className="fas fa-angles-right" aria-hidden="true"></i>
                </button>
            </div>

            <div className="tfe-dv2-panel__body">
                {nextStep && (
                    <section>
                        <p className="tfe-dv2-panel__label">Next step</p>
                        <div className="tfe-dv2-panel__next">
                            <p className="tfe-dv2-panel__next-title">{nextStep.title}</p>
                            {nextStep.amount > 0 && (
                                <p className="tfe-dv2-panel__next-amount">{formatMoney(nextStep.amount, nextStep.currency || 'USD')}</p>
                            )}
                            <Link href={nextStep.href} className="tfe-btn tfe-btn--sm tfe-btn--filled">{nextStep.cta}</Link>
                        </div>
                    </section>
                )}

                {siblings.length > 0 && (
                    <section>
                        <p className="tfe-dv2-panel__label">In {item.group.heading}</p>
                        <ul className="tfe-dv2-panel__list">
                            {siblings.map((it) => (
                                <li key={it.route}>
                                    <Link href={route(it.route)} className="tfe-dv2-panel__row" aria-current={it.route === item.route ? 'true' : undefined}>
                                        <span className="tfe-dv2-panel__rowicon" aria-hidden="true"><i className={it.icon}></i></span>
                                        <span className="tfe-dv2-panel__rowtext"><span>{it.label}</span></span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section>
                    <p className="tfe-dv2-panel__label">Recent activity</p>
                    {notifications.length === 0 ? (
                        <p className="tfe-dv2-panel__empty">Nothing new. Quotes, payments and replies show up here.</p>
                    ) : (
                        <ul className="tfe-dv2-panel__list">
                            {notifications.map((n) => {
                                const data = n.data || n;
                                const body = (
                                    <>
                                        <span className="tfe-dv2-panel__rowicon" aria-hidden="true"><i className={data.icon || 'fas fa-info-circle'}></i></span>
                                        <span className="tfe-dv2-panel__rowtext">
                                            <span>{data.title || 'Notification'}</span>
                                            {(data.body || data.message) && <small>{data.body || data.message}</small>}
                                            {n.created_at && <small className="tfe-dv2-panel__time">{formatDateTime(n.created_at)}</small>}
                                        </span>
                                        {!n.read_at && <span className="tfe-dv2-panel__dot" aria-label="Unread" />}
                                    </>
                                );
                                return (
                                    <li key={n.id}>
                                        {data.action_url && n.id
                                            ? <Link href={route('notifications.open', n.id)} className="tfe-dv2-panel__row">{body}</Link>
                                            : <div className="tfe-dv2-panel__row">{body}</div>}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </aside>
    );
}
