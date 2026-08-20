import React, { useMemo, useEffect, useRef } from 'react';
import WorldMap from 'react-svg-worldmap';

/*
 * Full world map for the Hero section.
 * Non-host countries: frosted glass (blurred fill, white borders).
 * Host countries: solid white, sharp.
 */

export default function HeroWorldMap({ tournament, className }) {
    const wrapperRef = useRef(null);

    const hostCountries = useMemo(() => {
        return (tournament?.host_flag_codes || []).map(c => c.toLowerCase());
    }, [tournament?.id, tournament?.host_flag_codes]);

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

        /* Apply blur filter to non-host country paths */
        svg.querySelectorAll('path').forEach(path => {
            const style = path.getAttribute('style') || '';
            const isHost = style.includes('#ffffff');
            if (!isHost) {
                path.setAttribute('filter', 'url(#hero-country-blur)');
            }
        });
    });

    const styleFunction = ({ countryCode }) => {
        const code = (countryCode || '').toLowerCase();
        if (hostCountries.includes(code)) {
            return {
                fill: '#ffffff',
                stroke: '#ffffff',
                strokeWidth: 1.5,
                cursor: 'default',
            };
        }
        return {
            fill: 'rgba(255,255,255,0.15)',
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
