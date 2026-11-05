import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * Partner categories (plan C2.7). Each lists its partner types, linking to the
 * directory filtered to that type, with how many public partners it has. A
 * type with none still shows (so a prospective partner sees where they would
 * fit) but is not a link to an empty page.
 */
export default function PartnerCategories({ partners, counts = {}, typeLabels = {} }) {
    return (
        <section id="partners" className="v2-section">
            <div className="container">
                <div className="v2-head v2-head--row">
                    <div>
                        <p className="v2-eyebrow">{partners.eyebrow}</p>
                        <h2 className="v2-head__title">{partners.title}</h2>
                        <p className="v2-head__text">{partners.text}</p>
                    </div>
                    <div className="v2-head__actions">
                        <Link href={route('partners.index')} className="tfe-btn">{partners.directory_label}</Link>
                        <Link href={route('walkthrough', 'partners')} className="tfe-btn tfe-btn--filled">{partners.cta_label}</Link>
                    </div>
                </div>

                <div className="v2-partners">
                    {partners.categories.map((c) => (
                        <article key={c.id} className="v2-partner-cat">
                            <span className="v2-partner-cat__icon" aria-hidden="true"><i className={c.icon}></i></span>
                            <h3 className="v2-partner-cat__title">{c.label}</h3>
                            <p className="v2-partner-cat__text">{c.text}</p>
                            <ul className="v2-partner-cat__types">
                                {c.types.map((t) => {
                                    const n = counts[t] || 0;
                                    const label = typeLabels[t] || t;
                                    return (
                                        <li key={t}>
                                            {n > 0 ? (
                                                <Link href={`${route('partners.index')}?type=${encodeURIComponent(t)}`} className="v2-type-chip">
                                                    {label} <span className="v2-type-chip__n">{n}</span>
                                                </Link>
                                            ) : (
                                                <span className="v2-type-chip v2-type-chip--empty">{label}</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
