import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import '../../../css/fan/tribes.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import { PRIVACY } from './Tribes';

/**
 * A tribe the fan cannot read yet.
 *
 * The controller used to answer `back()` here, which sent anyone arriving from
 * a shared link to the site root with a flash message they never saw. This
 * states plainly what the tribe is and what the fan can do about it.
 */
export default function TribeLocked({ tribe }) {
    const [asked, setAsked] = useState(tribe.has_pending_request);
    const privacy = PRIVACY[tribe.privacy] || PRIVACY.private;

    const requestForm = useForm({ message: '' });

    const submitRequest = (e) => {
        e.preventDefault();
        requestForm.post(route('fan.tribes.join', tribe.id), {
            preserveScroll: true,
            onSuccess: () => setAsked(true),
        });
    };

    return (
        <FanLayout title={tribe.name}>
            <Head title={tribe.name} />

            <DashboardHero
                role="fan"
                title={tribe.name}
                subtitle={`${privacy.label} tribe • ${tribe.member_count} members`}
                breadcrumbs={[
                    { label: 'Tribes', href: route('fan.tribes') },
                    { label: tribe.name },
                ]}
                bgImage={tribe.banner || '/assets/img/fan/backgrounds/gaming_hero.png'}
            >
                <Link href={route('fan.tribes')} className="tfe-btn tfe-btn--sm">
                    <i className="fas fa-arrow-left" /> All Tribes
                </Link>
            </DashboardHero>

            <section className="tfe-slab tribe-locked">
                <div className="tfe-slab__body">
                    <div className="tfe-empty">
                        <div className="tfe-empty__icon"><i className={`fas ${privacy.icon}`} /></div>
                        <h4 className="tfe-empty__title">This tribe is {privacy.label.toLowerCase()}</h4>
                        <p className="tfe-empty__body">
                            {tribe.description
                                ? tribe.description
                                : 'Only members can read this tribe’s discussions and member list.'}
                        </p>

                        {asked ? (
                            <span className="tfe-pill tfe-pill--pending tfe-empty__action">
                                <i className="fas fa-user-clock" /> Request pending — a tribe admin will review it
                            </span>
                        ) : tribe.can_request ? (
                            <form className="tribe-locked__form" onSubmit={submitRequest}>
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="tribe-request-message">
                                        Add a note <span className="tribe-optional">(optional)</span>
                                    </label>
                                    <textarea
                                        id="tribe-request-message"
                                        className="tfe-textarea"
                                        rows={3}
                                        placeholder="Tell the admins why you want to join…"
                                        value={requestForm.data.message}
                                        onChange={(e) => requestForm.setData('message', e.target.value)}
                                    />
                                    {requestForm.errors.message && (
                                        <div className="tfe-form-error">{requestForm.errors.message}</div>
                                    )}
                                </div>
                                <button type="submit" className="tfe-btn tfe-btn--filled" disabled={requestForm.processing}>
                                    <i className="fas fa-paper-plane" /> Request to Join
                                </button>
                            </form>
                        ) : (
                            <p className="tfe-empty__body">
                                This tribe is invite only — an admin has to add you.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </FanLayout>
    );
}
