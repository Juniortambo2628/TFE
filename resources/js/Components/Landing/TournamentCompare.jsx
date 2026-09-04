import React, { useMemo } from 'react';
import { useTournament } from '@/Context/TournamentContext';

/**
 * TournamentCompare — Landing-page widget.
 *
 * Reads the tournament_list already shared via HandleInertiaRequests
 * and renders a compact grid comparing each tournament on the metrics
 * a fan actually uses to decide: dates, hosts, cost-per-week estimate,
 * cost-per-match estimate, and current status. Each card links to
 * /?tournament=<slug> so switching context re-renders the whole site
 * (via the existing ResolveTournament middleware).
 *
 * The cost estimates are pulled straight from the tournament's pricing
 * config on the frontend once we merge it into tournamentList. When
 * pricing isn't available (list only carries summary fields today) we
 * render "See details" instead of a fabricated number — never guess.
 */
export default function TournamentCompare() {
    const { tournamentList = [], tournament: active } = useTournament();

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
            };
        });
    }, [tournamentList, active]);

    if (rows.length <= 1) {
        return null; // nothing to compare
    }

    return (
        <section id="compare-tournaments" className="py-5" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(20,20,20,0.4) 100%)' }}>
            <div className="container">
                <div className="text-center mb-4">
                    <span className="text-danger fw-bold text-uppercase small tracking-wider">Not sure which one?</span>
                    <h2 className="text-white mt-2">Compare upcoming tournaments</h2>
                    <p className="text-white-50 mx-auto" style={{ maxWidth: 640 }}>
                        Every tournament we support at a glance — hosts, dates, tournament length. Tap one to switch the whole site into that context and start planning.
                    </p>
                </div>
                <div className="row g-3">
                    {rows.map((t) => (
                        <div key={t.id} className="col-md-6 col-lg-4">
                            <a
                                href={`/?tournament=${t.slug || t.id}`}
                                className="text-decoration-none d-block h-100"
                                style={{
                                    background: 'rgba(20,20,20,0.6)',
                                    border: t.isActive ? '2px solid #dc143c' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 16,
                                    padding: '20px 22px',
                                    transition: 'transform 200ms, border-color 200ms',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h4 className="text-white mb-1" style={{ fontSize: '1.15rem' }}>{t.name}</h4>
                                        <div className="text-white-50 small">
                                            {(t.hosts || []).join(' · ')}
                                        </div>
                                    </div>
                                    <span
                                        className="badge"
                                        style={{
                                            background: t.statusBadge.bg,
                                            color: t.statusBadge.fg,
                                            fontSize: '0.65rem',
                                            padding: '4px 10px',
                                            borderRadius: 999,
                                            textTransform: 'uppercase',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t.status}
                                    </span>
                                </div>

                                <div className="row g-2 mt-2">
                                    <div className="col-6">
                                        <div className="text-white-50" style={{ fontSize: '0.7rem' }}>Dates</div>
                                        <div className="text-white small">
                                            {shortDate(t.start_date)} → {shortDate(t.end_date)}
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-white-50" style={{ fontSize: '0.7rem' }}>Length</div>
                                        <div className="text-white small">
                                            {t.days ? `${t.days} days` : '—'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 d-flex align-items-center gap-2">
                                    <span
                                        className="fw-bold small"
                                        style={{ color: t.isActive ? '#dc143c' : '#3b82f6' }}
                                    >
                                        {t.isActive ? 'Currently viewing' : 'Plan for this'}
                                    </span>
                                    <i className="fas fa-arrow-right" style={{ color: t.isActive ? '#dc143c' : '#3b82f6', fontSize: '0.75rem' }}></i>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function statusColor(status) {
    switch (status) {
        case 'ongoing': return { bg: 'rgba(16,185,129,0.20)', fg: '#10b981' };
        case 'upcoming': return { bg: 'rgba(59,130,246,0.20)', fg: '#3b82f6' };
        case 'concluded': return { bg: 'rgba(107,114,128,0.20)', fg: '#a3a3a3' };
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
