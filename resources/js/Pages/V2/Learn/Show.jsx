import React from 'react';
import { usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import { closingProps } from '@/Components/Landing/V2/V2Blocks';
import { LearnResourceBody } from '@/Pages/Learn/Show';

/** /v2/learn/{slug}: one resource, the same body as /learn/{slug}. */
export default function LearnShow({ resource: r, related = [] }) {
    const { v2Pages } = usePage().props;

    return (
        <V2PageShell
            title={r.title}
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'Learning Hub', href: route('learn.index') }, { label: r.title }]}
                    eyebrow={r.category_label}
                    title={r.title}
                    tagline={r.summary}
                    background={r.hero_image || '/assets/img/backdrops/field-night.jpg'}
                    accent={r.publisher?.theme_accent || '#15803d'}
                />
            )}
            closing={closingProps(v2Pages.learn.closing, { primary: { action: 'route:register.institution' }, secondary: { action: 'link:/for-schools' } })}
        >
            <LearnResourceBody resource={r} related={related} />
        </V2PageShell>
    );
}
