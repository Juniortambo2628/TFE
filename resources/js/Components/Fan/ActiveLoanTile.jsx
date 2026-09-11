import React from 'react';
import { Link } from '@inertiajs/react';
import { formatMoney } from '@/lib/utils';

/**
 * ActiveLoanTile — Sprint 16.
 *
 * A compact status card shown on the Fan Dashboard when the fan has
 * an in-flight loan (PENDING / APPROVED / DISBURSED). Reads
 * --partner-accent from the partner's theme_accent so the card
 * re-brands per underwriter. Rendering is gated in the parent — this
 * component assumes `loan` is present.
 */
const STAGES = ['PENDING', 'APPROVED', 'DISBURSED'];

const STATUS_COPY = {
    PENDING: 'Underwriting in progress',
    APPROVED: 'Approved — awaiting disbursement',
    DISBURSED: 'Funds released to your account',
};

export default function ActiveLoanTile({ loan }) {
    const accent = loan.partner?.theme_accent || '#0072CE';
    const activeIdx = STAGES.indexOf(loan.status);

    return (
        <div className="active-loan-tile" style={{ '--partner-accent': accent }}>
            <div className="active-loan-tile__head">
                <div className="active-loan-tile__lead">
                    <div className="active-loan-tile__eyebrow">
                        <i className="fas fa-hand-holding-usd"></i>
                        Trip financing · {loan.reference_id}
                    </div>
                    <h3 className="active-loan-tile__amount">{formatMoney(loan.amount)}</h3>
                    <div className="active-loan-tile__caption">{STATUS_COPY[loan.status] || loan.status}</div>
                </div>

                {loan.partner && (
                    <Link href={route('partners.hub', loan.partner.slug)} className="active-loan-tile__partner">
                        {loan.partner.logo_url ? (
                            <img src={loan.partner.logo_url} alt={loan.partner.display_name} />
                        ) : (
                            <span className="active-loan-tile__partner-fallback">
                                {loan.partner.display_name.charAt(0)}
                            </span>
                        )}
                        <div>
                            <div className="active-loan-tile__partner-label">Underwritten by</div>
                            <div className="active-loan-tile__partner-name">
                                {loan.partner.display_name}
                                {loan.partner.verified && (
                                    <i className="fas fa-check-circle active-loan-tile__verified"></i>
                                )}
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            <div className="active-loan-tile__timeline">
                {STAGES.map((stage, i) => (
                    <div
                        key={stage}
                        className={`active-loan-tile__step${i <= activeIdx ? ' is-done' : ''}${i === activeIdx ? ' is-current' : ''}`}
                    >
                        <span className="active-loan-tile__dot"></span>
                        <span className="active-loan-tile__step-label">{stage}</span>
                    </div>
                ))}
            </div>

            <div className="active-loan-tile__foot">
                <div className="active-loan-tile__facts">
                    {loan.interest_rate != null && (
                        <span><i className="fas fa-percent"></i> {Number(loan.interest_rate).toFixed(2)}% interest</span>
                    )}
                    {loan.purpose && (
                        <span><i className="fas fa-flag"></i> {loan.purpose}</span>
                    )}
                </div>
                <Link href={route('fan.loan-applications')} className="active-loan-tile__cta">
                    View financing <i className="fas fa-arrow-right"></i>
                </Link>
            </div>
        </div>
    );
}
