import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LabelList, Cell } from 'recharts';

/**
 * CostScenarioChart — "what if I…" bar chart for a saved budget.
 *
 * Given the current total, matches, nights and accommodation level,
 * computes the resulting cost for six lightweight scenarios and shows
 * them as bars against the current baseline. All arithmetic is done
 * client-side using the same tournament pricing config the calculator
 * already has — no new API calls.
 *
 * Props:
 *   currentTotalKes  number  — the calculator's current total (in KES)
 *   matchCount       number  — currently selected match count
 *   nights           number  — trip length
 *   accommodation    string  — current accommodation key
 *   pricing          object  — tournament pricing config (accommodation, daily_costs, exchange_rate)
 */
export default function CostScenarioChart({
    currentTotalKes = 0,
    matchCount = 1,
    nights = 7,
    accommodation = '3_star',
    pricing = {},
}) {
    const scenarios = useMemo(() => {
        const exchange = pricing.exchange_rate || 130;
        const accFactors = pricing.accommodation || {
            hostel: 0.4, airbnb: 0.75, '3_star': 1.0, '4_star': 1.6, '5_star': 2.5, resort: 3.5,
        };
        const dailyBase = pricing.daily_costs || { food: 60, transport: 30, misc: 20 };
        const dailyCostKes = ((dailyBase.food || 0) + (dailyBase.transport || 0) + (dailyBase.misc || 0)) * exchange;

        // Rough per-match cost derived from current total ÷ matches; used
        // for the ±match scenarios. Undershoots for knockout swings but
        // is directionally correct without re-running the full calc.
        const perMatchKes = matchCount > 0 ? currentTotalKes * 0.35 / matchCount : 0;

        // Accommodation swap: swap current accommodation factor for
        // hostel/5-star and scale the "accommodation share" of the total.
        // We assume accommodation is ~35% of the current bill (matches
        // the calculator's default weighting well enough).
        const currentFactor = accFactors[accommodation] || 1.0;
        const accShare = currentTotalKes * 0.35;
        const rest = currentTotalKes - accShare;
        const swapAcc = (targetKey) => {
            const target = accFactors[targetKey];
            if (!target || !currentFactor) return currentTotalKes;
            return rest + (accShare * (target / currentFactor));
        };

        const rows = [
            {
                key: 'drop-match',
                label: '−1 match',
                total: Math.max(0, currentTotalKes - perMatchKes),
            },
            {
                key: 'baseline',
                label: 'Current plan',
                total: currentTotalKes,
                isBaseline: true,
            },
            {
                key: 'add-match',
                label: '+1 match',
                total: currentTotalKes + perMatchKes,
            },
            {
                key: 'short',
                label: `${Math.max(1, nights - 2)} nights`,
                total: Math.max(0, currentTotalKes - dailyCostKes * 2),
            },
            {
                key: 'long',
                label: `${nights + 2} nights`,
                total: currentTotalKes + dailyCostKes * 2,
            },
            {
                key: 'downgrade',
                label: 'Hostel',
                total: accommodation !== 'hostel' ? swapAcc('hostel') : currentTotalKes,
            },
            {
                key: 'upgrade',
                label: '5-star',
                total: accommodation !== '5_star' ? swapAcc('5_star') : currentTotalKes,
            },
        ];

        // Sort ascending by total but keep baseline in place so the eye
        // reads "cheaper on the left, pricier on the right".
        return rows.map((r) => ({
            ...r,
            delta: r.total - currentTotalKes,
            deltaPct: currentTotalKes > 0 ? Math.round(((r.total - currentTotalKes) / currentTotalKes) * 100) : 0,
        })).sort((a, b) => a.total - b.total);
    }, [currentTotalKes, matchCount, nights, accommodation, pricing]);

    if (!currentTotalKes) return null;

    return (
        <div className="mt-4 p-3 rounded" style={{ background: 'rgba(20,20,20,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="d-flex align-items-baseline justify-content-between mb-3">
                <div>
                    <h5 className="text-white mb-1"><i className="fas fa-chart-column me-2 text-info"></i>Cost scenarios</h5>
                    <p className="text-white-50 small mb-0">
                        See how your total shifts if you tweak one variable. Baseline is your current plan.
                    </p>
                </div>
            </div>
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                    <BarChart data={scenarios} margin={{ top: 20, right: 12, left: 0, bottom: 8 }}>
                        <XAxis
                            dataKey="label"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tickFormatter={(v) => 'KES ' + Math.round(v / 1000) + 'k'}
                            tick={{ fontSize: 11 }}
                            width={80}
                        />
                        <Tooltip
                            contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value, _n, item) => {
                                const delta = item?.payload?.delta || 0;
                                const pct = item?.payload?.deltaPct || 0;
                                const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
                                return [
                                    'KES ' + Math.round(value).toLocaleString(),
                                    delta === 0 ? 'Current plan' : `${sign}${Math.abs(pct)}% vs current`,
                                ];
                            }}
                        />
                        <ReferenceLine
                            y={currentTotalKes}
                            stroke="rgba(255,255,255,0.35)"
                            strokeDasharray="4 4"
                            label={{ value: 'Current', position: 'right', fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                        />
                        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                            {scenarios.map((s) => (
                                <Cell
                                    key={s.key}
                                    fill={
                                        s.isBaseline ? '#3b82f6' :
                                        s.total < currentTotalKes ? '#10b981' :
                                        '#ef4444'
                                    }
                                />
                            ))}
                            <LabelList
                                dataKey="deltaPct"
                                position="top"
                                fill="rgba(255,255,255,0.85)"
                                fontSize={11}
                                formatter={(v) => v > 0 ? `+${v}%` : v < 0 ? `${v}%` : ''}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="d-flex flex-wrap gap-3 mt-2 text-white-50 small">
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#10b981', marginRight: 6 }} />Saves money</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#3b82f6', marginRight: 6 }} />Current plan</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#ef4444', marginRight: 6 }} />Costs more</span>
            </div>
        </div>
    );
}
