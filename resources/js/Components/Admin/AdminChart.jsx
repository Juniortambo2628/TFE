import React, { useId } from 'react';
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatNumber } from '@/lib/utils';

/**
 * The admin's two charts (dashboard bars, analytics area), drawn with
 * Recharts directly. They were Tremor, which needs Tailwind 3 and builds
 * its colour classes at runtime; Recharts is what Tremor drew with
 * underneath, so the look is kept: horizontal gridlines only, no axis
 * lines, white ticks, the house tooltip (kit migration, decision 5).
 *
 * Colours are the v3 values Tremor used (emerald-500, cyan-500).
 */
export const CHART_COLOURS = { emerald: '#10b981', cyan: '#06b6d4' };

// Not `formatNumber` itself: Recharts calls a tick formatter with (value,
// index), and formatNumber's second argument is the fraction digits.
const fmt = (n) => formatNumber(n);

const TICK = { fill: '#ffffff', fontSize: 12 };
const GRID = 'rgba(255,255,255,0.08)';

function ChartTooltip({ active, payload, label, valueFormatter }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="admin-chart__tooltip">
            <p className="admin-chart__tooltip-label">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="admin-chart__tooltip-item">
                    <span className="admin-chart__dot" style={{ background: p.color }} />
                    {p.name} <strong>{valueFormatter(p.value)}</strong>
                </p>
            ))}
        </div>
    );
}

function axes(index, yAxisWidth, valueFormatter, cursor) {
    return [
        <CartesianGrid key="g" vertical={false} stroke={GRID} />,
        <XAxis key="x" dataKey={index} tick={TICK} axisLine={false} tickLine={false} tickMargin={8} minTickGap={8} />,
        <YAxis key="y" width={yAxisWidth} tick={TICK} axisLine={false} tickLine={false} tickFormatter={valueFormatter} allowDecimals={false} />,
        <Tooltip
            key="t"
            cursor={cursor}
            content={<ChartTooltip valueFormatter={valueFormatter} />}
        />,
    ];
}

/** `data` rows keyed by `index` (x) and `category` (the one series). */
export function AdminBarChart({ data, index, category, colour = 'emerald', valueFormatter = fmt, yAxisWidth = 48, className = 'h-64' }) {
    const fill = CHART_COLOURS[colour] || colour;
    return (
        <div className={`admin-chart ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    {axes(index, yAxisWidth, valueFormatter, { fill: 'rgba(255,255,255,0.05)' })}
                    <Bar dataKey={category} name={category} fill={fill} isAnimationActive />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function AdminAreaChart({ data, index, category, colour = 'cyan', valueFormatter = fmt, yAxisWidth = 40, className = 'h-64' }) {
    const stroke = CHART_COLOURS[colour] || colour;
    const id = `admin-area-${useId().replace(/:/g, '')}`;
    return (
        <div className={`admin-chart ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={stroke} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    {axes(index, yAxisWidth, valueFormatter, { stroke: 'rgba(255,255,255,0.25)' })}
                    <Area type="monotone" dataKey={category} name={category} stroke={stroke} strokeWidth={2} fill={`url(#${id})`} dot={false} isAnimationActive />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
