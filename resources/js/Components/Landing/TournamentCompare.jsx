import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { useTournament } from '@/Context/TournamentContext';
import AccentCard from '@/Components/Common/AccentCard';
import '../../../css/tournament-compare.css';

/**
 * TournamentCompare — Landing-page widget.
 *
 * Renders a moodboard-style bento grid comparing every tournament we
 * support: hosts, dates, length and status, with the tournament's trophy
 * as card artwork. Each card links to /?tournament=<slug> so switching
 * context re-renders the whole site (via ResolveTournament middleware).
 *
 * The call to action is status-aware — a concluded tournament reads
 * "View recap", never "Plan for this".
 */

// Per-tournament accent so each card's trophy wash feels on-brand.
const ACCENT_BY_ID = {
    wc_2026: '#d4af37',
    euro_2024: '#3b82f6',
    afcon_2027: '#16a34a',
};

export default function TournamentCompare() {
    const { tournamentList = [], tournament: active } = useTournament();
    const { assetUrl } = usePage().props;
    const baseUrl = assetUrl || '';

    const rows = useMemo(() => {
        return (tournamentList || []).map((t) => {
            const days = t.start_date && t.end_date
                ? Math.max(1, Math.round((new Date(t.end_date) - new Date(t.start_date)) / (1000 * 60 * 60 * 24)))
                : null;

            return {
                ...t,
                days,
                isActive: active && active.id === t.id,
                statusBadge: statusColor(t.status),
                cta: ctaFor(t.status, active && active.id === t.id),
                accent: ACCENT_BY_ID[t.id] || '#dc143c',
            };
        });
    }, [tournamentList, active]);

    if (rows.length <= 1) {
        return null; // nothing to compare
    }

    return (
        <section id="compare-tournaments" className="tc-section">
            <div className="container">
                <div className="text-center">
                    <span className="tc-eyebrow">Not sure which one?</span>
                    <h2 className="tc-heading">Compare tournaments</h2>
                    <p className="tc-sub">
                        Every tournament we support at a glance — hosts, dates and length. Tap one to switch the whole site into that context and start planning.
                    </p>
                </div>

                <div className="tc-grid">
                    {rows.map((t) => (
                        <AccentCard
                            key={t.id}
                            href={`/?tournament=${t.slug || t.id}`}
                            accent={t.accent}
                            active={t.isActive}
                            aria-label={`${t.name} — ${t.cta.label}`}
                            artwork={t.trophy_image ? { src: baseUrl + t.trophy_image } : undefined}
                            status={t.status}
                            title={t.name}
                            pills={t.hosts || []}
                            meta={[
                                { label: 'Dates', value: `${shortDate(t.start_date)} → ${shortDate(t.end_date)}` },
                                { label: 'Length', value: t.days ? `${t.days} days` : '—' },
                            ]}
                            cta={{ label: t.cta.label, icon: t.isActive ? null : 'fas fa-arrow-right' }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ctaFor(status, isActive) {
    if (isActive) return { label: 'Currently viewing', color: '#ef4050' };
    switch (status) {
        case 'concluded': return { label: 'View recap', color: '#d4af37' };
        case 'ongoing': return { label: 'Follow live', color: '#10b981' };
        case 'upcoming':
        default: return { label: 'Plan for this', color: '#60a5fa' };
    }
}

function statusColor(status) {
    switch (status) {
        case 'ongoing': return { bg: 'rgba(16,185,129,0.20)', fg: '#10b981' };
        case 'upcoming': return { bg: 'rgba(59,130,246,0.20)', fg: '#60a5fa' };
        case 'concluded': return { bg: 'rgba(163,163,163,0.18)', fg: '#c7c7c7' };
        default: return { bg: 'rgba(255,255,255,0.10)', fg: '#fff' };
    }
}

function shortDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch (e) {
        return iso;
    }
}
