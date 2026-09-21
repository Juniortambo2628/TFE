import GlassPill from '@/Components/Common/GlassPill';
import '../../../css/accent-card.css';

/**
 * AccentCard — the shared tournament-style card used on the landing
 * tournament compare grid and across the partners pages.
 *
 * Props:
 *  - href, LinkComponent (default 'a' — pass Inertia's Link for SPA nav)
 *  - accent: brand colour driving the wash + active ring
 *  - active: emphasised ring (e.g. the currently-viewed tournament)
 *  - artwork: { src, alt?, variant?: 'float'|'thumb' } floating image
 *  - status: string → glass pill top-left
 *  - eyebrow: small muted label above the title
 *  - title, desc
 *  - pills: string[] → glass pills
 *  - meta: { label, value }[] → bottom meta grid
 *  - cta: { label, icon? } → glass pill CTA
 *  - children: extra content (e.g. a capacity bar) above the meta
 */
export default function AccentCard({
    href,
    LinkComponent = 'a',
    accent = '#dc143c',
    active = false,
    artwork,
    icon,
    status,
    eyebrow,
    title,
    desc,
    pills = [],
    meta = [],
    cta,
    children,
    className = '',
    ...props
}) {
    const Tag = LinkComponent;
    const classes = ['tfe-acard', active ? 'tfe-acard--active' : '', className].filter(Boolean).join(' ');

    return (
        <Tag href={href} className={classes} style={{ '--acard-accent': accent }} {...props}>
            {artwork?.src && (
                <img
                    src={artwork.src}
                    alt={artwork.alt || ''}
                    aria-hidden={artwork.alt ? undefined : 'true'}
                    className={'tfe-acard__art' + (artwork.variant === 'thumb' ? ' tfe-acard__art--thumb' : '')}
                    loading="lazy"
                />
            )}

            {icon && (
                <div className="tfe-acard__icon">
                    <i className={icon} aria-hidden="true"></i>
                </div>
            )}

            {status && <GlassPill size="sm" className="tfe-acard__status">{status}</GlassPill>}

            {eyebrow && <div className="tfe-acard__eyebrow">{eyebrow}</div>}
            {title && <h3 className="tfe-acard__title">{title}</h3>}
            {desc && <p className="tfe-acard__desc">{desc}</p>}

            {pills.length > 0 && (
                <div className="tfe-acard__pills">
                    {pills.map((p, i) => (
                        <GlassPill key={i} size="sm">{p}</GlassPill>
                    ))}
                </div>
            )}

            {children && <div className="tfe-acard__slot">{children}</div>}

            {meta.length > 0 && (
                <div className="tfe-acard__meta">
                    {meta.map((m, i) => (
                        <div key={i}>
                            <div className="tfe-acard__meta-label">{m.label}</div>
                            <div className="tfe-acard__meta-value">{m.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {cta && (
                <GlassPill className="tfe-acard__cta">
                    {cta.label}
                    {cta.icon !== null && <i className={cta.icon || 'fas fa-arrow-right'} />}
                </GlassPill>
            )}
        </Tag>
    );
}
