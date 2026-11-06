import React from 'react';
import { usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import AudiencePanel from '@/Components/Landing/V2/AudiencePanel';
import FactsStrip from '@/Components/Landing/V2/FactsStrip';
import LandingAction from '@/Components/Landing/V2/LandingAction';
import { V2IconCards, V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';

/**
 * /v2/about: what TFE is and who it is for (the /v2 panel), the facts, what
 * we hold to, and who is behind it. Copy: config/landing_v2.php `pages.about`
 * (+ the landing's `about`, `audiences` and `facts`), editable in the CMS.
 */
export default function About({ hero, landing, facts = {} }) {
    const { v2Pages, tournament } = usePage().props;
    const copy = v2Pages.about;

    return (
        <V2PageShell
            title="About"
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'About' }]}
                    eyebrow={hero.eyebrow}
                    title={hero.title}
                    tagline={hero.tagline}
                    background={hero.background}
                    actions={<LandingAction action="planner" label={copy.closing.primary} icon="fas fa-plane" filled tournamentId={tournament?.id} />}
                />
            )}
            sections={copy.sections}
            closing={closingProps(copy.closing, { primary: { action: 'planner' }, secondary: { action: 'link:/for-fans' }, tournamentId: tournament?.id })}
        >
            <div id="what" className="v2-anchor v2-page-panel">
                <AudiencePanel about={landing.about} audiences={landing.audiences} />
                <FactsStrip facts={facts} labels={landing.facts} />
            </div>

            <V2Section id="principles" eyebrow={copy.principles.eyebrow} title={copy.principles.title} text={copy.principles.text} tinted>
                <V2IconCards items={copy.principles.items} />
            </V2Section>

            <V2Section id="behind" eyebrow={copy.behind.eyebrow} title={copy.behind.title} text={copy.behind.text} />
        </V2PageShell>
    );
}
