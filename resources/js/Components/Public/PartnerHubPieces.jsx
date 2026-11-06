import React from 'react';
import { assetPath } from '@/lib/assets';
import { Head, Link, usePage } from '@inertiajs/react';
import CapacityBar from '@/Components/Common/CapacityBar';
import GlassPill from '@/Components/Common/GlassPill';
import AccentCard from '@/Components/Common/AccentCard';
import { formatSchedule } from '@/lib/schedule';
import '../../../css/partner-hub.css';
import '../../../css/tickets.css';
import '../../../css/virtual-card.css';
import { formatNumber, formatKickoff, formatMoney } from '@/lib/utils';

// Strip the trailing "_partner" before title-casing so "Official {type}
// Partner" doesn't read "Official Finance Partner Partner".
export function PartnerHubTicket({ ticket, accent }) {
    const KICK = formatKickoff(ticket.kickoff_at);
    return (
        <article className="ticket-card" style={{ '--partner-accent': accent }}>
            <div
                className="ticket-card__cover"
                style={ticket.hero_image ? { backgroundImage: `url(${assetPath(ticket.hero_image)})` } : undefined}
            >
                <span className="tfe-pill tfe-pill--info ticket-card__stage">{ticket.stage}</span>
            </div>
            <div className="ticket-card__body">
                <div className="ticket-card__matchup">
                    <div className="ticket-card__team">
                        {ticket.home_team_code && <img src={`/assets/Flags/${String(ticket.home_team_code).toLowerCase()}.png`} alt={ticket.home_team} onError={(e) => { e.target.style.display = 'none'; }} />}
                        <span>{ticket.home_team}</span>
                    </div>
                    <span className="ticket-card__vs">vs</span>
                    <div className="ticket-card__team">
                        {ticket.away_team_code && <img src={`/assets/Flags/${String(ticket.away_team_code).toLowerCase()}.png`} alt={ticket.away_team} onError={(e) => { e.target.style.display = 'none'; }} />}
                        <span>{ticket.away_team}</span>
                    </div>
                </div>
                <div className="ticket-card__meta">
                    <div><i className="fas fa-clock"></i> {KICK}</div>
                    <div><i className="fas fa-map-marker-alt"></i> {ticket.venue_name}</div>
                </div>
                <div className="ticket-card__stock">
                    <div className="ticket-card__bar"><span style={{ width: `${ticket.sold_pct}%` }} /></div>
                    <div className="ticket-card__stock-meta">
                        <strong>{formatNumber(ticket.remaining)}</strong> seats left
                        <span>{ticket.sold_pct}% sold</span>
                    </div>
                </div>
                <div className="ticket-card__foot">
                    <div className="ticket-card__price">
                        <span className="ticket-card__price-label">from</span>
                        <strong>{formatMoney(ticket.price, ticket.currency || 'USD')}</strong>
                    </div>
                    <Link href={route('fan.tickets.index')} className="tfe-btn tfe-btn--filled">
                        <i className="fas fa-ticket-alt"></i> Buy
                    </Link>
                </div>
            </div>
        </article>
    );
}

/**
 * The facts under a listing card: when and where it runs, then what it
 * costs. `formatSchedule` returns null when there is nothing to say, and a
 * listing with no schedule is a legitimate state — so the fact is dropped
 * rather than rendered as an empty row.
 */
export function scheduleFacts(listing) {
    const when = formatSchedule(listing.starts_at, listing.ends_at, listing.location);

    return [
        ...(when ? [{ label: 'When', value: when }] : []),
        priceFact(listing),
    ];
}

/**
 * The price fact on a listing card.
 *
 * A zero is a real, meaningful price for the schools archetype — a league
 * or a grant is free to enter, and most of that partner's catalogue is.
 * Rendering it as "From USD 0" reads like a missing value rather than the
 * claim it actually is.
 */
function priceFact(listing) {
    const price = Number(listing.base_price);

    if (!Number.isFinite(price) || price <= 0) {
        return { label: 'Entry', value: 'Free' };
    }

    return { label: 'From', value: formatMoney(price, listing.currency || 'USD') };
}

/**
 * Trim a trailing "Partner" off the server's label so the eyebrow
 * `Official {x} Partner` does not read "Official Finance Partner Partner".
 *
 * The label itself comes from PartnerController::partnerTypes() — this used
 * to title-case the raw key instead, which rendered `school_community` as
 * "School Community" while the directory showed "Schools & Communities".
 */
export function partnerEyebrow(label) {
    if (!label) return '';

    return label.replace(/\s+Partner$/i, '').trim();
}
