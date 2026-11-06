import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import ContentCard from '@/Components/Common/ContentCard';
import { currentSubscription, pushSupport, turnOff, turnOn } from '@/lib/webPush';

/**
 * "Alerts on this device" (web push, Nov 2026). Per DEVICE, not per account:
 * a fan can want alerts on their phone and not on a shared laptop. Renders
 * nothing when push is not configured on the server.
 */
export default function PushAlertsCard({ className = 'mt-4' }) {
    const { webPushKey } = usePage().props;
    const [support, setSupport] = useState('unsupported');
    const [on, setOn] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!webPushKey) return;
        const s = pushSupport(window);
        setSupport(s);
        if (s === 'available') currentSubscription().then((sub) => setOn(Boolean(sub))).catch(() => {});
    }, [webPushKey]);

    if (!webPushKey) return null;

    const toggle = async () => {
        setBusy(true);
        setError('');
        try {
            if (on) {
                await turnOff((body) => axios.delete(route('push.subscriptions.destroy'), { data: body }));
                setOn(false);
            } else {
                const ok = await turnOn(webPushKey, (body) => axios.post(route('push.subscriptions.store'), body));
                setOn(ok);
                if (!ok) setSupport(pushSupport(window));
            }
        } catch (e) {
            setError('That did not work. Try again, or check this browser allows notifications for this site.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <ContentCard
            className={className}
            title="Alerts on this device"
            subtitle="A notification when a partner quotes your trip, a payment lands or a hold is about to lapse. Only this browser or phone; turn it on wherever you want them."
        >
            {support === 'install-first' ? (
                <p className="mb-0">On iPhone, add TFE to your Home Screen first (Share, then Add to Home Screen), open it from there, and turn alerts on.</p>
            ) : support === 'blocked' ? (
                <p className="mb-0">Notifications are blocked for this site in your browser settings. Allow them there, then come back.</p>
            ) : support === 'unsupported' ? (
                <p className="mb-0">This browser cannot show alerts. The bell always has them.</p>
            ) : (
                <div className="d-flex flex-wrap align-items-center gap-3">
                    <span className="flex-grow-1">
                        <i className={`fas ${on ? 'fa-bell' : 'fa-bell-slash'} me-2`} aria-hidden="true"></i>
                        {on ? 'On for this device' : 'Off for this device'}
                    </span>
                    <button type="button" className={`tfe-btn tfe-btn--sm ${on ? '' : 'tfe-btn--filled'}`} onClick={toggle} disabled={busy}>
                        {on ? 'Turn off' : 'Turn on alerts'}
                    </button>
                </div>
            )}
            {error && <div className="tfe-form-error mt-2">{error}</div>}
        </ContentCard>
    );
}
