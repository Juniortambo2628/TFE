import React, { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import AccentCard from '@/Components/Common/AccentCard';
import { V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';

/**
 * /v2/partners: the same directory as /partners (same query, same filters in
 * the URL), with the search in the hero and the filters as one chip row each
 * above the results. Copy: `pages.partners`.
 */
export default function PartnersIndex({ profiles = [], partner_types = {}, tournaments = [], filters = {} }) {
    const { v2Pages } = usePage().props;
    const copy = v2Pages.partners;
    const [q, setQ] = useState(filters.q || '');
    const [type, setType] = useState(filters.type || '');
    const [tournamentId, setTournamentId] = useState(filters.tournament_id || '');
    const first = useRef(true);

    // Debounced, and not on first render: the page already has these results.
    useEffect(() => {
        if (first.current) { first.current = false; return undefined; }
        const t = setTimeout(() => {
            const params = Object.fromEntries(Object.entries({ q, type, tournament_id: tournamentId }).filter(([, v]) => v));
            router.get(route('v2.partners.index'), params, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => clearTimeout(t);
    }, [q, type, tournamentId]);

    const filtered = q || type || tournamentId;
    const [one, many = one] = String(copy.count).split('|');
    const countLabel = profiles.length === 1 ? one : many;

    return (
        <V2PageShell
            title="Partners"
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'Partners' }]}
                    eyebrow={copy.eyebrow}
                    title={copy.title}
                    tagline={copy.tagline}
                    background="/assets/img/backdrops/stadium-fans.jpg"
                >
                    <label className="v2-search">
                        <i className="fas fa-search" aria-hidden="true"></i>
                        <span className="v2-sr-only">{copy.search}</span>
                        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={copy.search} />
                    </label>
                </V2PageHero>
            )}
            closing={closingProps(copy.closing, { primary: { action: 'route:contact' }, secondary: { action: 'link:/for-partners' } })}
        >
            <V2Section id="directory">
                <div className="v2-filters">
                    <ChipRow label={copy.type_label} all={copy.all} value={type} onChange={setType}
                        options={Object.entries(partner_types).map(([value, label]) => ({ value, label }))} />
                    <ChipRow label={copy.tournament_label} all={copy.all} value={tournamentId} onChange={setTournamentId}
                        options={tournaments.map((t) => ({ value: t.id, label: t.short_name || t.name }))} />
                </div>

                <div className="v2-results-head">
                    <p className="v2-results-head__count" aria-live="polite"><strong>{profiles.length}</strong> {countLabel}</p>
                    {filtered && (
                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => { setQ(''); setType(''); setTournamentId(''); }}>
                            {copy.clear}
                        </button>
                    )}
                </div>

                {profiles.length === 0 ? (
                    <div className="tfe-empty">
                        <div className="tfe-empty__icon"><i className="fas fa-search" aria-hidden="true"></i></div>
                        <div className="tfe-empty__title">{copy.empty_title}</div>
                        <div className="tfe-empty__body">{copy.empty_text}</div>
                    </div>
                ) : (
                    <div className="v2-cardgrid">
                        {profiles.map((p) => <PartnerCard key={p.slug} profile={p} />)}
                    </div>
                )}
            </V2Section>
        </V2PageShell>
    );
}

function ChipRow({ label, all, value, onChange, options }) {
    return (
        <div className="v2-filters__row" role="group" aria-label={label}>
            <span className="v2-filters__label">{label}</span>
            <div className="v2-filters__chips">
                <button type="button" className="v2-type-chip" aria-pressed={value === ''} onClick={() => onChange('')}>{all}</button>
                {options.map((o) => (
                    <button key={o.value} type="button" className="v2-type-chip" aria-pressed={value === o.value} onClick={() => onChange(value === o.value ? '' : o.value)}>
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function PartnerCard({ profile }) {
    const tags = profile.service_tags || [];
    const pills = tags.slice(0, 3);
    if (tags.length > 3) pills.push(`+${tags.length - 3}`);

    return (
        <AccentCard
            LinkComponent={Link}
            href={route('v2.partners.hub', profile.slug)}
            accent={profile.theme_accent || '#dc143c'}
            artwork={profile.logo_url ? { src: profile.logo_url, alt: profile.display_name } : undefined}
            status={profile.verification_status === 'verified' ? 'Verified' : undefined}
            eyebrow={profile.partner_type_label}
            title={profile.display_name}
            desc={profile.tagline}
            pills={pills}
            meta={[{ label: 'Listings', value: profile.listings_count }]}
            cta={{ label: 'Visit hub' }}
        />
    );
}
