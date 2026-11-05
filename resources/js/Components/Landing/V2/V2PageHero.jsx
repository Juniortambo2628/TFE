import React from 'react';
import BackNav from '@/Components/Common/BackNav';
import { assetPath } from '@/lib/assets';

/**
 * The hero of a v2 inner page: the /v2 hero's full-bleed photo and type, one
 * image instead of a carousel, and shorter so the page's first section is in
 * view. `crumbs` is the trail after Home; `media` an image floated beside the
 * copy (a partner's logo, a trophy); `children` sits under the tagline
 * (pills, facts); `actions` are the CTAs.
 */
export default function V2PageHero({ eyebrow, title, tagline, background, accent, crumbs, media, actions, children }) {
    const bg = assetPath(background || '/assets/img/backdrops/night-stadium.jpg');

    return (
        <section className="v2-hero v2-hero--page" style={accent ? { '--v2-accent': accent } : undefined}>
            <div className="v2-hero__slides" aria-hidden="true">
                <img src={bg} alt="" className="v2-hero__slide is-active" fetchPriority="high" decoding="async" />
                <div className="v2-hero__shade"></div>
            </div>

            <div className="container v2-hero__inner">
                {crumbs && <BackNav crumbs={crumbs} />}
                <div className={'v2-pagehero' + (media ? ' v2-pagehero--media' : '')}>
                    <div className="v2-pagehero__copy">
                        {eyebrow && <p className="v2-eyebrow v2-eyebrow--light">{eyebrow}</p>}
                        <h1 className="v2-hero__title v2-pagehero__title">{title}</h1>
                        {tagline && <p className="v2-hero__tagline">{tagline}</p>}
                        {children}
                        {actions && <div className="v2-hero__ctas">{actions}</div>}
                    </div>
                    {media && (
                        <div className={'v2-pagehero__media' + (media.round ? ' is-round' : '')}>
                            <img
                                src={assetPath(media.src)}
                                alt={media.alt || ''}
                                onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
