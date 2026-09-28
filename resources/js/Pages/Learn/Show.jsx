import React from 'react';
import { Link } from '@inertiajs/react';

import SectionPageShell from '@/Components/Landing/SectionPageShell';
import AccentCard from '@/Components/Common/AccentCard';
import GlassPill from '@/Components/Common/GlassPill';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';

/**
 * One learning resource.
 *
 * The hero is built from the resource itself rather than the CMS, since
 * every resource has its own title and topic — PageHero takes the same
 * shape whether the values come from config or from a row.
 */
export default function LearnShow({ resource: r, related = [] }) {
    const accent = r.publisher?.theme_accent || '#15803d';

    const hero = {
        eyebrow: r.category_label,
        title: r.title,
        tagline: r.summary,
        background: r.hero_image || '/assets/img/backdrops/field-night.jpg',
    };

    return (
        <SectionPageShell title={r.title} hero={hero}>
            <section className="py-5">
                <div className="container">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-4">
                        <GlassPill>For {r.audience_label}</GlassPill>
                        <GlassPill>{r.level_label}</GlassPill>
                        {r.read_minutes && <GlassPill><i className="fas fa-clock"></i> {r.read_minutes} min read</GlassPill>}
                        {r.publisher && <PoweredByBadge publisher={r.publisher} />}
                    </div>

                    {/* The resource body is partner-authored plain text. It is
                        rendered as text, never as HTML — a partner-supplied
                        string through dangerouslySetInnerHTML is a stored-XSS
                        vector, the same reasoning that keeps SVG out of the
                        uploaders. */}
                    {r.body && (
                        <div className="tfe-slab mb-4">
                            <div className="tfe-slab__body tfe-modal__prose">
                                {r.body.split(/\n{2,}/).map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="d-flex gap-2 flex-wrap mb-5">
                        {r.external_url && (
                            <a href={r.external_url} target="_blank" rel="noopener noreferrer" className="tfe-btn tfe-btn--filled">
                                <i className="fas fa-play"></i> Watch
                            </a>
                        )}
                        {r.file_url && (
                            <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="tfe-btn">
                                <i className="fas fa-file-arrow-down"></i> Download
                            </a>
                        )}
                        {r.program && (
                            <Link href={route('learn.index')} className="tfe-btn">
                                <i className="fas fa-graduation-cap"></i> Part of {r.program.name}
                            </Link>
                        )}
                    </div>

                    {related.length > 0 && (
                        <>
                            <h2 className="text-white fw-bold mb-4">More on {r.category_label.toLowerCase()}</h2>
                            <div className="row g-4">
                                {related.map((o) => (
                                    <div key={o.id} className="col-md-4">
                                        <AccentCard
                                            LinkComponent={Link}
                                            href={route('learn.show', o.slug)}
                                            accent={accent}
                                            artwork={{ icon: 'fas fa-book-open' }}
                                            status={o.audience_label}
                                            title={o.title}
                                            desc={o.summary}
                                            cta={{ label: 'Open', icon: 'fas fa-arrow-right' }}
                                            className="tfe-acard--content"
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="mt-5">
                        <Link href={route('learn.index')} className="tfe-btn">
                            <i className="fas fa-arrow-left"></i> All resources
                        </Link>
                    </div>
                </div>
            </section>
        </SectionPageShell>
    );
}
