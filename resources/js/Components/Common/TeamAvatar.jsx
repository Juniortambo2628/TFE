import React, { useEffect, useState } from 'react';
import { flagAccent, cachedFlagAccent } from '@/lib/flagAccent';

/**
 * TeamAvatar — a fan's picture, ringed in the colours of the team they
 * support, with their flag as a badge (Sprint 54).
 *
 * This replaced the Ready Player Me 3D avatar. On a football platform the
 * thing that says who you are is the team you back, which the profile already
 * stores (`users.team_support`) — so the identity signal rides on the frame
 * rather than on a generic 3D humanoid, at no third-party dependency and a
 * fraction of the page weight.
 *
 * The ring colour is read from the flag artwork itself (see lib/flagAccent),
 * not from a hand-written colour table. Until it resolves — and for a fan who
 * supports nobody — the ring stays neutral, which is a perfectly good avatar.
 *
 * @param {string}  src        Photo URL. Falls back to the name's initial.
 * @param {string}  name       Used for the initial and the alt text.
 * @param {string}  team       Team name, for the title/aria description.
 * @param {string}  teamFlag   Flag URL — the accent is sampled from this.
 * @param {number}  size       Pixel diameter (default 96).
 * @param {boolean} showFlag   Render the small flag badge (default true).
 * @param {string}  accent     Override the derived colour.
 */
export default function TeamAvatar({
    src,
    name = '',
    team,
    teamFlag,
    size = 96,
    showFlag = true,
    accent,
    className = '',
}) {
    // Paint a cached colour on the very first render so a revisit does not
    // flash a neutral ring before settling.
    const [derived, setDerived] = useState(() => accent || cachedFlagAccent(teamFlag));

    useEffect(() => {
        if (accent) { setDerived(accent); return undefined; }
        if (!teamFlag) { setDerived(null); return undefined; }

        let alive = true;
        flagAccent(teamFlag).then((c) => { if (alive) setDerived(c); });
        return () => { alive = false; };
    }, [teamFlag, accent]);

    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    const ring = derived || 'rgb(255 255 255 / 18%)';
    const label = team ? `${name || 'Fan'} — supports ${team}` : (name || 'Fan');

    return (
        <div
            className={`tfe-team-avatar${derived ? ' is-framed' : ''} ${className}`.trim()}
            style={{ '--team-accent': ring, '--avatar-size': `${size}px` }}
            title={label}
        >
            <div className="tfe-team-avatar__ring">
                {src
                    ? <img className="tfe-team-avatar__img" src={src} alt={name ? `${name}'s avatar` : ''} />
                    : <span className="tfe-team-avatar__initial" aria-hidden="true">{initial}</span>}
            </div>

            {showFlag && teamFlag && (
                <img
                    className="tfe-team-avatar__flag"
                    src={teamFlag}
                    alt=""
                    aria-hidden="true"
                />
            )}

            {/* The ring and badge are decoration; the description is the
                accessible part, so a screen reader gets "supports Kenya"
                rather than an unlabelled image. */}
            <span className="sr-only">{label}</span>
        </div>
    );
}
