import React from 'react';
import { Head, router } from '@inertiajs/react';
import '../../../css/sandbox-bank.css';

/**
 * Stand-in for a bank's hosted account opening (Sprint 67). A real bank would
 * verify ID and take a selfie here, on its own site — TFE never sees it.
 */
export default function Onboard({ bank, name, action }) {
    const [busy, setBusy] = React.useState(false);

    return (
        <div className="sbx">
            <Head title={`${bank} — open an account`} />
            <div className="sbx__card">
                <div className="sbx__bank">{bank}</div>
                <span className="sbx__tag">Simulated bank · prototype</span>
                <h1>Open a trip savings account</h1>
                <p>Hello{name ? ` ${name}` : ''}. A real bank would now:</p>
                <ul className="sbx__list">
                    <li>verify your ID and phone number,</li>
                    <li>show its terms and the account's interest rate,</li>
                    <li>open the account in your name.</li>
                </ul>
                <p>This prototype skips those checks and opens a sandbox account straight away.</p>
                <button
                    type="button"
                    className="sbx__btn"
                    disabled={busy}
                    onClick={() => { setBusy(true); router.post(action, {}, { onFinish: () => setBusy(false) }); }}
                >
                    Open my account
                </button>
            </div>
        </div>
    );
}

Onboard.layout = null;
