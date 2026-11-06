import React from 'react';
import { Link, router } from '@inertiajs/react';

import AccentCard from '@/Components/Common/AccentCard';
import GlassPill from '@/Components/Common/GlassPill';

export function ResourceCard({ resource: r, href }) {
    // Only state what is true of this resource — a card that always showed
    // every chip would say "video" of a text guide.
    const meta = [
        { label: 'For', value: r.audience_label },
        ...(r.read_minutes ? [{ label: 'Read', value: `${r.read_minutes} min` }] : []),
    ];

    return (
        <AccentCard
            LinkComponent={Link}
            href={href || route('learn.show', r.slug)}
            accent={r.publisher?.theme_accent || '#15803d'}
            artwork={r.hero_image ? { src: r.hero_image, alt: r.title, variant: 'thumb' } : { icon: 'fas fa-book-open' }}
            status={r.category_label}
            title={r.title}
            desc={r.summary}
            meta={meta}
            cta={{ label: 'Open', icon: 'fas fa-arrow-right' }}
            className="tfe-acard--content"
        >
            <div className="d-flex align-items-center gap-2 flex-wrap">
                <GlassPill>{r.level_label}</GlassPill>
                {r.has_video && <GlassPill><i className="fas fa-play"></i> Video</GlassPill>}
                {r.has_file && <GlassPill><i className="fas fa-file-arrow-down"></i> Download</GlassPill>}
            </div>
        </AccentCard>
    );
}
