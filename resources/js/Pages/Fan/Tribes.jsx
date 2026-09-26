import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Link, router, useForm } from '@inertiajs/react';
import '../../../css/fan/tribes.css';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import TfeModal from '@/Components/Common/TfeModal';
import { useTournament } from '@/Context/TournamentContext';
import TournamentPill from '@/Components/Common/TournamentPill';

/** Privacy → icon + copy, shared by the card badge and the create form. */
export const PRIVACY = {
    public: { icon: 'fa-globe', label: 'Public', blurb: 'Open to everyone' },
    private: { icon: 'fa-lock', label: 'Private', blurb: 'Approval required' },
    invite_only: { icon: 'fa-user-friends', label: 'Invite only', blurb: 'Admins add members' },
};

export default function Tribes({ tribes, stats, activeScope = 'this_and_cross', search = '' }) {
    const { tournament } = useTournament();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [tribeToLeave, setTribeToLeave] = useState(null);
    const [query, setQuery] = useState(search);

    const createForm = useForm({
        name: '',
        description: '',
        privacy: 'public',
        cross_tournament: false,
    });

    // Scope chips: null = default (this + cross), 'this' = only current,
    // 'cross' = only cross-tournament, 'all' = every tribe.
    const scopeChips = [
        { key: 'this_and_cross', label: `${tournament?.short_name || 'This'} + open`, param: null },
        { key: 'this', label: `Only ${tournament?.short_name || 'this'}`, param: 'this' },
        { key: 'cross', label: 'Cross-tournament', param: 'cross' },
        { key: 'all', label: 'Every tribe', param: 'all' },
    ];

    const navigate = (params) => {
        router.get(route('fan.tribes'), params, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            only: ['tribes', 'stats', 'activeScope', 'search'],
        });
    };

    const currentScopeParam = scopeChips.find((c) => c.key === activeScope)?.param ?? null;

    const applyScope = (scope) => {
        navigate({ ...(scope ? { scope } : {}), ...(query ? { q: query } : {}) });
    };

    const submitSearch = (e) => {
        e.preventDefault();
        navigate({ ...(currentScopeParam ? { scope: currentScopeParam } : {}), ...(query ? { q: query } : {}) });
    };

    const handleJoin = (tribeId) => {
        router.post(route('fan.tribes.join', tribeId), {}, { preserveScroll: true });
    };

    const handleLeave = () => {
        if (!tribeToLeave) return;
        router.post(route('fan.tribes.leave', tribeToLeave), {}, {
            preserveScroll: true,
            onSuccess: () => setTribeToLeave(null),
        });
    };

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post(route('fan.tribes.store'), {
            onSuccess: () => {
                createForm.reset();
                setShowCreateModal(false);
            },
        });
    };

    return (
        <FanLayout title="Tribes">
            <DashboardHero
                role="fan"
                title="Tribes"
                subtitle="Join communities of fans who share your interests and passion for football."
                breadcrumbs={[{ label: 'Social' }, { label: 'Tribes' }]}
                bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
            >
                <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={() => setShowCreateModal(true)}>
                    <i className="fas fa-plus" /> New Tribe
                </button>
            </DashboardHero>

            <AdPlaceholder position="horizontal" className="mb-4" />

            <SummaryTiles
                className="mb-4"
                items={[
                    { label: 'Total Tribes', value: stats.total_tribes, icon: 'fa-layer-group', accent: 'red', subtext: 'Available Communities' },
                    { label: 'Joined Tribes', value: stats.joined_tribes, icon: 'fa-users', accent: 'blue', subtext: 'Your Communities' },
                    { label: 'Public Tribes', value: stats.public_tribes, icon: 'fa-globe', accent: 'rose', subtext: 'Open to all' },
                ]}
            />

            <section className="tfe-slab">
                <div className="tfe-slab__header tribes-slab__header">
                    <div>
                        <h3 className="tfe-slab__title">Available Tribes</h3>
                        <div className="tfe-slab__title-sub">
                            Tribes are scoped to the tournament you're planning — cross-tournament tribes are open to every fan.
                        </div>
                    </div>
                    <form className="tribes-search" onSubmit={submitSearch}>
                        <input
                            type="search"
                            className="tfe-input tfe-input--sm"
                            placeholder="Search tribes…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search tribes"
                        />
                        <button type="submit" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Search">
                            <i className="fas fa-search" />
                        </button>
                    </form>
                </div>

                <div className="tribes-scope">
                    {scopeChips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={() => applyScope(chip.param)}
                            className={`tfe-btn tfe-btn--sm${activeScope === chip.key ? ' is-active' : ''}`}
                            aria-pressed={activeScope === chip.key}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                <div className="tfe-slab__body">
                    {tribes.length > 0 ? (
                        <div className="tribes-grid">
                            {tribes.map((tribe) => {
                                const privacy = PRIVACY[tribe.privacy] || PRIVACY.public;

                                return (
                                    <article key={tribe.id} className="tribe-card">
                                        <Link href={route('fan.tribes.show', tribe.id)} className="tribe-card__cover">
                                            {tribe.banner ? (
                                                <img src={tribe.banner} alt="" />
                                            ) : (
                                                <span className="tribe-card__cover-fallback">
                                                    <i className="fas fa-layer-group" />
                                                </span>
                                            )}
                                            <span className="tribe-card__privacy">
                                                <i className={`fas ${privacy.icon}`} /> {privacy.label}
                                            </span>
                                        </Link>

                                        <div className="tribe-card__body">
                                            <Link href={route('fan.tribes.show', tribe.id)} className="tribe-card__name">
                                                {tribe.name}
                                            </Link>

                                            <TournamentPill
                                                tournamentId={tribe.tournament_id}
                                                shortName={tribe.tournament_short}
                                            />

                                            <p className="tribe-card__desc">
                                                {tribe.description || 'A community for football fans.'}
                                            </p>

                                            <div className="tribe-card__meta">
                                                <span><i className="fas fa-users" /> {tribe.member_count} members</span>
                                                <span><i className="fas fa-comments" /> {tribe.posts_count} posts</span>
                                            </div>

                                            <div className="tribe-card__creator">
                                                Created by {tribe.creator?.name || 'Unknown'}
                                            </div>

                                            <div className="tribe-card__actions">
                                                {tribe.is_member ? (
                                                    <>
                                                        <Link href={route('fan.tribes.show', tribe.id)} className="tfe-btn tfe-btn--sm tfe-btn--filled">
                                                            <i className="fas fa-arrow-right" /> Open
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                            onClick={() => setTribeToLeave(tribe.id)}
                                                            aria-label={`Leave ${tribe.name}`}
                                                            title="Leave tribe"
                                                        >
                                                            <i className="fas fa-sign-out-alt" />
                                                        </button>
                                                    </>
                                                ) : tribe.has_pending_request ? (
                                                    <span className="tfe-pill tfe-pill--pending">
                                                        <i className="fas fa-user-clock" /> Request pending
                                                    </span>
                                                ) : tribe.privacy === 'invite_only' ? (
                                                    <span className="tfe-pill tfe-pill--concluded">
                                                        <i className="fas fa-user-friends" /> Invite only
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="tfe-btn tfe-btn--sm tfe-btn--filled"
                                                            onClick={() => handleJoin(tribe.id)}
                                                        >
                                                            <i className="fas fa-sign-in-alt" />{' '}
                                                            {tribe.can_request ? 'Request to Join' : 'Join'}
                                                        </button>
                                                        {tribe.privacy === 'public' && (
                                                            <Link
                                                                href={route('fan.tribes.show', tribe.id)}
                                                                className="tfe-btn tfe-btn--sm tfe-btn--icon"
                                                                aria-label={`Preview ${tribe.name}`}
                                                                title="Preview tribe"
                                                            >
                                                                <i className="fas fa-eye" />
                                                            </Link>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="tfe-empty">
                            <div className="tfe-empty__icon"><i className="fas fa-layer-group" /></div>
                            <h4 className="tfe-empty__title">
                                {search ? 'No tribes match that search' : 'No tribes here yet'}
                            </h4>
                            <p className="tfe-empty__body">
                                {search
                                    ? 'Try a different name, or widen the scope to every tribe.'
                                    : 'No tribes have been created for this scope. Be the first to start a community.'}
                            </p>
                            <button type="button" className="tfe-btn tfe-empty__action" onClick={() => setShowCreateModal(true)}>
                                <i className="fas fa-plus" /> Create a Tribe
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <TfeModal open={showCreateModal} title="Create a new tribe" onClose={() => setShowCreateModal(false)}>
                <form onSubmit={handleCreate}>
                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="tribe-name">Tribe name</label>
                        <input
                            id="tribe-name"
                            type="text"
                            className="tfe-input"
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            placeholder="e.g. Kenya Ultras"
                            required
                        />
                        {createForm.errors.name && <div className="tfe-form-error">{createForm.errors.name}</div>}
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="tribe-description">Description</label>
                        <textarea
                            id="tribe-description"
                            className="tfe-textarea"
                            value={createForm.data.description}
                            onChange={(e) => createForm.setData('description', e.target.value)}
                            rows="3"
                            placeholder="What is this community about?"
                        />
                        {createForm.errors.description && <div className="tfe-form-error">{createForm.errors.description}</div>}
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-form-label" htmlFor="tribe-privacy">Privacy</label>
                        <select
                            id="tribe-privacy"
                            className="tfe-select"
                            value={createForm.data.privacy}
                            onChange={(e) => createForm.setData('privacy', e.target.value)}
                        >
                            {Object.entries(PRIVACY).map(([value, meta]) => (
                                <option key={value} value={value}>{meta.label} — {meta.blurb}</option>
                            ))}
                        </select>
                        <p className="tfe-form-help">
                            {PRIVACY[createForm.data.privacy]?.blurb}
                            {createForm.data.privacy === 'private' && ' — fans ask to join and a tribe admin approves.'}
                        </p>
                    </div>

                    <div className="tfe-form-field">
                        <label className="tfe-check" htmlFor="tribe-cross">
                            <input
                                id="tribe-cross"
                                type="checkbox"
                                checked={createForm.data.cross_tournament}
                                onChange={(e) => createForm.setData('cross_tournament', e.target.checked)}
                            />
                            <span>
                                <strong>Cross-tournament</strong>
                                <small>
                                    Open the tribe to fans of every tournament. Leave it unchecked to scope it to{' '}
                                    {tournament?.short_name || tournament?.name || 'the current tournament'} only.
                                </small>
                            </span>
                        </label>
                    </div>

                    <div className="tribes-modal__foot">
                        <button type="button" className="tfe-btn" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="tfe-btn tfe-btn--filled" disabled={createForm.processing}>
                            {createForm.processing ? (
                                <><i className="fas fa-spinner fa-spin" /> Creating…</>
                            ) : (
                                <><i className="fas fa-plus" /> Create Tribe</>
                            )}
                        </button>
                    </div>
                </form>
            </TfeModal>

            <ConfirmationDialog
                open={!!tribeToLeave}
                onOpenChange={(open) => !open && setTribeToLeave(null)}
                title="Leave Tribe?"
                description="Are you sure you want to leave this tribe? You can rejoin any time if it is public."
                onConfirm={handleLeave}
                confirmText="Leave"
                variant="destructive"
            />
        </FanLayout>
    );
}
