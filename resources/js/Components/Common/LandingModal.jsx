import React from 'react';
import { usePage } from '@inertiajs/react';
import '../../../css/landing-section.css';

/**
 * LandingModal — the shared card-detail dialog for the landing page.
 *
 * Opened by any LandingCard (Experiences, News, …). Shows the card's
 * image, tags, title, subtitle, meta and a longer description, then a
 * primary CTA plus a partner-funnel CTA that sends the fan to the
 * partners who can actually deliver the selected proposition.
 *
 * data shape:
 *   { image, title, subtitle, tags[], meta[], description,
 *     cta: { label, href }, partnerCta: { label, href } }
 *
 * partnerCta defaults to the partners directory so every card funnels
 * somewhere useful even when a section doesn't set one.
 */
export default function LandingModal({ open, onClose, data }) {
    const { assetUrl } = usePage().props;
    const baseUrl = assetUrl || '';

    React.useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    React.useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open || !data) return null;

    let imgSrc = null;
    if (data.image) {
        imgSrc = (data.image.startsWith('http') || data.image.startsWith('/')) ? data.image : baseUrl + data.image;
    }

    const tags = data.tags || [];
    const meta = (data.meta || []).filter(Boolean);
    const partnerCta = data.partnerCta || {
        label: 'Find partners who can arrange this',
        href: (typeof route === 'function') ? route('partners.index') : '/partners',
    };

    return (
        <div className="landing-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={data.title || 'Details'}>
            <div className="landing-modal" onClick={(e) => e.stopPropagation()}>
                <button className="landing-modal-close" onClick={onClose} aria-label="Close">
                    <i className="fas fa-times" />
                </button>

                {imgSrc && <img src={imgSrc} alt={data.title || ''} className="landing-modal-image" />}

                <div className="landing-modal-body">
                    {tags.length > 0 && (
                        <div className="landing-modal-tags">
                            {tags.map((tag) => (
                                <span key={tag} className="landing-modal-tag">{tag}</span>
                            ))}
                        </div>
                    )}

                    {data.title && <h2 className="landing-modal-title">{data.title}</h2>}
                    {data.subtitle && <p className="landing-modal-subtitle">{data.subtitle}</p>}

                    {meta.length > 0 && (
                        <div className="landing-modal-meta">
                            {meta.map((m, i) => <span key={i}>{m}</span>)}
                        </div>
                    )}

                    {data.description && <p className="landing-modal-description">{data.description}</p>}

                    <div className="landing-modal-actions">
                        {data.cta && (
                            <a
                                href={data.cta.href}
                                className="landing-modal-cta"
                                target={data.cta.href && data.cta.href.startsWith('http') ? '_blank' : undefined}
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span>{data.cta.label}</span>
                                <iconify-icon icon="lucide:arrow-up-right" />
                            </a>
                        )}
                        <a
                            href={partnerCta.href}
                            className="landing-modal-partner"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <iconify-icon icon="lucide:handshake" />
                            <span>{partnerCta.label}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
