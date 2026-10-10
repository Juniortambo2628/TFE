import React from 'react';
import '../../../css/trust-signals.css';

/**
 * The reasons to trust a price, said beside it (Sprint 66).
 *
 * Every line is a fact the platform can stand behind — a verified partner,
 * the 48-hour hold every booking gets, a payment provider that is actually
 * switched on. No invented review counts or "X people viewing": a claim we
 * cannot back is worse than no claim.
 */
export default function TrustSignals({ verified = false, partnerName = null, onlinePayment = false, held = true, className = '' }) {
    const items = [
        verified && { icon: 'fas fa-check-circle', text: partnerName ? `${partnerName} is a TFE-verified partner` : 'TFE-verified partner' },
        held && { icon: 'fas fa-hourglass-half', text: 'Your place is held for 48 hours after you book — pay when ready' },
        onlinePayment && { icon: 'fas fa-shield-alt', text: 'Pay securely by M-Pesa or card through Paystack' },
    ].filter(Boolean);

    if (!items.length) return null;

    return (
        <ul className={`tfe-trust ${className}`.trim()}>
            {items.map((item) => (
                <li key={item.text}>
                    <i className={item.icon} aria-hidden="true"></i>
                    <span>{item.text}</span>
                </li>
            ))}
        </ul>
    );
}
