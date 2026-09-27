import React from 'react';
import { Link, router } from '@inertiajs/react';

import SectionPageShell from '@/Components/Landing/SectionPageShell';
import AccentCard from '@/Components/Common/AccentCard';
import GlassPill from '@/Components/Common/GlassPill';

/**
 * Learning Hub index — the public library at /learn.
 *
 * Renders through SectionPageShell + PageHero like every other public
 * section page, so the chrome, hero and footer come for free.
 *
 * Filtering is a server round-trip rather than client state: the filters
 * belong in the URL so a coach can send "the safeguarding ones" to a
 * colleague as a link.
 */
export default function LearnIndex({ resources = [], categories = {}, audiences = {}, filters = {}, hero }) {
    const apply = (key, value) => {
        const next = { ...filters, [key]: filters[key] === value ? null : value };

        router.get(route('learn.index'), clean(next), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const hasFilter = Boolean(filters.category || filters.audience || filters.q);

    return (
        <SectionPageShell title="Learning Hub" hero={hero}>
            <section className="py-5" id="learn-resources">
                <div className="container">
                    <FilterRow
                        label="Topic"
                        options={categories}
                        active={filters.category}
                        onPick={(v) => apply('category', v)}
                    />
                    <FilterRow
                        label="Who it's for"
                        options={audiences}
                        active={filters.audience}
                        onPick={(v) => apply('audience', v)}
                    />

                    <div className="d-flex align-items-center justify-content-between mb-4 mt-4">
                        <span className="text-white-50 small">
                            {resources.length} {resources.length === 1 ? 'resource' : 'resources'}
                        </span>
                        {hasFilter && (
                            <Link
                                href={route('learn.index')}
                                className="tfe-btn tfe-btn--sm"
                                preserveScroll
                            >
                                Clear filters
                            </Link>
                        )}
                    </div>

                    {resources.length === 0 ? (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-book-open"></i></div>
                            <div className="tfe-empty__title">Nothing matches those filters</div>
                            <div className="tfe-empty__body">
                                Try a different topic or audience — the library grows as partners publish.
                            </div>
                            <div className="tfe-empty__action">
                                <Link href={route('learn.index')} className="tfe-btn tfe-btn--filled">
                                    Show everything
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {resources.map((r) => (
                                <div key={r.id} className="col-md-6 col-lg-4">
                                    <ResourceCard resource={r} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </SectionPageShell>
    );
}

function FilterRow({ label, options, active, onPick }) {
    const entries = Object.entries(options);
    if (!entries.length) return null;

    return (
        <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
            <span className="text-white-50 small text-uppercase me-2">{label}</span>
            {entries.map(([value, text]) => (
                <button
                    key={value}
                    type="button"
                    className="tfe-btn tfe-btn--sm"
                    aria-pressed={active === value}
                    onClick={() => onPick(value)}
                >
                    {text}
                </button>
            ))}
        </div>
    );
}

function ResourceCard({ resource: r }) {
    // Only state what is true of this resource — a card that always showed
    // every chip would say "video" of a text guide.
    const meta = [
        { label: 'For', value: r.audience_label },
        ...(r.read_minutes ? [{ label: 'Read', value: `${r.read_minutes} min` }] : []),
    ];

    return (
        <AccentCard
            LinkComponent={Link}
            href={route('learn.show', r.slug)}
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

/** Drop empty filters so the URL carries only what is actually set. */
function clean(params) {
    return Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ''),
    );
}
