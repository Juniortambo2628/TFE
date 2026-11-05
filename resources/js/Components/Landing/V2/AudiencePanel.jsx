import React from 'react';
import { Link } from '@inertiajs/react';
import { assetPath } from '@/lib/assets';

/**
 * The panel under the hero (Najenga's HeroPanel shape): what TFE is, and one
 * card per audience, each leading to that audience's walkthrough page.
 */
export default function AudiencePanel({ about, audiences = [] }) {
    return (
        <div className="container v2-panel-wrap">
            <div className="v2-panel">
                <div className="v2-panel__about">
                    <p className="v2-eyebrow">{about.eyebrow}</p>
                    <h2 className="v2-panel__title">{about.title}</h2>
                    <p className="v2-panel__text">{about.text}</p>
                </div>
                {audiences.map((a) => (
                    <Link
                        key={a.id}
                        href={route('walkthrough', a.id)}
                        className="v2-audience"
                        style={a.image ? { '--v2-card-image': `url(${assetPath(a.image)})` } : undefined}
                    >
                        <span className="v2-audience__icon" aria-hidden="true"><i className={a.icon}></i></span>
                        <span className="v2-audience__title">{a.title}</span>
                        <span className="v2-audience__text">{a.text}</span>
                        <span className="v2-audience__link">
                            {a.link_label} <i className="fas fa-arrow-right" aria-hidden="true"></i>
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
