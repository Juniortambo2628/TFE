import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { TOOLBAR_ID, useToolbarSlots } from '@/Layouts/DashboardV2';
import { matchesQuery, shownLabel } from '@/lib/pageFind';
import useIsPhone from '@/hooks/useIsPhone';

/**
 * Naoa's floating toolbar, on every page of the v2 dashboard: one bar at the
 * bottom of the screen for search, views and the page's actions, so a page
 * never has to find room for them itself.
 *
 *  - Search: the page's own (a component registered the `search` slot), or
 *    "find on this page" — it filters the page's rows and cards as you type,
 *    and only appears when the page has any. Cleared on every navigation.
 *  - Views: list/grid, from whichever ListingGrid registered the `views`
 *    slot (its own toggle hides).
 *  - Actions: what the page put in its heading (DashboardHero portals them
 *    into this bar's #TOOLBAR_ID slot).
 *  - Search everything: the command menu (⌘K), which used to float on its
 *    own in the corner.
 *  - Collapse: the bar folds to a single button, remembered per browser.
 *
 * On a phone it is a small pill of icons at the right, above the tab bar:
 * the page's actions stay in its heading (DashboardHero), search is an icon
 * that opens the field across the bar, and there is nothing to collapse.
 * "Go to any page" is the tab bar's Menu there, so a page with no search
 * and no views shows no toolbar at all.
 */

// What "find on this page" filters: table rows and the platform's cards.
const ITEMS = [
    '.tfe-dv2__page table tbody tr',
    '.tfe-dv2__page .tfe-listing-grid__cards > *',
    '.tfe-dv2__page .tfe-acard',
    '.tfe-dv2__page .ticket-card',
].join(',');

const HIDDEN = 'tfe-dv2-findhidden';

function findItems() {
    const all = Array.from(document.querySelectorAll(ITEMS));
    // A card inside a grid cell is the same item twice; keep the outer one.
    return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
}

export default function PageToolbar() {
    const { url } = usePage();
    const slots = useToolbarSlots();
    const [query, setQuery] = useState('');
    const [counts, setCounts] = useState({ shown: 0, total: 0 });
    const [collapsed, setCollapsed] = useState(() => {
        try { return localStorage.getItem('tfe-dv2-toolbar') === 'collapsed'; } catch { return false; }
    });
    const phone = useIsPhone();
    const [searchOpen, setSearchOpen] = useState(false);
    const inputRef = useRef(null);
    const queryRef = useRef('');
    queryRef.current = query;

    const ownSearch = slots.search;

    // A new page starts unfiltered.
    useEffect(() => { setQuery(''); setSearchOpen(false); }, [url]);
    useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

    // Find-on-page: re-applied as the page's content changes (deferred props,
    // a filter chip, a grid/table switch), not just as you type.
    useEffect(() => {
        if (ownSearch) return undefined;
        const root = document.querySelector('.tfe-dv2__page');
        if (!root) return undefined;
        let frame = 0;
        const apply = () => {
            frame = 0;
            const items = findItems();
            let shown = 0;
            for (const el of items) {
                const hit = matchesQuery(el.textContent, queryRef.current);
                el.classList.toggle(HIDDEN, !hit);
                if (hit) shown += 1;
            }
            setCounts((c) => (c.shown === shown && c.total === items.length ? c : { shown, total: items.length }));
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(apply); };
        apply();
        const observer = new MutationObserver((records) => {
            // Our own class changes are not content changes.
            if (records.every((r) => r.type === 'attributes')) return;
            schedule();
        });
        observer.observe(root, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            if (frame) cancelAnimationFrame(frame);
            document.querySelectorAll(`.${HIDDEN}`).forEach((el) => el.classList.remove(HIDDEN));
        };
    }, [ownSearch, url, query]);

    const toggle = (next) => {
        setCollapsed(next);
        try { localStorage.setItem('tfe-dv2-toolbar', next ? 'collapsed' : 'open'); } catch { /* private mode */ }
    };

    const searchEverything = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    };

    const search = ownSearch || (counts.total > 0 ? {
        value: query,
        onChange: setQuery,
        placeholder: 'Find on this page',
        note: query ? shownLabel(counts.shown, counts.total) : null,
    } : null);

    const isCollapsed = collapsed && !phone;
    // On a phone the field only shows once asked for (or while it filters).
    const showField = search && (!phone || searchOpen || Boolean(search.value));
    const closeSearch = () => { search?.onChange(''); setSearchOpen(false); };

    // On a phone "go to any page" is the tab bar's Menu, so a bar with no
    // search and no views would be a lone button over the page: none at all.
    if (phone && !search && !slots.views) {
        return <div id={TOOLBAR_ID} hidden />;
    }

    return (
        <div className={'tfe-dv2-toolbar' + (isCollapsed ? ' is-collapsed' : '') + (phone && showField ? ' is-searching' : '')}>
            <div className="tfe-dv2-toolbar__bar" role="toolbar" aria-label="Page tools">
                {!isCollapsed && showField && (
                    <label className="tfe-dv2-toolbar__search">
                        <i className="fas fa-search" aria-hidden="true"></i>
                        <span className="tfe-dv2-sr-only">{search.placeholder}</span>
                        <input
                            ref={inputRef}
                            type="search"
                            value={search.value}
                            placeholder={search.placeholder}
                            onChange={(e) => search.onChange(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') closeSearch(); }}
                        />
                        {search.note && <span className="tfe-dv2-toolbar__note" aria-live="polite">{search.note}</span>}
                    </label>
                )}

                {phone && search && (
                    showField ? (
                        <button type="button" className="tfe-dv2-toolbar__icon" onClick={closeSearch} aria-label="Close search" title="Close search">
                            <i className="fas fa-times" aria-hidden="true"></i>
                        </button>
                    ) : (
                        <button type="button" className="tfe-dv2-toolbar__icon" onClick={() => setSearchOpen(true)} aria-label={search.placeholder} title={search.placeholder}>
                            <i className="fas fa-search" aria-hidden="true"></i>
                        </button>
                    )
                )}

                {!isCollapsed && !(phone && showField) && slots.views && (
                    <div className="tfe-dv2-toolbar__views" role="group" aria-label="View">
                        {slots.views.options.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                className="tfe-dv2-toolbar__icon"
                                aria-pressed={slots.views.value === o.value}
                                aria-label={o.label}
                                title={o.label}
                                onClick={() => slots.views.onChange(o.value)}
                            >
                                <i className={o.icon} aria-hidden="true"></i>
                            </button>
                        ))}
                    </div>
                )}

                {/* The page's heading actions land here (DashboardHero); on a
                    phone they stay in the heading. */}
                <div id={TOOLBAR_ID} className="tfe-dv2-toolbar__actions" hidden={isCollapsed || phone} />

                {!isCollapsed && !phone && (
                    <button type="button" className="tfe-dv2-toolbar__icon" onClick={searchEverything} title="Go to any page (Ctrl K)" aria-label="Go to any page">
                        <i className="fas fa-compass" aria-hidden="true"></i>
                    </button>
                )}

                {!phone && (
                    <button
                        type="button"
                        className="tfe-dv2-toolbar__icon"
                        onClick={() => toggle(!collapsed)}
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? 'Show page tools' : 'Hide page tools'}
                        title={collapsed ? 'Show page tools' : 'Hide page tools'}
                    >
                        <i className={collapsed ? 'fas fa-sliders' : 'fas fa-chevron-down'} aria-hidden="true"></i>
                    </button>
                )}
            </div>
        </div>
    );
}
