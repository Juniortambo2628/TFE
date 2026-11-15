import React from 'react';

/**
 * The virtual card's face (Nov 2026 redesign).
 *
 * Laid out like a real payment card, at the ISO/IEC 7810 ID-1 ratio
 * (85.60 × 53.98 mm): issuer and a "Demo" mark top-left, contactless mark
 * top-right, the EMV chip under them, the number on ONE line in four groups,
 * then cardholder and "valid thru", with the network mark bottom-right.
 * Everything is sized in container units (cqw), so the card scales as one
 * piece from a phone to a desktop instead of wrapping its number.
 *
 * `last4` is the only part of the number shown; the rest is always dots.
 * A placeholder (no card yet) passes no last4 and reads as an outline.
 */
export default function VirtualCardFace({
    issuer = 'Ecobank Fan Finance',
    logoUrl = null,
    holder = 'YOUR NAME',
    expiry = 'MM/YY',
    last4 = null,
    network = 'visa',
    placeholder = false,
}) {
    const groups = ['••••', '••••', '••••', last4 || '••••'];

    return (
        <div
            className={'vcard-face' + (placeholder ? ' vcard-face--placeholder' : '')}
            role="img"
            aria-label={`${issuer} virtual ${network} card${last4 ? ` ending ${last4}` : ''}, demo`}
        >
            <span className="vcard-face__sheen" aria-hidden="true"></span>

            <div className="vcard-face__top" aria-hidden="true">
                <div className="vcard-face__issuer">
                    {logoUrl
                        ? <img src={logoUrl} alt="" className="vcard-face__logo" />
                        : <span className="vcard-face__brand">{issuer}</span>}
                    <span className="vcard-face__kind">Virtual · Debit</span>
                </div>
                <Contactless />
            </div>

            <div className="vcard-face__mid" aria-hidden="true">
                <Chip />
                <span className="vcard-face__demo">Demo</span>
            </div>

            <div className="vcard-face__pan" aria-hidden="true">
                {groups.map((g, i) => (
                    <span key={i} className={i === 3 && last4 ? 'is-last' : undefined}>{g}</span>
                ))}
            </div>

            <div className="vcard-face__bottom" aria-hidden="true">
                <div className="vcard-face__holder">
                    <span className="vcard-face__label">Cardholder</span>
                    <strong>{holder}</strong>
                </div>
                <div className="vcard-face__expiry">
                    <span className="vcard-face__label">Valid<br />thru</span>
                    <strong>{expiry}</strong>
                </div>
                <NetworkMark network={network} />
            </div>
        </div>
    );
}

/** EMV chip: gold contact plate with its contact lines. */
function Chip() {
    return (
        <svg className="vcard-face__chip" viewBox="0 0 50 38" aria-hidden="true">
            <defs>
                <linearGradient id="vcard-chip-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f5dfa0" />
                    <stop offset="0.45" stopColor="#d6b25e" />
                    <stop offset="1" stopColor="#a8832f" />
                </linearGradient>
            </defs>
            <rect x="0.5" y="0.5" width="49" height="37" rx="7" fill="url(#vcard-chip-gold)" stroke="rgba(0,0,0,0.25)" />
            <g fill="none" stroke="rgba(90,62,10,0.55)" strokeWidth="1.2">
                <path d="M0.5 13H16M0.5 25H16M34 13H49.5M34 25H49.5" />
                <path d="M16 0.5V37.5M34 0.5V37.5" />
                <rect x="16" y="11" width="18" height="16" rx="3" />
            </g>
        </svg>
    );
}

/** The contactless symbol: four widening arcs. */
function Contactless() {
    return (
        <svg className="vcard-face__nfc" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M7 9.5a4 4 0 0 1 0 5" />
                <path d="M10.5 7.5a7.5 7.5 0 0 1 0 9" />
                <path d="M14 5.5a11 11 0 0 1 0 13" />
                <path d="M17.5 3.5a14.5 14.5 0 0 1 0 17" />
            </g>
        </svg>
    );
}

function NetworkMark({ network }) {
    if (network === 'mastercard') {
        return (
            <svg className="vcard-face__network vcard-face__network--mc" viewBox="0 0 48 30" role="img" aria-label="Mastercard">
                <circle cx="17" cy="15" r="13" fill="#eb001b" />
                <circle cx="31" cy="15" r="13" fill="#f79e1b" fillOpacity="0.9" />
            </svg>
        );
    }
    return <span className="vcard-face__network vcard-face__network--visa">VISA</span>;
}
