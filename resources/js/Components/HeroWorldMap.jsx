import React, { useMemo, useEffect, useRef } from 'react';
import WorldMap from 'react-svg-worldmap';

/*
 * Full world map for the Hero section.
 * White countries with grey borders on dark background.
 * Host countries highlighted slightly brighter.
 */

export default function HeroWorldMap({ tournament, className }) {
    const wrapperRef = useRef(null);

    const hostCountries = useMemo(() => {
        return (tournament?.host_flag_codes || []).map(c => c.toLowerCase());
    }, [tournament?.id, tournament?.host_flag_codes]);

    const mapData = useMemo(() => {
        return hostCountries.map(code => ({ country: code, value: 1 }));
    }, [hostCountries]);

    /* Suppress browser native tooltip (the library has its own) */
    useEffect(() => {
        if (!wrapperRef.current) return;
        wrapperRef.current.querySelectorAll('svg title').forEach(t => t.remove());
        const svg = wrapperRef.current.querySelector('svg');
        if (svg) {
            svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        }
    });

    const styleFunction = ({ countryCode }) => {
        const code = (countryCode || '').toLowerCase();
        if (hostCountries.includes(code)) {
            return {
                fill: '#ffffff',
                stroke: 'rgba(150,150,150,0.5)',
                strokeWidth: 0.5,
                cursor: 'default',
            };
        }
        return {
            fill: 'rgba(255,255,255,0.85)',
            stroke: 'rgba(150,150,150,0.3)',
            strokeWidth: 0.3,
            cursor: 'default',
        };
    };

    return (
        <div className={`hero-worldmap-wrapper ${className || ''}`} ref={wrapperRef}>
            <div className="hero-worldmap-viewport">
                <div className="hero-worldmap-inner">
                    <WorldMap
                        color="rgba(255,255,255,0.12)"
                        size="responsive"
                        data={mapData.length > 0 ? mapData : []}
                        styleFunction={styleFunction}
                        tooltipBgColor="#1a1a2e"
                        tooltipTextColor="#e5e7eb"
                        strokeOpacity={0.15}
                        backgroundColor="transparent"
                    />
                </div>
            </div>
        </div>
    );
}
