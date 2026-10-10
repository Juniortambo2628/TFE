import React from 'react';
import { Link, router } from '@inertiajs/react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';
import CapacityBar from '@/Components/Common/CapacityBar';
import TrustSignals from '@/Components/Common/TrustSignals';
import AccentCard from '@/Components/Common/AccentCard';
import { formatMoney, titleCase } from '@/lib/utils';
import { formatSchedule, hasEnded } from '@/lib/schedule';
import { assetPath } from '@/lib/assets';

/**
 * The public single-listing page (Sprint 63).
 *
 * Renders through `SectionPageShell` like the other public detail pages, so
 * it carries the site header, footer and cookie consent without a role shell.
 *
 * Deliberately light: no fixture list, no 3D seat map, no itinerary map. A
 * stranger who followed a link is deciding whether to care, and every one of
 * those costs a query or a 578KB chunk to answer a question they have not
 * asked yet. `fan.packages.show` still does all of it for a signed-in fan.
 */
export default function ListingShow({ listing, tournament, more = [], onlinePayment = false }) {
    const schedule = formatSchedule(listing.starts_at, listing.ends_at, listing.location);
    const ended = hasEnded(listing.ends_at);
    const isFree = Number(listing.base_price) === 0;
    const isTrip = listing.type === 'package' || listing.type === 'tour';

    return (
        <SectionPageShell
            title={listing.name}
            hero={{
                eyebrow: [titleCase(listing.type), tournament?.short_name].filter(Boolean).join(' · '),
                title: listing.name,
                tagline: listing.publisher
                    ? `Published by ${listing.publisher.display_name}`
                    : 'Published by The Football Experience',
                background: listing.hero_image ? assetPath(listing.hero_image) : null,
            }}
        >
            <section className="listing-page">
                <div className="container">
                    <div className="tfe-card-grid tfe-card-grid--2 listing-page__top">
                        <div>
                            <div className="listing-page__chips">
                                <span className="tfe-pill tfe-pill--info">{titleCase(listing.type)}</span>
                                {tournament && (
                                    <Link
                                        href={route('tournaments.show', tournament.slug)}
                                        className="tfe-pill tfe-pill--upcoming"
                                    >
                                        {tournament.short_name || tournament.name}
                                    </Link>
                                )}
                                {listing.is_featured && <span className="tfe-pill tfe-pill--approved">Featured</span>}
                                {/* Both are claims about availability, and both
                                    are only made when they are true. */}
                                {listing.is_sold_out && <span className="tfe-pill tfe-pill--rejected">Sold out</span>}
                                {ended && <span className="tfe-pill tfe-pill--concluded">Finished</span>}
                            </div>

                            {/* Partner-authored prose, rendered as TEXT. Same
                                stored-XSS reasoning that keeps SVG out of every
                                uploader (Sprint 60). */}
                            {listing.description && (
                                <p className="listing-page__body">{listing.description}</p>
                            )}

                            {isTrip && (listing.nights || listing.flight_class || listing.accommodation_level) && (
                                <div className="listing-page__facts">
                                    {listing.nights && <Fact label="Nights" value={listing.nights} />}
                                    {listing.flight_class && <Fact label="Flights" value={titleCase(listing.flight_class)} />}
                                    {listing.accommodation_level && (
                                        <Fact label="Stay" value={titleCase(listing.accommodation_level.replace(/_/g, ' '))} />
                                    )}
                                </div>
                            )}
                        </div>

                        <aside className="listing-page__aside">
                            <div className="listing-page__price">
                                {/* A zero price means Free, not "USD 0" — most
                                    of the schools catalogue is free to enter and
                                    that is a claim worth making (Sprint 59). */}
                                {isFree ? 'Free' : formatMoney(listing.base_price, listing.currency || 'USD')}
                                {!isFree && <span className="listing-page__price-sub">per person</span>}
                            </div>

                            {schedule && (
                                <div className="listing-page__row">
                                    <i className="fas fa-calendar-alt" aria-hidden="true"></i>
                                    <span>{schedule}</span>
                                </div>
                            )}

                            {listing.capacity > 0 && (
                                <div className="listing-page__row listing-page__row--block">
                                    <CapacityBar
                                        sold={listing.sold_count}
                                        capacity={listing.capacity}
                                        pct={listing.availability_pct}
                                        seatsLeftLabel
                                    />
                                </div>
                            )}

                            <div className="listing-page__cta">
                                {listing.is_sold_out || ended ? (
                                    <Link
                                        href={listing.publisher
                                            ? route('partners.hub', listing.publisher.slug)
                                            : route('partners.index')}
                                        className="tfe-btn tfe-btn--filled tfe-btn--lg"
                                    >
                                        See what else is on
                                    </Link>
                                ) : isTrip ? (
                                    <BookNow listing={listing} onlinePayment={onlinePayment} />
                                ) : (
                                    <Link
                                        href={route('fan.budget-calculator', { package: listing.id })}
                                        className="tfe-btn tfe-btn--filled tfe-btn--lg"
                                    >
                                        Get started
                                    </Link>
                                )}
                                {/* Said plainly rather than discovered at the
                                    login wall — the whole reason this page
                                    exists is that the wall came first. */}
                                <p className="listing-page__cta-note">
                                    You'll be asked to sign in or create an account to continue.
                                </p>
                            </div>

                            {listing.publisher && (
                                <div className="listing-page__publisher">
                                    <PoweredByBadge publisher={listing.publisher} variant="chip" />
                                    <Link
                                        href={route('partners.hub', listing.publisher.slug)}
                                        className="tfe-btn tfe-btn--sm"
                                    >
                                        View partner
                                    </Link>
                                </div>
                            )}
                        </aside>
                    </div>

                    {more.length > 0 && (
                        <div className="listing-page__more">
                            <h2 className="listing-page__more-title">
                                More from {listing.publisher?.display_name || 'this partner'}
                            </h2>
                            <div className="tfe-card-grid tfe-card-grid--3">
                                {more.map((m) => (
                                    <AccentCard
                                        key={m.id}
                                        LinkComponent={Link}
                                        href={route('listings.show', m.id)}
                                        eyebrow={titleCase(m.type)}
                                        title={m.name}
                                        desc={m.description || undefined}
                                        meta={formatSchedule(m.starts_at, m.ends_at, m.location)
                                            ? [{ label: 'When', value: formatSchedule(m.starts_at, m.ends_at, m.location) }]
                                            : []}
                                        artwork={m.hero_image
                                            ? { src: assetPath(m.hero_image), alt: m.name, variant: 'thumb' }
                                            : undefined}
                                        status={Number(m.base_price) === 0
                                            ? 'Free'
                                            : formatMoney(m.base_price, m.currency || 'USD')}
                                        cta={{ label: 'View details', icon: 'fas fa-arrow-right' }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <style>{`
                .listing-page { padding: 56px 0 80px; }
                .listing-page__top { align-items: start; gap: 32px; }
                .listing-page__chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                .listing-page__body {
                    color: rgba(255, 255, 255, 0.78);
                    font-size: 1.02rem;
                    line-height: 1.75;
                    white-space: pre-line;
                }
                .listing-page__facts {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 28px;
                    margin-top: 28px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }
                .listing-page__fact-label {
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 0.68rem;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .listing-page__fact-value { color: #fff; font-weight: 600; }
                .listing-page__aside {
                    background: linear-gradient(155deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 18px;
                    padding: 26px;
                    position: sticky;
                    top: 96px;
                }
                .listing-page__price {
                    color: #fff;
                    font-size: 2rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }
                .listing-page__price-sub {
                    display: block;
                    font-size: 0.78rem;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.55);
                    letter-spacing: 0;
                }
                .listing-page__row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 18px;
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 0.9rem;
                }
                .listing-page__row--block { display: block; }
                .listing-page__row i { opacity: 0.7; }
                .listing-page__cta { margin-top: 24px; }
                .listing-page__book { display: flex; flex-direction: column; gap: 10px; }
                .listing-page__book-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
                .listing-page__stepper { display: inline-flex; align-items: center; gap: 10px; }
                .listing-page__stepper output { min-width: 2ch; text-align: center; font-weight: 700; }
                .listing-page__cta .listing-page__stepper .tfe-btn { width: auto; }
                .listing-page__cta .tfe-btn { width: 100%; justify-content: center; }
                .listing-page__cta-note {
                    margin: 10px 0 0;
                    font-size: 0.78rem;
                    color: rgba(255, 255, 255, 0.5);
                    text-align: center;
                }
                .listing-page__publisher {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-top: 22px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                }
                .listing-page__more { margin-top: 64px; }
                .listing-page__more-title {
                    color: #fff;
                    font-size: 1.3rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                }
                @media (max-width: 991px) {
                    .listing-page__aside { position: static; }
                }
            `}</style>
        </SectionPageShell>
    );
}

function Fact({ label, value }) {
    return (
        <div>
            <div className="listing-page__fact-label">{label}</div>
            <div className="listing-page__fact-value">{value}</div>
        </div>
    );
}

/**
 * One click from a package to its booking (Sprint 65): pick the number of
 * travellers, book, sign in, pay. The published price is the quote.
 */
function BookNow({ listing, onlinePayment = false }) {
    const [group, setGroup] = React.useState(1);
    const [busy, setBusy] = React.useState(false);
    const total = (Number(listing.base_price) || 0) * group;

    const book = () => {
        setBusy(true);
        router.post(route('listings.book', listing.id), { group_size: group }, { onFinish: () => setBusy(false) });
    };

    return (
        <div className="listing-page__book">
            <div className="listing-page__book-row">
                <span>Travellers</span>
                <div className="listing-page__stepper">
                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Fewer travellers" disabled={group <= 1} onClick={() => setGroup(group - 1)}>
                        <i className="fas fa-minus" aria-hidden="true" />
                    </button>
                    <output aria-live="polite">{group}</output>
                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="More travellers" disabled={group >= 50} onClick={() => setGroup(group + 1)}>
                        <i className="fas fa-plus" aria-hidden="true" />
                    </button>
                </div>
            </div>
            <button type="button" className="tfe-btn tfe-btn--filled tfe-btn--lg" disabled={busy} onClick={book}>
                <i className="fas fa-lock" aria-hidden="true" /> Book now · {formatMoney(total, listing.currency)}
            </button>
            <Link href={route('fan.budget-calculator', { package: listing.id })} className="tfe-btn tfe-btn--lg mt-2">
                Customise this trip first
            </Link>
            <TrustSignals
                verified={Boolean(listing.publisher?.verified)}
                partnerName={listing.publisher?.display_name}
                onlinePayment={onlinePayment}
            />
        </div>
    );
}
