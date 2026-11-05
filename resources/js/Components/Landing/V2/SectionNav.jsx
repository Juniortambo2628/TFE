import React, { useEffect, useRef, useState } from 'react';
import { activeSectionId } from '@/lib/landingV2';
import { scrollToSection } from '@/Components/Landing/V2/LandingAction';

/**
 * The sticky "On this page" bar (plan C2.3): one chip per section, the
 * current one marked as you scroll. Sections that are not on the page (Trips
 * when the tournament has no packages) are left out rather than linking to
 * nothing. Below md the chips scroll sideways and the current one is kept in
 * view.
 */
export default function SectionNav({ sections = [], label = 'On this page' }) {
    const [present, setPresent] = useState([]);
    const [active, setActive] = useState(null);
    const barRef = useRef(null);

    useEffect(() => {
        let frame = 0;
        const measure = () => {
            frame = 0;
            const header = document.querySelector('.tfe-header')?.getBoundingClientRect().bottom || 0;
            const bar = barRef.current?.getBoundingClientRect().height || 0;
            const tops = sections.map((s) => {
                const el = document.getElementById(s.id);
                // A wrapper whose section rendered nothing has no height.
                const there = el && el.offsetHeight > 0;
                return { id: s.id, top: there ? el.getBoundingClientRect().top + window.scrollY : undefined };
            });
            const ids = tops.filter((t) => t.top !== undefined).map((t) => t.id);
            // Measured every scroll frame; only re-render when the set changes.
            setPresent((prev) => (prev.join() === ids.join() ? prev : ids));
            setActive(activeSectionId(tops, window.scrollY, header + bar + 24));
        };
        const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(measure); };
        measure();
        // Deferred sections (trips, community) mount after first paint.
        const late = window.setTimeout(measure, 1200);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            window.clearTimeout(late);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [sections]);

    // Keep the current chip visible in the sideways-scrolling row on phones.
    // Only the row scrolls: scrollIntoView on the chip can also nudge the page
    // and interrupt the visitor's own scroll.
    useEffect(() => {
        const list = barRef.current?.querySelector('.v2-sectionnav__list');
        const chip = active && list?.querySelector(`[data-section="${active}"]`);
        if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
        list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    }, [active]);

    const shown = sections.filter((s) => present.includes(s.id));
    if (shown.length === 0) return null;

    return (
        <nav className="v2-sectionnav" aria-label={label} ref={barRef}>
            <div className="container v2-sectionnav__inner">
                <span className="v2-sectionnav__label">{label}</span>
                <ul className="v2-sectionnav__list">
                    {shown.map((s) => (
                        <li key={s.id}>
                            <a
                                href={`#${s.id}`}
                                data-section={s.id}
                                className="v2-sectionnav__chip"
                                aria-current={active === s.id ? 'location' : undefined}
                                onClick={(e) => { if (scrollToSection(s.id)) e.preventDefault(); }}
                            >
                                {s.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
