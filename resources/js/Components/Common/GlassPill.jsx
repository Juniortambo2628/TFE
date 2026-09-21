import '../../../css/glass-pill.css';

/**
 * GlassPill — shared neutral (no-colour) glass pill.
 *
 * Renders as a <span> by default; pass `as="a"` / `as="button"` for an
 * interactive pill (adds the hover treatment). Size via `size="sm"|"lg"`.
 * Reused for hero host-country badges, tournament card status/hosts and
 * pill CTAs so the frosted style stays identical everywhere.
 */
export default function GlassPill({
    as: Tag = 'span',
    size,
    interactive,
    className = '',
    children,
    ...props
}) {
    const isInteractive = interactive || Tag === 'a' || Tag === 'button';
    const classes = [
        'tfe-glass-pill',
        size ? `tfe-glass-pill--${size}` : '',
        isInteractive ? 'tfe-glass-pill--interactive' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Tag className={classes} {...props}>
            {children}
        </Tag>
    );
}
