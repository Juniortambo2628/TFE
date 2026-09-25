import React, { useMemo, useEffect, useRef } from 'react';
import WorldMap from 'react-svg-worldmap';

/*
 * Full world map for the Hero section.
 * Non-host countries: frosted glass (blurred fill, white borders).
 * Host countries: solid white, sharp.
 * The host hosting the current slide's stadium: accent-filled.
 */

/* Shared between styleFunction and the blur pass — they must agree on what
   "non-host" looks like, so it is written once. */
const NON_HOST_FILL = 'rgba(255,255,255,0.15)';

export default function HeroWorldMap({ tournament, className, activeCountry, accent = '#dc143c' }) {
    const wrapperRef = useRef(null);

    const hostCountries = useMemo(() => {
        return (tournament?.host_flag_codes || []).map(c => c.toLowerCase());
    }, [tournament?.id, tournament?.host_flag_codes]);

    // The host country of the stadium on the current hero slide, if any.
    const active = (activeCountry || '').toLowerCase();

    const mapData = useMemo(() => {
        return hostCountries.map(code => ({ country: code, value: 1 }));
    }, [hostCountries]);

    useEffect(() => {
        if (!wrapperRef.current) return;
        const svg = wrapperRef.current.querySelector('svg');
        if (!svg) return;

        /* Remove library tooltip titles */
        svg.querySelectorAll('title').forEach(t => t.remove());

        /* Fix aspect ratio to show full map */
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        /* Inject SVG blur filter for non-host countries */
        if (!svg.querySelector('#hero-country-blur')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `
                <filter id="hero-country-blur" x="-5%" y="-5%" width="110%" height="110%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
                </filter>
            `;
            svg.insertBefore(defs, svg.firstChild);
        }

        /* Apply blur filter to non-host country paths.
           Keyed off the dim non-host fill rather than "is it white?" — the
           active host is painted in the accent colour, so a white test would
           blur the one country we most want sharp. */
        svg.querySelectorAll('path').forEach(path => {
            const style = path.getAttribute('style') || '';
            if (style.includes(NON_HOST_FILL)) {
                path.setAttribute('filter', 'url(#hero-country-blur)');
            } else {
                // Clear it explicitly: this effect re-runs as the slide
                // changes, and a country that has just become active would
                // otherwise keep the blur it was given on the previous pass.
                path.removeAttribute('filter');
            }
        });
    });

    const styleFunction = ({ countryCode }) => {
        const code = (countryCode || '').toLowerCase();

        // The host whose stadium is on screen right now — accent-filled so the
        // map tracks the slider.
        if (active && code === active) {
            return {
                fill: accent,
                stroke: '#ffffff',
                strokeWidth: 1.8,
                cursor: 'default',
            };
        }

        if (hostCountries.includes(code)) {
            return {
                fill: '#ffffff',
                stroke: '#ffffff',
                strokeWidth: 1.5,
                cursor: 'default',
            };
        }

        return {
            fill: NON_HOST_FILL,
            stroke: 'rgba(255,255,255,0.7)',
            strokeWidth: 1.2,
            cursor: 'default',
        };
    };

    return (
        <div className={`hero-worldmap-wrapper ${className || ''}`} ref={wrapperRef}>
            <div className="hero-worldmap-viewport">
                <div className="hero-worldmap-inner">
                    <WorldMap
                        color="transparent"
                        size="responsive"
                        data={mapData.length > 0 ? mapData : []}
                        styleFunction={styleFunction}
                        tooltipBgColor="#1a1a2e"
                        tooltipTextColor="#e5e7eb"
                        backgroundColor="transparent"
                    />
                </div>
            </div>
        </div>
    );
}
