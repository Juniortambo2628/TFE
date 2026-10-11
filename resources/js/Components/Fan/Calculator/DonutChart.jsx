import React from 'react';

const COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a'];

/** The results donut — plain SVG, no chart library. */
export default function DonutChart({ data }) {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (!total) return null;
    let angleAt = 0;

    return (
        <div className="budget-chart-container">
            <svg viewBox="0 0 100 100" className="donut-chart" role="img" aria-label="Cost breakdown">
                {data.map((item, i) => {
                    const angle = (item.value / total) * 360;
                    const point = (deg) => [
                        50 + 40 * Math.cos(((deg - 90) * Math.PI) / 180),
                        50 + 40 * Math.sin(((deg - 90) * Math.PI) / 180),
                    ];
                    const [x1, y1] = point(angleAt);
                    angleAt += angle;
                    const [x2, y2] = point(angleAt);
                    const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
                    return <path key={item.label} d={d} fill={COLORS[i % COLORS.length]} stroke="#111" strokeWidth="1" />;
                })}
                <circle cx="50" cy="50" r="25" fill="#111" />
            </svg>
            <div className="chart-legend">
                {data.map((item, i) => (
                    <div key={item.label} className="legend-item">
                        <span className="legend-color" style={{ '--legend-color': COLORS[i % COLORS.length] }}></span>
                        <span className="legend-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
