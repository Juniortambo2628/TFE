import React from 'react';

/**
 * A fan's trip, start to finish (plan C2.4). Each step opens the explorer on
 * the area that does it, so "how it works" and "what it looks like" are one
 * click apart.
 */
export default function FanJourney({ journey, onOpenArea }) {
    return (
        <section id="journey" className="v2-section">
            <div className="container">
                <div className="v2-head">
                    <p className="v2-eyebrow">{journey.eyebrow}</p>
                    <h2 className="v2-head__title">{journey.title}</h2>
                    <p className="v2-head__text">{journey.text}</p>
                </div>
                <ol className="v2-journey">
                    {journey.steps.map((step, i) => (
                        <li key={i} className="v2-journey__step">
                            <span className="v2-journey__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                            <h3 className="v2-journey__title">{step.title}</h3>
                            <p className="v2-journey__text">{step.text}</p>
                            <button type="button" className="v2-journey__link" onClick={() => onOpenArea(step.area)}>
                                {step.link_label} <i className="fas fa-arrow-right" aria-hidden="true"></i>
                            </button>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
