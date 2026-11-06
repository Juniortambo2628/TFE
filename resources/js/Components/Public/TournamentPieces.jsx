import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AccentCard from '@/Components/Common/AccentCard';
import GlassPill from '@/Components/Common/GlassPill';
import CapacityBar from '@/Components/Common/CapacityBar';
import { TEAM_NAMES } from '@/Data/countryFlags';
import { formatMoney } from '@/lib/utils';
import assetPath from '@/lib/assets';
import '../../../css/tournament-page.css';

// ── Past-tournament highlights: champion, runner-up, top scorer, POTT ──
export function Highlights({ t }) {
    const cards = [
        t.winner && { icon: 'fas fa-trophy', label: 'Champions', value: t.winner, tone: 'gold' },
        t.runner_up && { icon: 'fas fa-medal', label: 'Runners-up', value: t.runner_up, tone: 'silver' },
        t.top_scorer && t.top_scorer.name && {
            icon: 'fas fa-futbol', label: 'Top scorer',
            value: t.top_scorer.name + (t.top_scorer.goals ? ` · ${t.top_scorer.goals} goals` : ''),
        },
        t.player_of_tournament && { icon: 'fas fa-star', label: 'Player of the tournament', value: t.player_of_tournament },
    ].filter(Boolean);

    if (cards.length === 0) return null;

    return (
        <section className="tourpage-block">
            <h2 className="tourpage-block__title">Tournament highlights</h2>
            <div className="tourpage-highlights">
                {cards.map((c, i) => (
                    <div key={i} className={'tourpage-highlight' + (c.tone ? ` tourpage-highlight--${c.tone}` : '')}>
                        <span className="tourpage-highlight__icon"><i className={c.icon} /></span>
                        <div>
                            <div className="tourpage-highlight__label">{c.label}</div>
                            <div className="tourpage-highlight__value">{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Participating / qualified teams (flags) ──
export function TeamsGrid({ title, codes = [], baseUrl, wikiFlags }) {
    if (!codes.length) return null;
    return (
        <section className="tourpage-block">
            <h2 className="tourpage-block__title">{title} <span className="tourpage-block__count">{codes.length}</span></h2>
            <div className="tourpage-teams">
                {codes.map((code) => {
                    const name = TEAM_NAMES[code] || code.toUpperCase();
                    return (
                        <span key={code} className="tourpage-team" title={name}>
                            <img
                                src={assetPath(`${baseUrl}assets/Flags/${code}.png`)}
                                alt={name}
                                loading="lazy"
                                onError={(e) => { if (wikiFlags[code]) { e.currentTarget.src = wikiFlags[code]; } else { e.currentTarget.style.visibility = 'hidden'; } }}
                            />
                            <span className="tourpage-team__name">{name}</span>
                        </span>
                    );
                })}
            </div>
        </section>
    );
}
