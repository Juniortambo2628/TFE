import React from 'react';

/** A count pill for new activity. Capped at 99+ so it never outgrows the row. */
export default function ActivityBadge({ count, label }) {
    return (
        <span className="tfe-activity-badge" aria-label={`${count} new in ${label}`}>
            {count > 99 ? '99+' : count}
        </span>
    );
}
