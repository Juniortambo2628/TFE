import React from 'react';

/**
 * FAQ (plan C2.9). Native <details>, so it works without JavaScript, opens
 * with the keyboard, and the browser's find-in-page reaches the answers.
 */
export default function Faq({ faq }) {
    return (
        <section id="faq" className="v2-section">
            <div className="container v2-faq">
                <div className="v2-head">
                    <p className="v2-eyebrow">{faq.eyebrow}</p>
                    <h2 className="v2-head__title">{faq.title}</h2>
                </div>
                <div className="v2-faq__list">
                    {faq.items.map((item) => (
                        <details key={item.q} className="v2-faq__item">
                            <summary className="v2-faq__q">
                                <span>{item.q}</span>
                                <i className="fas fa-plus" aria-hidden="true"></i>
                            </summary>
                            <p className="v2-faq__a">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
