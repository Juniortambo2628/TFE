import React from 'react';
import { useForm } from '@inertiajs/react';

import ContentCard from '@/Components/Common/ContentCard';
import ModalRow from '@/Components/Common/ModalRow';
import TfeModal from '@/Components/Common/TfeModal';
import { assetPath } from '@/lib/assets';

/**
 * LandingModal — the "more information" dialog behind every LandingCard.
 *
 * Now a thin arrangement of the unified `TfeModal`, so a card dialog on the
 * public pages is the same dialog as a form on a dashboard. It used to be its
 * own overlay with its own stylesheet, which is why its contact form sat
 * bolted underneath the description instead of having a place of its own.
 *
 * Three sections:
 *   Overview  the image, the pitch, and the calls to action
 *   Details   tags and meta, as labelled rows
 *   Enquire   the contact form, POSTing to `contact.store`
 *
 * The props are unchanged — seven call sites pass `{ open, onClose, data }`
 * and none of them needed to move.
 *
 * data shape:
 *   { image, title, subtitle, tags[], meta[], description,
 *     cta: { label, href }, partnerCta: { label, href }, form?: { subject } }
 */
export default function LandingModal({ open, onClose, data }) {
    const form = useForm({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = React.useState(false);
    // Controlled, because the footer's submit button only belongs on the
    // Enquire tab — the form it targets is not rendered on the others, so
    // offering it there would be a button that does nothing.
    const [tab, setTab] = React.useState(null);

    // Reset the form (and the success state) whenever the dialog opens on a
    // different card, or the last card's message is still sitting there.
    React.useEffect(() => {
        setSent(false);
        form.clearErrors();
        form.setData({
            name: '',
            email: '',
            subject: (data && (data.form?.subject || data.title)) || '',
            message: '',
        });
        setTab(data?.form ? 'enquire' : 'overview');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, open]);

    if (!open || !data) return null;

    const tags = data.tags || [];
    const meta = (data.meta || []).filter(Boolean);
    const imgSrc = data.image ? assetPath(data.image) : null;

    const partnerCta = data.partnerCta || {
        label: 'Find partners who can arrange this',
        href: typeof route === 'function' ? route('partners.index') : '/partners',
    };

    const submitForm = (e) => {
        e.preventDefault();
        form.post(typeof route === 'function' ? route('contact.store') : '/contact', {
            preserveScroll: true,
            onSuccess: () => { setSent(true); form.reset(); },
        });
    };

    // Details only earns a tab when there is something in it.
    const hasDetails = tags.length > 0 || meta.length > 0;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'fas fa-circle-info', content: (
            <div className="landing-modal-overview">
                {imgSrc && (
                    <img src={imgSrc} alt={data.title || ''} className="landing-modal-image" />
                )}

                {data.description && <p className="tfe-modal__prose">{data.description}</p>}

                <div className="landing-modal-actions">
                    {data.cta && (
                        <a
                            href={data.cta.href}
                            className="tfe-btn tfe-btn--filled tfe-btn--lg"
                            target={data.cta.href && data.cta.href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                        >
                            <span>{data.cta.label}</span>
                            <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
                        </a>
                    )}
                    <a href={partnerCta.href} className="tfe-btn tfe-btn--lg">
                        <i className="fas fa-handshake" aria-hidden="true" />
                        <span>{partnerCta.label}</span>
                    </a>
                </div>
            </div>
        ) },
    ];

    if (hasDetails) {
        tabs.push({ id: 'details', label: 'Details', icon: 'fas fa-list', content: (
            <ContentCard title="At a glance">
                {tags.length > 0 && (
                    <ModalRow title="Tags">
                        <span className="landing-modal-tags">
                            {tags.map((tag) => (
                                <span key={tag} className="tfe-pill tfe-pill--info">{tag}</span>
                            ))}
                        </span>
                    </ModalRow>
                )}
                {/* Meta arrives as plain strings (a date, a source), not
                    labelled pairs — so they render as one row of facts rather
                    than being given invented labels. */}
                {meta.length > 0 && (
                    <ModalRow title="Details">
                        <span className="landing-modal-meta">
                            {meta.map((m, i) => <span key={i}>{typeof m === 'string' ? m : (m.value ?? '')}</span>)}
                        </span>
                    </ModalRow>
                )}
            </ContentCard>
        ) });
    }

    tabs.push({ id: 'enquire', label: 'Enquire', icon: 'fas fa-paper-plane', content: (
        sent ? (
            <div className="tfe-empty tfe-empty--inline" role="status">
                <div className="tfe-empty__icon"><i className="fas fa-circle-check" /></div>
                <div className="tfe-empty__title">Message sent</div>
                <p className="tfe-empty__body">
                    Thanks — your message is in. Our team will be in touch shortly.
                </p>
            </div>
        ) : (
            <form id="landing-enquiry-form" onSubmit={submitForm} noValidate>
                <ModalRow title="Your name" htmlFor="lm-name" stacked>
                    <input id="lm-name" type="text" className="tfe-input" value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)} required />
                    {form.errors.name && <div className="tfe-form-error">{form.errors.name}</div>}
                </ModalRow>
                <ModalRow title="Email address" htmlFor="lm-email" stacked>
                    <input id="lm-email" type="email" className="tfe-input" value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)} required />
                    {form.errors.email && <div className="tfe-form-error">{form.errors.email}</div>}
                </ModalRow>
                <ModalRow title="Subject" htmlFor="lm-subject" stacked>
                    <input id="lm-subject" type="text" className="tfe-input" value={form.data.subject}
                        onChange={(e) => form.setData('subject', e.target.value)} required />
                    {form.errors.subject && <div className="tfe-form-error">{form.errors.subject}</div>}
                </ModalRow>
                <ModalRow title="Message" htmlFor="lm-message" stacked>
                    <textarea id="lm-message" rows={4} className="tfe-textarea" value={form.data.message}
                        onChange={(e) => form.setData('message', e.target.value)} required />
                    {form.errors.message && <div className="tfe-form-error">{form.errors.message}</div>}
                </ModalRow>
            </form>
        )
    ) });

    return (
        <TfeModal
            open={open}
            onClose={onClose}
            size="lg"
            label={data.eyebrow || 'More information'}
            title={data.title || 'Details'}
            subheading={data.subtitle}
            tabs={tabs}
            media={imgSrc ? <img src={imgSrc} alt="" /> : null}
            activeTab={tab}
            onTabChange={setTab}
            footer={(
                <>
                    <button type="button" className="tfe-btn" onClick={onClose}>Close</button>
                    {tab === 'enquire' && !sent && (
                        <button type="submit" form="landing-enquiry-form" className="tfe-btn tfe-btn--filled" disabled={form.processing}>
                            {form.processing ? 'Sending…' : 'Send message'}
                        </button>
                    )}
                    {tab !== 'enquire' && (
                        <button type="button" className="tfe-btn tfe-btn--filled" onClick={() => setTab('enquire')}>
                            Enquire
                        </button>
                    )}
                </>
            )}
        />
    );
}
