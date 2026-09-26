import React from 'react';
import '../../../css/partner-hub.css';
import { assetPath } from '@/lib/assets';

/**
 * PageHero — the shared public-page hero, reusing the partner hub hero layout
 * (photo background + gradient, eyebrow, title, tagline, optional CTA(s)).
 * Used on the standalone section pages AND the tournament pages, so they all
 * read the same. Content is config/CMS-driven for the section pages
 * (config/site_pages.php + HomeController).
 *
 * Props:
 *  - eyebrow, title, tagline, background (public path or URL), accent
 *  - cta {label, href, icon?} — single CTA (section pages), OR
 *  - ctas [{label, href, icon?, filled?}] — several (first is filled by default)
 *  - media {src, alt} — an image (e.g. a trophy) floating on the right
 *  - children — extra hero content under the tagline (host pills, meta, …)
 */
export default function PageHero({ eyebrow, title, tagline, background, accent = '#dc143c', cta, ctas, media, children }) {
    const bg = assetPath(background) || '';
    const ctaList = (ctas && ctas.length) ? ctas : (cta ? [cta] : []);

    // A split hero (trophy on the right) keeps the organiser brand visible:
    // dark on the left for legible copy, fading to reveal the artwork on the
    // right, plus a soft bottom fade into the page. A plain hero darkens
    // top-to-bottom so any photo reads as a backdrop.
    const overlay = media
        ? 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 48%, rgba(0,0,0,0.3) 100%), linear-gradient(180deg, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.82) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.9) 100%)';

    const style = {
        '--partner-accent': accent,
        backgroundImage: bg
            ? `${overlay}, url(${bg})`
            : 'linear-gradient(180deg, rgba(20,20,24,0.6), rgba(0,0,0,0.95))',
    };

    return (
        <section className={'partner-hub-hero page-hero' + (media ? ' page-hero--split' : '')} style={style}>
            <div className="container">
                <div className="page-hero__grid">
                    <div className="page-hero__body">
                        {eyebrow && <div className="partner-hub-hero__eyebrow">{eyebrow}</div>}
                        <h1 className="partner-hub-hero__title">{title}</h1>
                        {tagline && <p className="partner-hub-hero__tagline page-hero__tagline">{tagline}</p>}
                        {children}
                        {ctaList.length > 0 && (
                            <div className="page-hero__ctas">
                                {ctaList.map((c, i) => (
                                    <a
                                        key={i}
                                        href={c.href || '#'}
                                        className={'tfe-btn tfe-btn--lg' + ((c.filled ?? i === 0) ? ' tfe-btn--filled' : '')}
                                    >
                                        {c.icon && <i className={c.icon} />}
                                        {c.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    {media && (
                        <div className="page-hero__media-wrap">
                            <img
                                className="page-hero__media"
                                src={assetPath(media.src)}
                                alt={media.alt || ''}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
