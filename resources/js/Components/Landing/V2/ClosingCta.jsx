import React from 'react';
import { assetPath } from '@/lib/assets';
import LandingAction from '@/Components/Landing/V2/LandingAction';

/** The last call to action on a page (plan C2.10), and on each walkthrough. */
export default function ClosingCta({ title, text, primary, secondary, image = '/assets/img/backdrops/night-stadium.jpg', tournamentId }) {
    return (
        <section className="container v2-closing-wrap">
            <div className="v2-closing" style={{ '--v2-card-image': `url(${assetPath(image)})` }}>
                <h2 className="v2-closing__title">{title}</h2>
                {text && <p className="v2-closing__text">{text}</p>}
                <div className="v2-closing__ctas">
                    {primary && <LandingAction {...primary} filled tournamentId={tournamentId} />}
                    {secondary && <LandingAction {...secondary} tournamentId={tournamentId} />}
                </div>
            </div>
        </section>
    );
}
