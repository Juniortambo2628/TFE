import React from 'react';
import { useForm } from '@inertiajs/react';
import '../../../css/landing-section.css';
import { assetPath } from '@/lib/assets';

/**
 * LandingModal — the shared card-detail dialog for the landing page.
 *
 * Opened by any LandingCard (Experiences, News, Contact …). Shows the card's
 * image, tags, title, subtitle, meta and a longer description, then a
 * primary CTA plus a partner-funnel CTA.
 *
 * When `data.form` is set (Contact cards), the actions area is replaced by a
 * working contact form that POSTs to `contact.store` (stored as a
 * ContactMessage). `data.form` may carry `{ subject }` to prefill.
 *
 * data shape:
 *   { image, title, subtitle, tags[], meta[], description,
 *     cta: { label, href }, partnerCta: { label, href }, form?: { subject } }
 */
export default function LandingModal({ open, onClose, data }) {

    const form = useForm({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = React.useState(false);

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

    // Reset the form (and success state) whenever the dialog opens on a card.
    React.useEffect(() => {
        setSent(false);
        form.clearErrors();
        form.setData({ name: '', email: '', subject: (data && (data.form?.subject || data.title)) || '', message: '' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, open]);

    if (!open || !data) return null;

    let imgSrc = null;
    if (data.image) {
        imgSrc = assetPath(data.image);
    }

    const tags = data.tags || [];
    const meta = (data.meta || []).filter(Boolean);
    const isForm = !!data.form;
    const partnerCta = data.partnerCta || {
        label: 'Find partners who can arrange this',
        href: (typeof route === 'function') ? route('partners.index') : '/partners',
    };

    const submitForm = (e) => {
        e.preventDefault();
        form.post((typeof route === 'function') ? route('contact.store') : '/contact', {
            preserveScroll: true,
            onSuccess: () => { setSent(true); form.reset(); },
        });
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

                    {isForm ? (
                        sent ? (
                            <div className="landing-modal-sent" role="status">
                                <i className="fas fa-circle-check" />
                                <span>Thanks — your message is in. Our team will be in touch shortly.</span>
                            </div>
                        ) : (
                            <form className="landing-modal-form" onSubmit={submitForm} noValidate>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="lm-name">Your name</label>
                                    <input id="lm-name" type="text" className="tfe-input" value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)} required />
                                    {form.errors.name && <div className="tfe-form-error">{form.errors.name}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="lm-email">Email address</label>
                                    <input id="lm-email" type="email" className="tfe-input" value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)} required />
                                    {form.errors.email && <div className="tfe-form-error">{form.errors.email}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="lm-subject">Subject</label>
                                    <input id="lm-subject" type="text" className="tfe-input" value={form.data.subject}
                                        onChange={(e) => form.setData('subject', e.target.value)} required />
                                    {form.errors.subject && <div className="tfe-form-error">{form.errors.subject}</div>}
                                </div>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="lm-message">Message</label>
                                    <textarea id="lm-message" rows={4} className="tfe-textarea" value={form.data.message}
                                        onChange={(e) => form.setData('message', e.target.value)} required />
                                    {form.errors.message && <div className="tfe-form-error">{form.errors.message}</div>}
                                </div>
                                <button type="submit" className="tfe-btn tfe-btn--filled tfe-btn--lg" disabled={form.processing}>
                                    {form.processing ? 'Sending…' : 'Send message'}
                                </button>
                            </form>
                        )
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
}
