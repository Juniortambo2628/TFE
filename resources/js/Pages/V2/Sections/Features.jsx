import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import FeatureExplorer from '@/Components/Landing/V2/FeatureExplorer';
import LandingAction from '@/Components/Landing/V2/LandingAction';
import { V2IconCards, V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';

/**
 * /v2/features: the real screens first (the /v2 explorer, one area at a
 * time), then the smaller features, each saying where a partner has to
 * switch it on. Copy: `pages.features` + the landing's `explorer`.
 */
export default function Features({ hero, landing }) {
    const { v2Pages, tournament } = usePage().props;
    const copy = v2Pages.features;
    const [area, setArea] = useState(landing.explorer?.areas?.[0]?.id);

    return (
        <V2PageShell
            title="Features"
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'Features' }]}
                    eyebrow={hero.eyebrow}
                    title={hero.title}
                    tagline={hero.tagline}
                    background={hero.background}
                    actions={<LandingAction action="section:inside" label={copy.sections[0].label} icon="fas fa-arrow-down" filled />}
                />
            )}
            sections={copy.sections}
            closing={closingProps(copy.closing, { primary: { action: 'planner' }, secondary: { action: 'link:/services' }, tournamentId: tournament?.id })}
        >
            <FeatureExplorer explorer={landing.explorer} active={area} onChange={setArea} tournamentId={tournament?.id} />

            <V2Section id="more" eyebrow={copy.more.eyebrow} title={copy.more.title} text={copy.more.text}>
                <V2IconCards items={copy.more.items} />
            </V2Section>
        </V2PageShell>
    );
}
