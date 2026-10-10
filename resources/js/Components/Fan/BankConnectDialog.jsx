import React from 'react';
import { useForm } from '@inertiajs/react';
import TfeModal from '@/Components/Common/TfeModal';
import ContentCard from '@/Components/Common/ContentCard';
import '../../../css/trust-signals.css';

/**
 * Consent before a fan is sent to the bank to open a trip savings account
 * (Sprint 67). It says, in plain words, who holds the money, what TFE will
 * see, and what TFE will never keep.
 */
export default function BankConnectDialog({ goal, bank, onClose }) {
    const form = useForm({ consent: false });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('fan.bank-savings.connect', goal.id));
    };

    return (
        <TfeModal
            open
            onClose={onClose}
            label="Save with a bank"
            title={goal.name}
            heading={`Open a trip savings account with ${bank.label}`}
            subheading={bank.sandbox ? 'Prototype — a simulated bank stands in until a banking partner is signed.' : null}
            footer={(
                <>
                    <button type="button" className="tfe-btn" onClick={onClose}>Not now</button>
                    <button type="submit" form="bank-connect-form" className="tfe-btn tfe-btn--filled" disabled={!form.data.consent || form.processing}>
                        Continue to {bank.label}
                    </button>
                </>
            )}
        >
            <form id="bank-connect-form" onSubmit={submit}>
                <ContentCard title="How it works">
                    <ul className="tfe-trust">
                        <li><i className="fas fa-university" aria-hidden="true"></i><span>The account is <strong>yours, at {bank.label}</strong>. The bank verifies your identity, holds the money and keeps the records.</span></li>
                        <li><i className="fas fa-mobile-alt" aria-hidden="true"></i><span>Deposits go straight from you to the bank. TFE never receives or holds your savings.</span></li>
                        <li><i className="fas fa-lock" aria-hidden="true"></i><span>You can see your balance and history here after confirming your password. TFE fetches them from the bank each time and does not store them.</span></li>
                        <li><i className="fas fa-handshake" aria-hidden="true"></i><span>When you book, the bank pays the travel partner directly — only after you authorise that payment.</span></li>
                    </ul>
                </ContentCard>
                <ContentCard title="What TFE shares with the bank">
                    <p className="tfe-form-help mb-0">Your name and email, to start the application. Nothing else.</p>
                </ContentCard>
                <label className="tfe-check mt-3">
                    <input type="checkbox" checked={form.data.consent} onChange={(e) => form.setData('consent', e.target.checked)} />
                    <span>I agree to share my name and email with {bank.label}, and to let TFE show my savings balance and history from the bank. I can disconnect at any time.</span>
                </label>
                {form.errors.consent && <div className="tfe-form-error">Tick the box to continue.</div>}
            </form>
        </TfeModal>
    );
}
