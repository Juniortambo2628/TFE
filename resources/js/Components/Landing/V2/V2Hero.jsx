import React, { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { assetPath } from '@/lib/assets';
import { preloadImage } from '@/Data/stadiumImages';
import LandingAction from '@/Components/Landing/V2/LandingAction';

const SLIDE_MS = 6500;

/**
 * v2 hero: the stadium carousel full-bleed, with only a headline and two
 * CTAs over it (plan C2.1). No tournament card and no world map — the panel
 * under the hero says what TFE is, and the sections below show how it works.
 *
 * Slides are the active tournament's catalogued venues (each has committed
 * imagery, Sprint 45); the alternate ground is left out. One slide on
 * reduced motion.
 */
export default function V2Hero({ hero }) {
    const { tournament } = usePage().props;
    const slides = useMemo(
        () => (tournament?.venues || [])
            .filter((v) => v.image && !v.is_alternate)
            .map((v) => ({ image: assetPath(v.image), name: v.name, city: v.city })),
        [tournament?.id],
    );
    const [index, setIndex] = useState(0);
    const reduceMotion = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        if (reduceMotion || slides.length < 2) return undefined;
        const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
        return () => clearInterval(t);
    }, [slides.length, reduceMotion]);

    // Warm the next slide so the cross-fade never shows a half-loaded image.
    useEffect(() => {
        const next = slides[(index + 1) % Math.max(1, slides.length)];
        if (next) preloadImage(next.image);
    }, [index, slides]);

    const current = slides[index];

    return (
        <section className="v2-hero" aria-label={hero.eyebrow}>
            <div className="v2-hero__slides" aria-hidden="true">
                {/* Only the previous, current and next slides are mounted: a
                    stacked set of every slide would make the browser fetch all
                    of them (lazy loading ignores opacity). The previous one
                    stays to fade out while the current fades in. */}
                {slides.map((s, i) => {
                    const n = slides.length;
                    const near = i === index || i === (index + 1) % n || i === (index - 1 + n) % n;
                    if (!near) return null;
                    return (
                        <img
                            key={s.image}
                            src={s.image}
                            alt=""
                            className={'v2-hero__slide' + (i === index ? ' is-active' : '')}
                            fetchPriority={i === index ? 'high' : 'low'}
                            decoding="async"
                        />
                    );
                })}
                <div className="v2-hero__shade"></div>
            </div>

            <div className="container v2-hero__inner">
                <p className="v2-eyebrow v2-eyebrow--light">{hero.eyebrow}</p>
                <h1 className="v2-hero__title">{hero.title}</h1>
                <p className="v2-hero__tagline">{hero.tagline}</p>
                <div className="v2-hero__ctas">
                    <LandingAction action="planner" label={hero.primary_cta} icon="fas fa-plane" filled tournamentId={tournament?.id} />
                    <LandingAction action="section:journey" label={hero.secondary_cta} icon="fas fa-arrow-down" />
                </div>
            </div>

            {current && (
                <p className="v2-hero__venue" aria-live="off">
                    <i className="fas fa-location-dot" aria-hidden="true"></i>
                    <span>{current.name}</span>
                    {current.city && <span className="v2-hero__venue-city"> · {current.city}</span>}
                </p>
            )}
        </section>
    );
}
