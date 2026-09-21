import React from 'react';
import { usePage } from '@inertiajs/react';
import '../../../css/partner-hub.css';

/**
 * PageHero — the shared public-page hero, reusing the partner hub hero layout
 * (photo background + gradient, eyebrow, title, tagline, optional CTA). Used
 * on the standalone section pages so they read like the partner hub. Content
 * is config/CMS-driven (see config/site_pages.php + HomeController).
 */
export default function PageHero({ eyebrow, title, tagline, background, accent = '#dc143c', cta }) {
    const { assetUrl } = usePage().props;
    const baseUrl = assetUrl || '';
    const bg = background
        ? (background.startsWith('http') || background.startsWith('/') ? background : baseUrl + background)
        : '';

    const style = {
        '--partner-accent': accent,
        backgroundImage: bg
            ? `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.9) 100%), url(${bg})`
            : 'linear-gradient(180deg, rgba(20,20,24,0.6), rgba(0,0,0,0.95))',
    };

    return (
        <section className="partner-hub-hero page-hero" style={style}>
            <div className="container">
                <div className="page-hero__body">
                    {eyebrow && <div className="partner-hub-hero__eyebrow">{eyebrow}</div>}
                    <h1 className="partner-hub-hero__title">{title}</h1>
                    {tagline && <p className="partner-hub-hero__tagline page-hero__tagline">{tagline}</p>}
                    {cta && cta.label && (
                        <a href={cta.href || '#'} className="tfe-btn tfe-btn--filled tfe-btn--lg page-hero__cta">
                            {cta.label}
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}
