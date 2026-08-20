import React, { useMemo } from 'react';
import WorldMap from 'react-svg-worldmap';

/*
 * Simple full world map for the Hero section.
 * Highlights the tournament's host countries in crimson.
 * No zoom, no animation — all continents always visible.
 */

export default function HeroWorldMap({ tournament, className }) {
    const hostCountries = useMemo(() => {
        return (tournament?.host_flag_codes || []).map(c => c.toLowerCase());
    }, [tournament?.id, tournament?.host_flag_codes]);

    const mapData = useMemo(() => {
        return hostCountries.map(code => ({ country: code, value: 1 }));
    }, [hostCountries]);

    const styleFunction = ({ countryCode }) => {
        const code = (countryCode || '').toLowerCase();
        if (hostCountries.includes(code)) {
            return {
                fill: '#DC143C',
                stroke: 'rgba(255,255,255,0.3)',
                strokeWidth: 0.5,
                cursor: 'default',
            };
        }
        return {
            fill: 'rgba(255,255,255,0.12)',
            stroke: 'rgba(255,255,255,0.08)',
            strokeWidth: 0.3,
            cursor: 'default',
        };
    };

    return (
        <div className={`hero-worldmap-wrapper ${className || ''}`}>
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
