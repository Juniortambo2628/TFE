import React, { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { assetPath } from '@/lib/assets';
import { preloadImage } from '@/Data/stadiumImages';
import LandingAction from '@/Components/Landing/V2/LandingAction';
import { openTripPlanner } from '@/lib/tripPlanner';

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
    // Held while the pointer or focus is on the stadium's own button, so the
    // city it names cannot change under the finger about to tap it.
    const [paused, setPaused] = useState(false);
    const reduceMotion = typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        if (reduceMotion || paused || slides.length < 2) return undefined;
        const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
        return () => clearInterval(t);
    }, [slides.length, reduceMotion, paused]);

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

            {/* The stadium on screen, and a trip to it (UX review, 2 Nov 2026,
                carried over from the v1 hero): "Trip to {city}" opens the
                planner on that stadium's matches. */}
            {current && (
                <div
                    className="v2-hero__venue"
                    onPointerEnter={() => setPaused(true)}
                    onPointerLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                >
                    <p className="v2-hero__venue-name" aria-live="off">
                        <i className="fas fa-location-dot" aria-hidden="true"></i>
                        <span>{current.name}</span>
                        {current.city && <span className="v2-hero__venue-city"> · {current.city}</span>}
                    </p>
                    {current.city && (
                        <button
                            type="button"
                            className="v2-hero__venue-trip"
                            onClick={() => openTripPlanner({ tournamentId: tournament?.id, venue: current.name })}
                            aria-label={`Plan a trip to ${current.city} for a match at ${current.name}`}
                        >
                            <i className="fas fa-plane" aria-hidden="true"></i> Trip to {current.city}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
