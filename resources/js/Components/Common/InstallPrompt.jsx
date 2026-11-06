import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { installMode, recordVisit, shouldOffer } from '@/lib/installPrompt';
import '../../../css/install-prompt.css';

const VISITS_KEY = 'tfe-visit-days';
const DISMISSED_KEY = 'tfe-install-dismissed';

const read = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
};
const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
};

/**
 * "Install TFE" (installable website, Nov 2026 — docs/proposals/mobile-app.md,
 * phase 0). Mounted once by the public Header; phones only (CSS).
 *
 * On Android / Chrome it offers the browser's own one-tap install. On iPhone
 * Safari, which cannot be prompted, it shows the two taps that add TFE to
 * the home screen. Returning visitors only, never once installed, and quiet
 * for 30 days after "Not now" (lib/installPrompt).
 */
export default function InstallPrompt() {
    const [deferred, setDeferred] = useState(null);
    const [mode, setMode] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const today = new Date().toISOString().slice(0, 10);
        const days = recordVisit(read(VISITS_KEY, []), today);
        write(VISITS_KEY, days);

        const decide = (hasNativePrompt) => {
            const m = installMode({ userAgent: navigator.userAgent, standalone, hasNativePrompt });
            setMode(m);
            setOpen(shouldOffer({ mode: m, visitDays: days.length, dismissedAt: read(DISMISSED_KEY, null) }));
        };
        decide(false);

        const onPrompt = (e) => {
            e.preventDefault(); // we offer it in our own card, at our own time
            setDeferred(e);
            decide(true);
        };
        const onInstalled = () => setOpen(false);
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    if (!open || !mode || typeof document === 'undefined') return null;

    const dismiss = () => {
        write(DISMISSED_KEY, Date.now());
        setOpen(false);
    };

    const install = async () => {
        if (!deferred) return;
        deferred.prompt();
        const { outcome } = await deferred.userChoice.catch(() => ({ outcome: 'dismissed' }));
        setDeferred(null);
        if (outcome === 'accepted') setOpen(false);
        else dismiss();
    };

    return createPortal(
        <aside className="tfe-install" role="dialog" aria-label="Install TFE" aria-live="polite">
            <img className="tfe-install__icon" src="/icons/icon-192.png" alt="" width="44" height="44" />
            <div className="tfe-install__copy">
                <strong>Get the TFE app</strong>
                {mode === 'native' ? (
                    <span>Add it to your home screen: it opens full screen and works like an app.</span>
                ) : (
                    <span>
                        {/* Not "below": on newer iPhones Share sits in Safari's ••• menu. */}
                        In Safari, tap Share <i className="fas fa-arrow-up-from-bracket" aria-hidden="true"></i>, then <b>Add to Home Screen</b>.
                    </span>
                )}
            </div>
            <div className="tfe-install__actions">
                {mode === 'native' && (
                    <button type="button" className="tfe-btn tfe-btn--filled tfe-btn--sm" onClick={install}>Install</button>
                )}
                <button type="button" className="tfe-install__close" onClick={dismiss} aria-label="Not now">
                    <i className="fas fa-xmark" aria-hidden="true"></i>
                </button>
            </div>
        </aside>,
        document.body,
    );
}
