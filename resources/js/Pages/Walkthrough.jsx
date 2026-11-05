import React, { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import SectionNav from '@/Components/Landing/V2/SectionNav';
import ClosingCta from '@/Components/Landing/V2/ClosingCta';
import { assetPath } from '@/lib/assets';
import '../../css/landing-v2.css';

/**
 * /for-fans, /for-partners, /for-schools (UX review, 2 Nov 2026, plan C3):
 * how one audience uses TFE, step by step, before they sign up — Najenga's
 * Journey shape. Each chapter is a step with the real screen that does it;
 * the page ends in that audience's own call to action.
 *
 * Copy: config/landing_v2.php `walkthroughs.{audience}`, editable from Admin
 * -> Content -> Landing v2.
 */
export default function Walkthrough({ page }) {
    const sections = useMemo(
        () => page.chapters.map((c, i) => ({ id: `step-${i + 1}`, label: c.title })),
        [page],
    );

    return (
        <SectionPageShell
            title={page.title}
            hero={{
                eyebrow: page.eyebrow,
                title: page.headline,
                tagline: page.tagline,
                background: page.background,
            }}
            breadcrumbs={[{ label: page.title }]}
        >
            <Head>
                <meta name="robots" content="noindex, nofollow" head-key="robots" />
            </Head>

            <div className="v2-page">
                <SectionNav sections={sections} label="Steps" />

                <div className="container v2-chapters">
                    {page.chapters.map((c, i) => (
                        <section key={c.title} id={`step-${i + 1}`} className="v2-chapter">
                            <div className="v2-chapter__copy">
                                <span className="v2-chapter__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                                <h2 className="v2-chapter__title">{c.title}</h2>
                                <p className="v2-chapter__text">{c.text}</p>
                                {c.points?.length > 0 && (
                                    <ul className="v2-explorer__points">
                                        {c.points.map((p) => (
                                            <li key={p}><i className="fas fa-check" aria-hidden="true"></i>{p}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {c.image && (
                                <figure className="v2-screens">
                                    <div className="v2-screens__laptop">
                                        <span className="v2-screens__bar" aria-hidden="true"><i></i><i></i><i></i></span>
                                        <img src={assetPath(c.image)} alt={`${c.title}: the screen on a laptop`} loading="lazy" decoding="async" />
                                    </div>
                                    {c.phone && (
                                        <div className="v2-screens__phone">
                                            <img src={assetPath(c.phone)} alt={`${c.title}: the screen on a phone`} loading="lazy" decoding="async" />
                                        </div>
                                    )}
                                </figure>
                            )}
                        </section>
                    ))}
                </div>

                <ClosingCta
                    title={page.cta.title}
                    text={page.cta.text}
                    primary={{ action: page.cta.action, label: page.cta.label, icon: 'fas fa-arrow-right' }}
                    secondary={page.cta.secondary ? { action: 'link:/v2', label: page.cta.secondary } : undefined}
                />
            </div>
        </SectionPageShell>
    );
}
