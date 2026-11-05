import React from 'react';
import { factRows } from '@/lib/landingV2';
import { formatNumber } from '@/lib/utils';

/** Real counts from the server (HomeController::landingFacts), never typed in. */
export default function FactsStrip({ facts, labels }) {
    const rows = factRows(facts, labels);
    if (rows.length === 0) return null;

    return (
        <section className="container v2-facts" aria-label="TFE in numbers">
            <dl className={`v2-facts__grid v2-facts__grid--${rows.length}`}>
                {rows.map((r) => (
                    <div key={r.key} className="v2-facts__item">
                        <dt>{r.label}</dt>
                        <dd>{formatNumber(r.value)}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
