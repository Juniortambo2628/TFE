import GlassPill from '@/Components/Common/GlassPill';
import '../../../css/accent-card.css';

/**
 * AccentCard — the shared tournament-style card used across the platform
 * (landing tournament grid, landing section cards, partners directory +
 * hub, dashboards).
 *
 * Artwork options (mutually exclusive):
 *  - artwork: { src, alt?, variant?: 'float'|'thumb' } — floating image
 *    (trophy / partner logo / listing thumbnail).
 *  - artwork: { icon }  — a white icon in the trophy position (support
 *    pillars).
 *  - cover: <imageUrl> — the image fills the card as a background with a
 *    legibility gradient; content sits at the bottom (landing section
 *    cards keep their photos).
 *
 * Other props: href, LinkComponent ('a' | Inertia Link | 'div'), accent,
 * active, status, eyebrow, title, desc, pills[], meta[], cta{label,icon},
 * children (extra content), plus any handlers (onClick) via ...props.
 */
export default function AccentCard({
    href,
    LinkComponent = 'a',
    accent = '#dc143c',
    active = false,
    artwork,
    cover,
    bgImage,
    cornerButton,
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
    const isCover = !!cover;
    const classes = [
        'tfe-acard',
        isCover ? 'tfe-acard--cover' : '',
        active ? 'tfe-acard--active' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Tag href={href} className={classes} style={{ '--acard-accent': accent }} {...props}>
            {bgImage && (
                <img
                    src={bgImage}
                    alt=""
                    aria-hidden="true"
                    className="tfe-acard__bg"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            )}

            {isCover && (
                <>
                    <img src={cover} alt="" aria-hidden="true" className="tfe-acard__cover" loading="lazy" />
                    <span className="tfe-acard__cover-overlay" aria-hidden="true"></span>
                </>
            )}

            {cornerButton && (
                <button
                    type="button"
                    className="tfe-acard__corner-btn"
                    aria-label={cornerButton.label || 'More information'}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); cornerButton.onClick?.(e); }}
                >
                    <i className={cornerButton.icon || 'fas fa-plus'} aria-hidden="true"></i>
                </button>
            )}

            {artwork?.src && (
                <img
                    src={artwork.src}
                    alt={artwork.alt || ''}
                    aria-hidden={artwork.alt ? undefined : 'true'}
                    className={'tfe-acard__art' + (artwork.variant === 'thumb' ? ' tfe-acard__art--thumb' : '')}
                    loading="lazy"
                />
            )}

            {artwork?.icon && (
                <span className="tfe-acard__art tfe-acard__art--icon" aria-hidden="true">
                    <i className={artwork.icon}></i>
                </span>
            )}

            {status && <GlassPill size="sm" className="tfe-acard__status">{status}</GlassPill>}

            <div className="tfe-acard__content">
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
            </div>
        </Tag>
    );
}
