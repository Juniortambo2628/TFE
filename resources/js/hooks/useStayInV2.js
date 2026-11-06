import { useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { toV2 } from '@/lib/v2Paths';

/**
 * Keeps a visitor on the v2 pages while they browse them (UX review, Nov
 * 2026): a link to /partners from a v2 page goes to /v2/partners instead.
 *
 * One listener on the document rather than a mapped href on every link,
 * because the links come from everywhere — the shared header and footer,
 * the v1 page bodies the v2 pages reuse, partner-authored hubs — and a link
 * missed is a tester silently dropped back into the other design.
 *
 * - click (capture phase): an internal link with a twin is visited at the
 *   twin instead. Capture runs before Inertia's own <Link> handler, and
 *   stopping it there means the original visit never starts.
 * - pointerover / focusin: the href itself is rewritten, so "open in new
 *   tab", middle-click and the status bar all show the v2 address too.
 *
 * Modified clicks, target="_blank" and downloads are left to the browser.
 */
export default function useStayInV2() {
    // Since the switch every public page IS v2 at its plain address, and
    // /v2/... only redirects: nothing to rewrite.
    const off = usePage().props.design === 'v2';
    useEffect(() => {
        if (off) return undefined;
        // An <Link> visits its `href` PROP, not the DOM attribute, so a link
        // whose attribute was already rewritten on hover still has to be
        // intercepted on click: the twin is remembered on the element.
        const mapped = (a) => {
            const href = a.getAttribute('href');
            const next = toV2(href);
            if (next !== href) {
                a.dataset.v2Href = next;
                return next;
            }
            return a.dataset.v2Href && a.dataset.v2Href === href ? href : null;
        };

        const rewrite = (e) => {
            const a = e.target.closest?.('a[href]');
            const next = a && mapped(a);
            if (next && next !== a.getAttribute('href')) a.setAttribute('href', next);
        };

        const onClick = (e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = e.target.closest?.('a[href]');
            if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
            const next = mapped(a);
            if (!next) return;
            e.preventDefault();
            e.stopPropagation();
            router.visit(next);
        };

        document.addEventListener('click', onClick, true);
        document.addEventListener('pointerover', rewrite, true);
        document.addEventListener('focusin', rewrite, true);
        return () => {
            document.removeEventListener('click', onClick, true);
            document.removeEventListener('pointerover', rewrite, true);
            document.removeEventListener('focusin', rewrite, true);
        };
    }, [off]);
}
