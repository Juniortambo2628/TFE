import React from 'react';
import { formatMoney } from '@/lib/utils';

/**
 * What the fan has chosen so far, pinned above the wizard (Sprint 69).
 * Five steps is a long way to carry choices in your head; each fact is a
 * button back to the step that set it.
 */
export default function CalculatorRecap({ packageName, matchCount, quickEstimate, nights, travellers, estimate, currency, onJump }) {
    const facts = [
        packageName && { step: 0, icon: 'fas fa-gift', text: packageName },
        { step: 2, icon: 'fas fa-futbol', text: quickEstimate ? `~${matchCount} matches` : `${matchCount} match${matchCount === 1 ? '' : 'es'}` },
        { step: 3, icon: 'fas fa-moon', text: `${nights} night${nights === 1 ? '' : 's'}` },
        { step: 3, icon: 'fas fa-user-friends', text: `${travellers} traveller${travellers === 1 ? '' : 's'}` },
    ].filter(Boolean);

    return (
        <div className="calc-recap" aria-label="Your choices so far">
            <ul className="calc-recap__facts">
                {facts.map((f) => (
                    <li key={f.icon}>
                        <button type="button" className="calc-recap__fact" onClick={() => onJump(f.step)}>
                            <i className={f.icon} aria-hidden="true"></i>{f.text}
                        </button>
                    </li>
                ))}
            </ul>
            {estimate > 0 && (
                <div className="calc-recap__total">
                    <span>Last estimate</span>
                    <strong>{formatMoney(estimate, currency)}</strong>
                </div>
            )}
        </div>
    );
}
