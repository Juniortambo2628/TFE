import React, { useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import TfeModal from '@/Components/Common/TfeModal';
import StepFlow from '@/Components/Common/StepFlow';
import ModalRow from '@/Components/Common/ModalRow';
import ContentCard from '@/Components/Common/ContentCard';
import MinorsBadge from '@/Components/Common/MinorsBadge';

/**
 * SchoolGroupWizard — how a school declares a group trip.
 *
 * TFE's engagement is with the SCHOOL, through an appointed official. The
 * school already runs parental consent, safeguarding, supervision ratios and
 * duty of care, and rebuilding any of that here would be a worse copy of a
 * process that works. So this form asks for three things and nothing else:
 * who is accountable, how many adults and minors travel, and the two
 * warranties. There is no field on it that identifies a pupil, and there must
 * never be one.
 *
 * Gated steps, so it uses `StepFlow` rather than TfeModal's tab rail: you
 * cannot warrant a party you have not yet described, and a tab rail implies
 * you may jump (Sprint 59).
 *
 * Mount it conditionally and `key` it on the budget — `useForm` reads its
 * initial values on FIRST mount only, so a wizard left mounted across two
 * different itineraries would keep the first one's values (Sprint 57).
 */
export default function SchoolGroupWizard({ open, onClose, itinerary, institution = null }) {
    const existing = itinerary?.school_group || null;

    // An institution account already knows its own name, its official and
    // their role, so a first declaration opens pre-filled rather than asking
    // a school to retype what it typed at sign-up — a field somebody retypes
    // forty times is one that eventually disagrees with itself. Defaults
    // only: the form stays editable, because the official signing for a
    // particular trip may not be the account holder (Sprint 62).
    const form = useForm({
        school_name: existing?.school_name || institution?.institution_name || '',
        official_name: existing?.official_name || institution?.official_name || '',
        official_role: existing?.official_role || institution?.official_role || '',
        official_email: existing?.official_email || institution?.official_email || '',
        official_phone: existing?.official_phone || institution?.official_phone || '',
        travellers_adults: existing?.travellers_adults ?? '',
        travellers_minors: existing?.travellers_minors ?? '',
        youngest_traveller_age: existing?.youngest_traveller_age ?? '',
        // Always start clear, even when amending. Re-opening this form is
        // re-declaring: the warranty given for a party of 20 minors does not
        // cover the 40 about to be submitted.
        channels_confirmed: false,
        information_accurate: false,
        notes: existing?.notes || '',
    });
    const { data, setData, errors, processing } = form;

    const [step, setStep] = useState(1);
    const [done, setDone] = useState(false);

    const adults = Number(data.travellers_adults) || 0;
    const minors = Number(data.travellers_minors) || 0;
    const hasMinors = minors > 0;

    const steps = useMemo(() => [
        { title: 'School', icon: 'fas fa-school' },
        { title: 'Travelling party', icon: 'fas fa-users' },
        { title: 'Declaration', icon: 'fas fa-file-signature' },
    ], []);

    const schoolReady = Boolean(
        data.school_name.trim() && data.official_name.trim()
        && data.official_role.trim() && data.official_email.trim(),
    );
    // A party needs at least one supervising adult, and an age whenever
    // minors travel — that is what decides unaccompanied-minor handling.
    const partyReady = adults >= 1 && data.travellers_minors !== ''
        && (!hasMinors || Number(data.youngest_traveller_age) > 0);
    const declarationReady = data.channels_confirmed && data.information_accurate;

    const submit = () => {
        form.post(route('fan.budgets.school-group.store', itinerary.id), {
            preserveScroll: true,
            onSuccess: () => setDone(true),
        });
    };

    if (done) {
        return (
            <TfeModal
                open={open}
                label={itinerary.reference_id}
                title="Declaration recorded"
                onClose={onClose}
                size="md"
                footer={
                    <button type="button" onClick={onClose} className="tfe-btn tfe-btn--filled">
                        Done
                    </button>
                }
            >
                <div className="tfe-empty" style={{ padding: '16px 0' }}>
                    <div className="tfe-empty__icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                        <i className="fas fa-check"></i>
                    </div>
                    <h4 className="tfe-empty__title">{data.school_name} is on the record</h4>
                    <p className="tfe-empty__body">
                        {hasMinors
                            ? 'The travel partner handling this request now sees that minors are travelling, alongside your contact details as the declaring official.'
                            : 'The travel partner handling this request now sees your school and your contact details as the declaring official.'}
                    </p>
                </div>
            </TfeModal>
        );
    }

    return (
        <TfeModal
            open={open}
            label={itinerary.reference_id}
            title={existing ? 'Amend school group declaration' : 'Declare a school group'}
            heading={steps[step - 1].title}
            onClose={onClose}
            size="lg"
            // A destructive-to-lose form: a mis-aimed backdrop click should
            // not throw away a half-filled declaration.
            closeOnBackdrop={false}
            footer={
                <div className="d-flex justify-content-between align-items-center w-100 gap-3">
                    <span className="tfe-form-help mb-0">
                        We never ask for a pupil's name, age or documents.
                    </span>
                    <div className="d-flex gap-2">
                        {step > 1 && (
                            <button type="button" onClick={() => setStep(step - 1)} className="tfe-btn">
                                Back
                            </button>
                        )}
                        {step < steps.length ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                disabled={step === 1 ? !schoolReady : !partyReady}
                                className="tfe-btn tfe-btn--filled"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={submit}
                                disabled={processing || !declarationReady}
                                className="tfe-btn tfe-btn--filled"
                            >
                                <i className="fas fa-file-signature"></i>
                                {processing ? 'Submitting…' : 'Submit declaration'}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <StepFlow
                variant="inline"
                className="mb-4"
                label={`Step ${step} of ${steps.length}`}
                steps={steps}
                cursor={step}
            />

            {step === 1 && <StepSchool data={data} setData={setData} errors={errors} />}
            {step === 2 && (
                <StepParty
                    data={data} setData={setData} errors={errors}
                    adults={adults} minors={minors} hasMinors={hasMinors}
                />
            )}
            {step === 3 && (
                <StepDeclaration
                    data={data} setData={setData} errors={errors}
                    adults={adults} minors={minors} hasMinors={hasMinors}
                    previouslyDeclaredAt={existing?.declared_at || null}
                />
            )}
        </TfeModal>
    );
}

function StepSchool({ data, setData, errors }) {
    return (
        <>
            <p className="tfe-form-help mb-3">
                The appointed official is who the travel partner contacts about this trip, and who
                TFE reaches if there is a question or a dispute later. It should be a school
                address, not a personal one.
            </p>

            <ContentCard>
                <div className="tfe-form-field">
                    <label className="tfe-form-label" htmlFor="sg-school">School or organisation</label>
                    <input
                        id="sg-school" type="text" className="tfe-input" maxLength={255}
                        value={data.school_name}
                        onChange={(e) => setData('school_name', e.target.value)}
                        placeholder="Nairobi Girls High School"
                    />
                    {errors.school_name && <div className="tfe-form-error">{errors.school_name}</div>}
                </div>

                <div className="tfe-form-grid tfe-form-grid--2">
                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="sg-name">Appointed official</label>
                        <input
                            id="sg-name" type="text" className="tfe-input" maxLength={255}
                            value={data.official_name}
                            onChange={(e) => setData('official_name', e.target.value)}
                            placeholder="Jane Mwangi"
                        />
                        {errors.official_name && <div className="tfe-form-error">{errors.official_name}</div>}
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="sg-role">Their role at the school</label>
                        <input
                            id="sg-role" type="text" className="tfe-input" maxLength={120}
                            value={data.official_role}
                            onChange={(e) => setData('official_role', e.target.value)}
                            placeholder="Deputy Head, Games"
                        />
                        {errors.official_role && <div className="tfe-form-error">{errors.official_role}</div>}
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="sg-email">School email</label>
                        <input
                            id="sg-email" type="email" className="tfe-input" maxLength={255}
                            value={data.official_email}
                            onChange={(e) => setData('official_email', e.target.value)}
                            placeholder="games@school.ac.ke"
                        />
                        {errors.official_email && <div className="tfe-form-error">{errors.official_email}</div>}
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="sg-phone">Phone <span className="text-white-50">(optional)</span></label>
                        <input
                            id="sg-phone" type="tel" className="tfe-input" maxLength={40}
                            value={data.official_phone}
                            onChange={(e) => setData('official_phone', e.target.value)}
                            placeholder="+254 20 555 0142"
                        />
                        {errors.official_phone && <div className="tfe-form-error">{errors.official_phone}</div>}
                    </div>
                </div>
            </ContentCard>
        </>
    );
}

function StepParty({ data, setData, errors, adults, minors, hasMinors }) {
    return (
        <>
            <p className="tfe-form-help mb-3">
                The split is what drives the planning: supervision ratios, room configuration, and
                an airline's own policy on minors. "40 travellers" drives none of it.
            </p>

            <ContentCard>
                <div className="tfe-form-grid tfe-form-grid--2">
                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="sg-adults">Adults travelling (18+)</label>
                        <input
                            id="sg-adults" type="number" className="tfe-input" min={1} max={500}
                            value={data.travellers_adults}
                            onChange={(e) => setData('travellers_adults', e.target.value)}
                            placeholder="6"
                        />
                        <div className="tfe-form-help">Staff, coaches and any accompanying parents.</div>
                        {errors.travellers_adults && <div className="tfe-form-error">{errors.travellers_adults}</div>}
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="sg-minors">Travellers under 18</label>
                        <input
                            id="sg-minors" type="number" className="tfe-input" min={0} max={2000}
                            value={data.travellers_minors}
                            onChange={(e) => setData('travellers_minors', e.target.value)}
                            placeholder="34"
                        />
                        <div className="tfe-form-help">A count only. Enter 0 for a staff-only trip.</div>
                        {errors.travellers_minors && <div className="tfe-form-error">{errors.travellers_minors}</div>}
                    </div>

                    {/* Only asked when it means something. It decides whether
                        unaccompanied-minor handling applies — and is still
                        nobody's identity. */}
                    {hasMinors && (
                        <div className="tfe-form-field">
                            <label className="tfe-form-label" htmlFor="sg-youngest">Age of the youngest traveller</label>
                            <input
                                id="sg-youngest" type="number" className="tfe-input" min={2} max={17}
                                value={data.youngest_traveller_age}
                                onChange={(e) => setData('youngest_traveller_age', e.target.value)}
                                placeholder="12"
                            />
                            <div className="tfe-form-help">Carriers set minor handling by age, not by year group.</div>
                            {errors.youngest_traveller_age && <div className="tfe-form-error">{errors.youngest_traveller_age}</div>}
                        </div>
                    )}
                </div>
            </ContentCard>

            {adults >= 1 && (
                <div className="mt-3">
                    <ContentCard title="What the partner will see">
                        <div className="d-flex flex-wrap align-items-center gap-3">
                            {/* The real badge, not a description of it. The
                                school sees exactly the flag that travels with
                                this request. */}
                            <MinorsBadge group={{ involves_minors: hasMinors }} compact />
                            <span className="text-white">
                                {minors} under 18 · {adults} {adults === 1 ? 'adult' : 'adults'}
                            </span>
                        </div>
                        {!hasMinors && (
                            <p className="tfe-form-help mb-0 mt-2">
                                No minors declared, so no minors flag is raised. A "0 minors" chip on
                                every adult trip would train people to ignore the one that matters.
                            </p>
                        )}
                    </ContentCard>
                </div>
            )}
        </>
    );
}

function StepDeclaration({ data, setData, errors, adults, minors, hasMinors, previouslyDeclaredAt }) {
    return (
        <>
            {previouslyDeclaredAt && (
                <p className="tfe-form-help mb-3">
                    This request was last declared on {previouslyDeclaredAt}. Submitting again
                    replaces that declaration with this one.
                </p>
            )}

            <ContentCard title="What you are declaring">
                <ModalRow title="School" align="start">
                    <strong className="text-white">{data.school_name}</strong>
                </ModalRow>
                <ModalRow title="Appointed official" align="start">
                    <strong className="text-white">{data.official_name} · {data.official_role}</strong>
                </ModalRow>
                <ModalRow title="Travelling party" align="start">
                    <span className="d-inline-flex flex-wrap align-items-center gap-2">
                        <strong className="text-white">
                            {minors} under 18 · {adults} {adults === 1 ? 'adult' : 'adults'}
                            {hasMinors && data.youngest_traveller_age ? ` · youngest ${data.youngest_traveller_age}` : ''}
                        </strong>
                        <MinorsBadge group={{ involves_minors: hasMinors }} compact />
                    </span>
                </ModalRow>
            </ContentCard>

            <div className="mt-3">
                <ContentCard title="The school's warranties">
                    <div className="d-flex flex-column gap-3">
                        <label className="tfe-check">
                            <input
                                type="checkbox"
                                checked={data.channels_confirmed}
                                onChange={(e) => setData('channels_confirmed', e.target.checked)}
                            />
                            <span>
                                <strong>Our own consent and safeguarding channels were followed</strong>
                                <small className="text-white-50">
                                    Every traveller under 18 has the permissions the school requires, and this
                                    trip is supervised to the school's own policy. TFE does not collect or hold
                                    those permissions — the school does.
                                </small>
                            </span>
                        </label>

                        <label className="tfe-check">
                            <input
                                type="checkbox"
                                checked={data.information_accurate}
                                onChange={(e) => setData('information_accurate', e.target.checked)}
                            />
                            <span>
                                <strong>This information is accurate</strong>
                                <small className="text-white-50">
                                    The traveller numbers above are correct, and I am authorised by the school
                                    to make this declaration on its behalf.
                                </small>
                            </span>
                        </label>
                    </div>

                    {errors.channels_confirmed && <div className="tfe-form-error mt-2">{errors.channels_confirmed}</div>}
                    {errors.information_accurate && <div className="tfe-form-error mt-2">{errors.information_accurate}</div>}
                </ContentCard>
            </div>

            <div className="mt-3">
                <ContentCard>
                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="sg-notes">
                            Anything the travel partner should plan around? <span className="text-white-50">(optional)</span>
                        </label>
                        <textarea
                            id="sg-notes" className="tfe-textarea" rows="3" maxLength={1000}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="First-aid certified staff, rooming policy, accessibility needs…"
                        />
                        {/* Deliberately not where the minors flag lives: a note
                            is something nobody is obliged to read. */}
                        <div className="tfe-form-help">
                            Logistics only. Do not put a traveller's name, age or medical details here.
                        </div>
                        {errors.notes && <div className="tfe-form-error">{errors.notes}</div>}
                    </div>
                </ContentCard>
            </div>
        </>
    );
}
