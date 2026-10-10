import React from 'react';
import { router, useForm } from '@inertiajs/react';
import ContentCard from '@/Components/Common/ContentCard';

/**
 * Opt in to SMS / WhatsApp alerts (Sprint 66): quotes, payments received and
 * holds about to lapse. Two steps — number + consent, then the 6-digit code —
 * because a number is only texted once its owner has proved it.
 */
export default function TextAlertsCard({ contact = null }) {
    const add = useForm({ phone: '', channel: 'sms', consent: false });
    const verify = useForm({ code: '' });

    const awaitingCode = contact && !contact.verified;

    return (
        <ContentCard
            className="mt-4"
            title="Text me trip updates"
            subtitle="Quotes, payments and booking reminders by SMS or WhatsApp. Optional — the bell always has them too."
        >
            {contact?.verified ? (
                <div className="d-flex flex-wrap align-items-center gap-3">
                    <span className="flex-grow-1">
                        <i className="fas fa-check-circle me-2" aria-hidden="true"></i>
                        On — {contact.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to {contact.phone}
                    </span>
                    <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => router.delete(route('fan.text-alerts.destroy'))}>
                        Stop texts &amp; delete number
                    </button>
                </div>
            ) : awaitingCode ? (
                <form
                    className="d-flex flex-wrap align-items-end gap-2"
                    onSubmit={(e) => { e.preventDefault(); verify.post(route('fan.text-alerts.verify'), { preserveScroll: true }); }}
                >
                    <div className="tfe-form-field flex-grow-1">
                        <label className="tfe-form-label" htmlFor="text-alert-code">Code sent to {contact.phone}</label>
                        <input
                            id="text-alert-code"
                            className="tfe-input"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={verify.data.code}
                            onChange={(e) => verify.setData('code', e.target.value.replace(/\D/g, ''))}
                        />
                        {verify.errors.code && <div className="tfe-form-error">{verify.errors.code}</div>}
                    </div>
                    <button type="submit" className="tfe-btn tfe-btn--filled" disabled={verify.processing}>Confirm</button>
                    <button type="button" className="tfe-btn" onClick={() => router.delete(route('fan.text-alerts.destroy'), { preserveScroll: true })}>
                        Use another number
                    </button>
                </form>
            ) : (
                <form onSubmit={(e) => { e.preventDefault(); add.post(route('fan.text-alerts.store'), { preserveScroll: true }); }}>
                    <div className="tfe-form-grid tfe-form-grid--2">
                        <div className="tfe-form-field">
                            <label className="tfe-form-label" htmlFor="text-alert-phone">Mobile number</label>
                            <input
                                id="text-alert-phone"
                                type="tel"
                                className="tfe-input"
                                autoComplete="tel"
                                placeholder="0712 345 678"
                                value={add.data.phone}
                                onChange={(e) => add.setData('phone', e.target.value)}
                            />
                            {add.errors.phone && <div className="tfe-form-error">{add.errors.phone}</div>}
                        </div>
                        <div className="tfe-form-field">
                            <label className="tfe-form-label" htmlFor="text-alert-channel">Send by</label>
                            <select id="text-alert-channel" className="tfe-select" value={add.data.channel} onChange={(e) => add.setData('channel', e.target.value)}>
                                <option value="sms">SMS</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                        </div>
                    </div>
                    <label className="tfe-check mt-3">
                        <input type="checkbox" checked={add.data.consent} onChange={(e) => add.setData('consent', e.target.checked)} />
                        <span>Text me about my bookings at this number. I can stop at any time, which deletes the number.</span>
                    </label>
                    {add.errors.consent && <div className="tfe-form-error">Tick the box to turn texts on.</div>}
                    <button type="submit" className="tfe-btn tfe-btn--filled mt-3" disabled={add.processing || !add.data.consent}>
                        Send me a code
                    </button>
                </form>
            )}
        </ContentCard>
    );
}
