import React from 'react';
import { useForm, usePage } from '@inertiajs/react';
import V2PageShell from '@/Components/Landing/V2/V2PageShell';
import V2PageHero from '@/Components/Landing/V2/V2PageHero';
import Faq from '@/Components/Landing/V2/Faq';
import LandingAction from '@/Components/Landing/V2/LandingAction';
import { V2IconCards, V2Section, closingProps } from '@/Components/Landing/V2/V2Blocks';

/**
 * /v2/contact: the message form on the page itself (the v1 page opens it in
 * a dialog from a card), quicker routes for the three things most people
 * write about, and the FAQ. Posts to the same `contact.store`.
 */
export default function Contact({ hero, landing }) {
    const { v2Pages, tournament, flash } = usePage().props;
    const copy = v2Pages.contact;
    const form = useForm({ name: '', email: '', subject: copy.form.subjects[0], message: '' });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('contact.store'), { preserveScroll: true, onSuccess: () => form.reset('message') });
    };

    return (
        <V2PageShell
            title="Contact"
            hero={(
                <V2PageHero
                    crumbs={[{ label: 'Contact' }]}
                    eyebrow={hero.eyebrow}
                    title={hero.title}
                    tagline={hero.tagline}
                    background={hero.background}
                    actions={<LandingAction action="section:message" label={copy.form.submit} icon="fas fa-arrow-down" filled />}
                />
            )}
            sections={copy.sections}
            closing={closingProps(copy.closing, { primary: { action: 'planner' }, secondary: { action: 'section:message' }, tournamentId: tournament?.id })}
        >
            <V2Section id="message" eyebrow={copy.form.eyebrow} title={copy.form.title} text={copy.form.text}>
                <form id="v2-contact-form" className="v2-form" onSubmit={submit} noValidate>
                    {flash?.success && <p className="v2-form__ok" role="status"><i className="fas fa-check" aria-hidden="true"></i> {flash.success}</p>}
                    <div className="tfe-form-grid tfe-form-grid--2">
                        <Field label="Your name" error={form.errors.name}>
                            <input className="tfe-input" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoComplete="name" required />
                        </Field>
                        <Field label="Email" error={form.errors.email}>
                            <input type="email" className="tfe-input" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} autoComplete="email" required />
                        </Field>
                        <Field label="What it is about" error={form.errors.subject} wide>
                            <select className="tfe-select" value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)}>
                                {copy.form.subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                        <Field label="Message" error={form.errors.message} wide>
                            <textarea className="tfe-textarea" rows={6} value={form.data.message} onChange={(e) => form.setData('message', e.target.value)} required />
                        </Field>
                    </div>
                    <button type="submit" className="tfe-btn tfe-btn--filled tfe-btn--lg" disabled={form.processing}>
                        <i className="fas fa-paper-plane" aria-hidden="true"></i> {copy.form.submit}
                    </button>
                </form>
            </V2Section>

            <V2Section id="routes" eyebrow={copy.routes.eyebrow} title={copy.routes.title} tinted>
                <V2IconCards items={copy.routes.items} tournamentId={tournament?.id} />
            </V2Section>

            <Faq faq={landing.faq} />
        </V2PageShell>
    );
}

function Field({ label, error, wide = false, children }) {
    return (
        <label className={'tfe-form-field' + (wide ? ' tfe-form-field--wide' : '')}>
            <span className="tfe-form-label">{label}</span>
            {children}
            {error && <span className="tfe-form-error">{error}</span>}
        </label>
    );
}
