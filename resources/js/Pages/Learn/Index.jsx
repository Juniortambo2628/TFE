import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import { V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';
import { ResourceCard } from '@/Components/Public/ResourceCard';

/**
 * /v2/learn: the same library and URL filters as /learn (a coach can still
 * send "the safeguarding ones" as a link), in the v2 frame. Copy: the
 * Learning Hub hero from the CMS, and `pages.learn` for the closing.
 */
export default function LearnIndex({ resources = [], categories = {}, audiences = {}, filters = {}, hero }) {
    const { v2Pages } = usePage().props;
    const copy = v2Pages.learn;

    const apply = (key, value) => {
        const next = { ...filters, [key]: filters[key] === value ? null : value };
        router.get(route('learn.index'), Object.fromEntries(Object.entries(next).filter(([, v]) => v)), {
            preserveScroll: true, preserveState: true, replace: true,
        });
    };
    const hasFilter = Boolean(filters.category || filters.audience || filters.q);

    return (
        <V2PageShell
            title="Learning Hub"
            hero={<V2PageHero crumbs={[{ label: 'Learning Hub' }]} eyebrow={hero.eyebrow} title={hero.title} tagline={hero.tagline} background={hero.background} accent="#15803d" />}
            closing={closingProps(copy.closing, { primary: { action: 'route:register.institution' }, secondary: { action: 'link:/for-schools' } })}
        >
            <V2Section id="library">
                <div className="v2-filters">
                    <Chips label="Topic" options={categories} active={filters.category} onPick={(v) => apply('category', v)} />
                    <Chips label="Who it's for" options={audiences} active={filters.audience} onPick={(v) => apply('audience', v)} />
                </div>
                <div className="v2-results-head">
                    <p className="v2-results-head__count"><strong>{resources.length}</strong> {resources.length === 1 ? 'resource' : 'resources'}</p>
                    {hasFilter && <Link href={route('learn.index')} className="tfe-btn tfe-btn--sm" preserveScroll>Clear filters</Link>}
                </div>
                {resources.length === 0 ? (
                    <div className="tfe-empty">
                        <div className="tfe-empty__icon"><i className="fas fa-book-open" aria-hidden="true"></i></div>
                        <div className="tfe-empty__title">Nothing matches those filters</div>
                        <div className="tfe-empty__body">Try a different topic or audience — the library grows as partners publish.</div>
                    </div>
                ) : (
                    <div className="v2-cardgrid v2-cardgrid--3">
                        {resources.map((r) => <ResourceCard key={r.id} resource={r} href={route('learn.show', r.slug)} />)}
                    </div>
                )}
            </V2Section>
        </V2PageShell>
    );
}

function Chips({ label, options, active, onPick }) {
    const entries = Object.entries(options || {});
    if (!entries.length) return null;
    return (
        <div className="v2-filters__row" role="group" aria-label={label}>
            <span className="v2-filters__label">{label}</span>
            <div className="v2-filters__chips">
                {entries.map(([value, text]) => (
                    <button key={value} type="button" className="v2-type-chip" aria-pressed={active === value} onClick={() => onPick(value)}>{text}</button>
                ))}
            </div>
        </div>
    );
}
