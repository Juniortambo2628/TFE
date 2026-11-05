import React from 'react';
import { usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import PartnerCategories from '@/Components/Landing/V2/PartnerCategories';
import LandingAction from '@/Components/Landing/V2/LandingAction';
import { V2Points, V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';
import { assetPath } from '@/lib/assets';

/**
 * /v2/services: what TFE does for each audience — fans, partners, schools —
 * each leading to that audience's walkthrough, then the partner types with
 * live counts. Copy: `pages.services` + the landing's `audiences`/`partners`.
 */
export default function Services({ hero, landing, partnerCounts = {}, partnerTypeLabels = {} }) {
    const { v2Pages, tournament } = usePage().props;
    const copy = v2Pages.services;
    const images = Object.fromEntries((landing.audiences || []).map((a) => [`for-${a.id}`, a.image]));

    return (
        <V2PageShell
            title="Services"
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'Services' }]}
                    eyebrow={hero.eyebrow}
                    title={hero.title}
                    tagline={hero.tagline}
                    background={hero.background}
                    actions={<LandingAction action="planner" label={copy.closing.primary} icon="fas fa-plane" filled tournamentId={tournament?.id} />}
                />
            )}
            sections={copy.sections}
            closing={closingProps(copy.closing, { primary: { action: 'planner' }, secondary: { action: 'route:contact' }, tournamentId: tournament?.id })}
        >
            {copy.groups.map((g, i) => (
                <V2Section key={g.id} id={g.id} tinted={i % 2 === 1}>
                    <div className="v2-service">
                        <div className="v2-service__copy">
                            <p className="v2-eyebrow">{g.eyebrow}</p>
                            <h2 className="v2-head__title">{g.title}</h2>
                            <p className="v2-head__text">{g.text}</p>
                            <V2Points points={g.items} />
                            <LandingAction action={g.action} label={g.link_label} icon="fas fa-arrow-right" size="md" />
                        </div>
                        {images[g.id] && (
                            <div className="v2-service__image" style={{ '--v2-card-image': `url(${assetPath(images[g.id])})` }} aria-hidden="true" />
                        )}
                    </div>
                </V2Section>
            ))}

            <PartnerCategories partners={landing.partners} counts={partnerCounts} typeLabels={partnerTypeLabels} />
        </V2PageShell>
    );
}
