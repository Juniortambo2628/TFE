import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import AccentCard from '@/Components/Common/AccentCard';
import { V2Section, V2Steps, closingProps } from '@/Components/Landing/V2/V2Blocks';
import { ListingDetails } from '@/Pages/Listings/Show';
import { formatSchedule } from '@/lib/schedule';
import { formatMoney, titleCase } from '@/lib/utils';
import { assetPath } from '@/lib/assets';

/**
 * /v2/listings/{id}: the same details and booking panel as the v1 page
 * (ListingDetails), then how booking works — said before the visitor meets
 * the sign-in — and more from the same partner. Copy: `pages.listing`.
 */
export default function ListingShow({ listing, tournament, more = [], onlinePayment = false }) {
    const { v2Pages } = usePage().props;
    const copy = v2Pages.listing;
    const isTrip = listing.type === 'package' || listing.type === 'tour';
    const present = { details: true, how: isTrip, more: more.length > 0 };

    return (
        <V2PageShell
            title={listing.name}
            hero={(
                <V2PageHero
                    crumbs={listing.publisher?.slug
                        ? [
                            { label: 'Partners', href: route('partners.index') },
                            { label: listing.publisher.display_name, href: route('partners.hub', listing.publisher.slug) },
                            { label: listing.name },
                        ]
                        : [{ label: listing.name }]}
                    eyebrow={[titleCase(listing.type), tournament?.short_name].filter(Boolean).join(' · ')}
                    title={listing.name}
                    tagline={listing.publisher ? `Published by ${listing.publisher.display_name}` : 'Published by The Football Experience'}
                    background={listing.hero_image}
                    accent={listing.publisher?.theme_accent}
                />
            )}
            sections={copy.sections.filter((s) => present[s.id])}
            closing={closingProps(copy.closing, { primary: { action: 'planner' }, secondary: { action: 'link:/partners' }, tournamentId: tournament?.id })}
        >
            <section id="details" className="listing-page v2-anchor">
                <div className="container">
                    <ListingDetails listing={listing} tournament={tournament} onlinePayment={onlinePayment} />
                </div>
            </section>

            {present.how && (
                <V2Section id="how" eyebrow={copy.how.eyebrow} title={copy.how.title} tinted>
                    <V2Steps steps={copy.how.steps} />
                </V2Section>
            )}

            {present.more && (
                <V2Section id="more" eyebrow={copy.more_eyebrow} title={`More from ${listing.publisher?.display_name || 'this partner'}`}>
                    <div className="v2-cardgrid v2-cardgrid--3">
                        {more.map((m) => {
                            const when = formatSchedule(m.starts_at, m.ends_at, m.location);
                            return (
                                <AccentCard
                                    key={m.id}
                                    LinkComponent={Link}
                                    href={route('listings.show', m.id)}
                                    eyebrow={titleCase(m.type)}
                                    title={m.name}
                                    desc={m.description || undefined}
                                    meta={when ? [{ label: 'When', value: when }] : []}
                                    artwork={m.hero_image ? { src: assetPath(m.hero_image), alt: m.name, variant: 'thumb' } : undefined}
                                    status={Number(m.base_price) === 0 ? 'Free' : formatMoney(m.base_price, m.currency || 'USD')}
                                    cta={{ label: 'View details', icon: 'fas fa-arrow-right' }}
                                />
                            );
                        })}
                    </div>
                </V2Section>
            )}
        </V2PageShell>
    );
}
