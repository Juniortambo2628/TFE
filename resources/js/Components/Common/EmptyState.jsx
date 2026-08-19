import React from 'react';

/**
 * Reusable empty state component.
 *
 * @param {string} icon - FontAwesome icon class (e.g. "fas fa-inbox")
 * @param {string} title - Heading text
 * @param {string} message - Description text
 * @param {React.ReactNode} action - Optional CTA button/link
 * @param {string} variant - "admin" | "fan" | "inline" | "partner" (default: "fan")
 * @param {string} className - Additional CSS classes
 */
export default function EmptyState({
    icon = 'fas fa-inbox',
    title,
    message,
    action = null,
    variant = 'fan',
    className = '',
}) {
    const variantClass = {
        admin: 'admin-empty-state',
        fan: 'empty-state',
        inline: 'empty-state-inline',
        partner: 'dash-empty',
    }[variant] || 'empty-state';

    return (
        <div className={`${variantClass} ${className}`}>
            {icon && <i className={icon}></i>}
            {title && <h4>{title}</h4>}
            {message && <p>{message}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
