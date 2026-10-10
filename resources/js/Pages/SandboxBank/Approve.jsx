import React from 'react';
import { Head, router } from '@inertiajs/react';
import { formatMoney } from '@/lib/utils';
import '../../../css/sandbox-bank.css';

/**
 * Stand-in for the M-Pesa / bank prompt on the fan's phone (Sprint 67). With
 * a real bank this is an STK push the fan approves with their PIN — the
 * money goes from their wallet to the bank, never through TFE.
 */
export default function Approve({ bank, amount, currency, action, cancel }) {
    const [busy, setBusy] = React.useState(false);

    return (
        <div className="sbx">
            <Head title={`${bank} — approve deposit`} />
            <div className="sbx__card">
                <div className="sbx__bank">{bank}</div>
                <span className="sbx__tag">Simulated phone prompt</span>
                <h1>Deposit to your trip savings?</h1>
                <div className="sbx__amount">{formatMoney(amount, currency)}</div>
                <p>A real bank would send this to your phone to approve with your M-Pesa or banking PIN.</p>
                <button
                    type="button"
                    className="sbx__btn"
                    disabled={busy}
                    onClick={() => { setBusy(true); router.post(action, {}, { onFinish: () => setBusy(false) }); }}
                >
                    Approve
                </button>
                <a href={cancel} className="sbx__btn sbx__btn--ghost" style={{ textAlign: 'center', textDecoration: 'none' }}>Cancel</a>
            </div>
        </div>
    );
}

Approve.layout = null;
