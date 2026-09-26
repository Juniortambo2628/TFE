import React from 'react';
// Self-contained: the partner dashboard does not load the admin stylesheet,
// and a preview that only looks right on one surface is not a shared one.
import '../../../css/admin-hub-preview.css';

/**
 * Live-preview pane for a partner hub. Reads directly from an edit form's
 * state and mirrors the essential visual pieces of PartnerHub.jsx — hero +
 * stats band + about + service tags — so the editor sees their changes land
 * without saving and navigating.
 *
 * Used by BOTH `/admin/partners/{user}` and the partner's own
 * `/partner/profile` (Sprint 53) — it moved out of Components/Admin for that
 * second caller.
 *
 * `service_tags` and `stats_text` are accepted as newline-separated text
 * (what the admin form edits) or as a ready array, since the partner form
 * edits its tags as a comma-separated line.
 *
 * Not a byte-perfect mirror; skipping listings + "how we support" +
 * "how it works" since those don't depend on the edited fields.
 */
export default function HubPreview({ data, partnerName, isVerified, partnerTypeLabel }) {
    const accent = data.theme_accent || '#dc143c';
    const displayName = data.display_name || partnerName || 'Partner name';
    const tagline = data.tagline || 'Tagline appears here.';
    const about = data.about;
    const heroImage = data.hero_image;

    const stats = parseStats(data.stats_text);
    const serviceTags = linesToArray(data.service_tags);

    const heroBg = heroImage
        ? `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%), url(${heroImage})`
        : `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.9) 100%)`;

    return (
        <div className="hub-preview" style={{ '--partner-accent': accent }}>
            <div className="hub-preview__label">
                <i className="fas fa-eye"></i>
                Live preview of /partners/{data.slug || 'slug'}
            </div>

            <div
                className="hub-preview__hero"
                style={{ backgroundImage: heroBg, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="hub-preview__hero-inner">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        {data.logo_url && (
                            <img src={data.logo_url} alt={displayName} className="hub-preview__logo" />
                        )}
                        <div>
                            <div className="hub-preview__eyebrow">
                                Official {partnerTypeLabel || 'Partner'}
                            </div>
                            <h4 className="hub-preview__name">{displayName}</h4>
                        </div>
                        {isVerified && (
                            <span className="hub-preview__verified ms-auto">
                                <i className="fas fa-check-circle"></i>
                                Verified
                            </span>
                        )}
                    </div>
                    <p className="hub-preview__tagline">{tagline}</p>
                </div>
            </div>

            {stats.length > 0 && (
                <div className="hub-preview__stats">
                    {stats.map((s, i) => (
                        <div key={i} className="hub-preview__stat">
                            <div className="hub-preview__stat-value">{s.value}</div>
                            <div className="hub-preview__stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {about && (
                <div className="hub-preview__about">
                    <div className="hub-preview__section-label">About</div>
                    <p>{about}</p>
                </div>
            )}

            {serviceTags.length > 0 && (
                <div className="hub-preview__tags">
                    <div className="hub-preview__section-label">What we offer</div>
                    <div className="hub-preview__tag-row">
                        {serviceTags.map((t, i) => (
                            <span key={i} className="hub-preview__tag">{t}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function linesToArray(text) {
    if (Array.isArray(text)) return text.filter(Boolean);
    return (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

function parseStats(text) {
    if (Array.isArray(text)) return text.filter((s) => s && s.label && s.value);

    return (text || '').split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
            const [label, value] = l.split('|').map((s) => (s || '').trim());
            return { label, value };
        })
        .filter((s) => s.label && s.value);
}
