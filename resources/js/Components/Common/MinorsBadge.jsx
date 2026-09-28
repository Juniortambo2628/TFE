import React from 'react';

/**
 * MinorsBadge — the ONE way a surface says that minors are travelling.
 *
 * TFE holds no pupil data: a school declares that its own parental-consent
 * and safeguarding channels were followed, and TFE records that warranty.
 * But one duty does not transfer with it — if TFE knows minors are on a
 * request and does not tell the partner, that is TFE's failure, not the
 * school's.
 *
 * So this is a component reading a structural field, never a sentence typed
 * into a notes box. A note is something nobody is obliged to read; a badge
 * on the row, the brief and the quote is not.
 *
 * Renders nothing when no minors are involved — an ordinary fan's trip must
 * not carry an "0 minors" chip, which is noise that trains people to ignore
 * the badge that matters.
 */
export default function MinorsBadge({ group, compact = false }) {
    if (!group?.involves_minors) return null;

    return (
        <span className="tfe-pill tfe-pill--minors" title={group.party_summary}>
            <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
            <strong>MINORS INVOLVED</strong>
            {!compact && group.party_summary && (
                <span className="tfe-pill__sub">{group.party_summary}</span>
            )}
        </span>
    );
}

/**
 * The full declaration block for a brief's detail view: who warranted it,
 * how to reach them, and when.
 *
 * The contact is deliberately prominent. Its whole purpose is to be usable
 * two years later when someone asks what was agreed and by whom.
 */
export function SchoolDeclarationPanel({ group }) {
    if (!group) return null;

    return (
        <div className="tfe-slab mb-4">
            <div className="tfe-slab__header">
                <div className="tfe-slab__title">
                    School group — {group.school_name}
                </div>
                <MinorsBadge group={group} compact />
            </div>
            <div className="tfe-slab__body">
                <div className="tfe-form-grid tfe-form-grid--2">
                    <Fact label="Travelling party" value={group.party_summary} />
                    <Fact label="Declared by" value={`${group.official_name} · ${group.official_role}`} />
                    <Fact label="School contact" value={group.official_email} />
                    {group.official_phone && <Fact label="Phone" value={group.official_phone} />}
                    <Fact label="Declared at" value={group.declared_at || 'Not yet declared'} />
                </div>

                {/* An incomplete declaration must not read as though a school
                    has stood behind the trip. One box ticked is not a partial
                    warranty — it is not a warranty. */}
                {group.is_complete ? (
                    <p className="tfe-form-help mt-3">
                        The school confirms its own parental-consent and safeguarding channels were
                        followed for every traveller, and that this information is accurate.
                    </p>
                ) : (
                    <p className="tfe-form-error mt-3">
                        This declaration is incomplete — the school has not yet confirmed both
                        its consent channels and the accuracy of this information.
                    </p>
                )}

                {group.notes && <p className="tfe-form-help mt-2">{group.notes}</p>}
            </div>
        </div>
    );
}

function Fact({ label, value }) {
    return (
        <div className="tfe-form-field">
            <span className="tfe-form-label">{label}</span>
            <strong className="text-white">{value}</strong>
        </div>
    );
}
