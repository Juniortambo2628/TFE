import { useEffect } from 'react';

/**
 * Gives the public header its scrolled state (`.fixed-header`: solid
 * background, smaller logo) once the page has scrolled 60px. rAF-throttled
 * and passive, so it writes the DOM at most once a frame.
 *
 * The same toggle Home.jsx and SectionPageShell carry inline; new public
 * pages use this instead of a third copy.
 */
export default function useFixedHeaderOnScroll(threshold = 60) {
    useEffect(() => {
        let ticking = false;
        let lastFixed = null;
        const apply = () => {
            ticking = false;
            const header = document.querySelector('.tfe-header');
            if (!header) return;
            const fixed = window.scrollY >= threshold;
            if (fixed !== lastFixed) {
                lastFixed = fixed;
                header.classList.toggle('fixed-header', fixed);
            }
        };
        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(apply);
            }
        };
        apply();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);
}
