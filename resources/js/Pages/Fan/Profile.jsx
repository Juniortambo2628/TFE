import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { usePage, router, Link, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import '../../../css/fan/profile.css';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import DashboardModal from '@/Components/Common/DashboardModal';
import SplitEditorLayout from '@/Components/Common/SplitEditorLayout';
import IdentityPreview from '@/Components/Common/IdentityPreview';
import ImageUpload from '@/Components/Common/ImageUpload';
import { useTournament } from '@/Context/TournamentContext';
import { useTournamentTeams } from '@/Hooks/useTournamentTeams';

/**
 * Fan profile — Sprint 53 rebuild.
 *
 * Two things were wrong with the page this replaces.
 *
 *  1. **You could not change your avatar.** "Change Avatar" opened Ready
 *     Player Me's hosted 3D creator, embedded from `demo.readyplayer.me`.
 *     That subdomain stopped resolving, so the button opened a browser DNS
 *     error page — and it was the only way to set a picture. The avatar is an
 *     ordinary image upload now, through the platform's own pipeline
 *     (`ImageUpload` → `MediaLibraryService`: compressed, recorded in the
 *     media library, no third party and no `model-viewer` script). Anyone who
 *     already has a stored `.glb` avatar keeps it as their stored value; the
 *     page just renders the fallback image instead of a 3D canvas.
 *  2. **It looked like nothing else on the platform.** Editing happened in a
 *     five-tab modal over a read-only card, so you could not see your changes
 *     land. It now uses SplitEditorLayout — form left, live preview right —
 *     the same arrangement as Admin → Tournaments, the Content CMS and the
 *     partner profile.
 *
 * Security settings are not duplicated here any more either: 2FA lives on the
 * shared Security page (one surface, one implementation) and this page links
 * to it.
 */
export default function Profile({
    auth,
    socialStats,
    profile,
    isOwnProfile = true,
    isFollowing = false,
    userTribes = [],
    userPosts = [],
    followers = [],
    followingList = [],
}) {
    const { tournament } = useTournament();
    const { user } = auth;
    const { assetUrl } = usePage().props;

    const defaultAvatar = `${assetUrl}assets/img/avatars/default-avatar.png`;

    const fanProfile = profile || {
        name: user.name,
        email: user.email,
        avatar: user.avatar || defaultAvatar,
        team_support: 'Not Set',
    };

    const [following, setFollowing] = useState(isFollowing);
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [networkTab, setNetworkTab] = useState('followers');

    const stats = socialStats || { followers: 0, tribes: 0, posts: 0 };

    // ── Profile form ────────────────────────────────────────────────────
    const form = useForm({
        _method: 'put',
        name: fanProfile.name || '',
        team_support: fanProfile.team_support || '',
        bio: fanProfile.bio || '',
        cover_image: fanProfile.cover_image || '',
        cover_image_file: null,
        marketing_consent: !!fanProfile.marketing_consent,
        community_consent: !!fanProfile.community_consent,
    });
    const { data, setData, processing, errors, isDirty } = form;

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            // The controller reads one `cover_image` key that is either an
            // uploaded file or the existing URL string.
            cover_image: d.cover_image_file || d.cover_image || '',
        }));
        form.post(route('fan.profile.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Profile updated successfully!'),
        });
    };

    // ── Avatar (its own small form — one field, one endpoint) ───────────
    const avatarForm = useForm({ avatar: null, avatar_url: fanProfile.avatar || '' });

    const uploadAvatar = (file) => {
        avatarForm.setData('avatar', file);
        avatarForm.transform(() => ({ avatar: file }));
        avatarForm.post(route('fan.profile.avatar.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Avatar updated!'),
            onError: (errs) => toast.error(errs.avatar || 'Could not update your avatar.'),
        });
    };

    // Tournament-driven team list — reflects whichever tournament the fan
    // has active. Falls back to config team codes if Wikipedia is empty.
    const tournamentTeams = useTournamentTeams({ assetUrl });
    const teams = [
        ...tournamentTeams.map((t) => ({
            name: t.value,
            iso: t.iso || '',
            flag: t.flag,
            icon: t.flag ? null : 'fas fa-futbol',
        })),
        { name: 'Other', icon: 'fas fa-globe' },
    ];

    // A stored Ready Player Me `.glb` is not an image — render the default
    // rather than a broken <img> for the handful of fans who have one.
    const avatarSrc = (fanProfile.avatar || '').endsWith('.glb')
        ? defaultAvatar
        : (fanProfile.avatar || defaultAvatar);

    const identity = (
        <>
            <IdentityPreview
                name={isOwnProfile ? data.name : fanProfile.name}
                sub={fanProfile.email}
                avatar={avatarSrc}
                badge={(isOwnProfile ? data.team_support : fanProfile.team_support) || undefined}
                rows={[
                    { icon: 'fas fa-users', value: `${stats.followers} followers` },
                    { icon: 'fas fa-layer-group', value: `${stats.tribes} tribes` },
                    { icon: 'fas fa-comment-alt', value: `${stats.posts} posts` },
                ]}
            />

            <div className="tfe-slab">
                <div className="tfe-slab__body">
                    <div className="profile-network-row">
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--sm flex-fill justify-content-center"
                            onClick={() => { setNetworkTab('followers'); setShowNetworkModal(true); }}
                        >
                            Followers
                        </button>
                        <button
                            type="button"
                            className="tfe-btn tfe-btn--sm flex-fill justify-content-center"
                            onClick={() => { setNetworkTab('following'); setShowNetworkModal(true); }}
                        >
                            Following
                        </button>
                    </div>

                    {isOwnProfile ? (
                        <Link href={route('fan.security')} className="tfe-btn tfe-btn--sm w-100 justify-content-center mt-2">
                            <i className="fas fa-shield-alt" /> Security settings
                        </Link>
                    ) : (
                        <div className="profile-network-row mt-2">
                            <button
                                type="button"
                                className="tfe-btn tfe-btn--sm flex-fill justify-content-center"
                                onClick={() => router.post(route('fan.follow.toggle', profile.id), {}, {
                                    preserveScroll: true,
                                    onSuccess: () => setFollowing(!following),
                                })}
                            >
                                <i className={`fas ${following ? 'fa-check' : 'fa-user-plus'}`} />
                                {following ? ' Following' : ' Follow'}
                            </button>
                            <button
                                type="button"
                                className="tfe-btn tfe-btn--sm flex-fill justify-content-center"
                                onClick={() => router.visit(route('fan.communication'))}
                            >
                                <i className="fas fa-envelope" /> Message
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    const community = (
        <>
            <section className="tfe-slab">
                <div className="tfe-slab__header">
                    <h3 className="tfe-slab__title">
                        <i className="fas fa-users me-2" aria-hidden="true" /> {isOwnProfile ? 'My tribes' : 'Joined tribes'}
                    </h3>
                </div>
                <div className="tfe-slab__body">
                    {userTribes.length > 0 ? (
                        <div className="tribes-grid-compact">
                            {userTribes.map((tribe) => (
                                <Link key={tribe.id} href={route('fan.tribes.show', tribe.slug)} className="compact-tribe-item">
                                    <img src={tribe.avatar || '/assets/img/fan/tribes/default.png'} alt={tribe.name} className="compact-tribe-avatar" />
                                    <span className="compact-tribe-name">{tribe.name}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="tfe-empty tfe-empty--inline">
                            <div className="tfe-empty__icon"><i className="fas fa-users-slash" /></div>
                            <div className="tfe-empty__body">Hasn&apos;t joined any tribes yet.</div>
                        </div>
                    )}
                </div>
            </section>

            <section className="tfe-slab">
                <div className="tfe-slab__header">
                    <h3 className="tfe-slab__title">
                        <i className="fas fa-comment-alt me-2" aria-hidden="true" /> Recent activity
                    </h3>
                </div>
                <div className="tfe-slab__body">
                    {userPosts.length > 0 ? userPosts.map((post) => (
                        <div key={post.id} className="profile-post-item" onClick={() => router.visit(route('fan.feed.post.show', post.id))}>
                            <div className="profile-post-header">
                                <span className="profile-post-time">{post.created_at}</span>
                            </div>
                            <p className="profile-post-excerpt">
                                {post.content.length > 80 ? `${post.content.substring(0, 80)}…` : post.content}
                            </p>
                            <div className="profile-post-stats">
                                <span><i className="far fa-heart me-1" /> {post.likes_count}</span>
                                <span><i className="far fa-comment me-1" /> {post.comment_count}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="tfe-empty tfe-empty--inline">
                            <div className="tfe-empty__icon"><i className="fas fa-pencil-alt" /></div>
                            <div className="tfe-empty__body">No recent posts to show.</div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );

    return (
        <FanLayout title={isOwnProfile ? 'My Profile' : `${fanProfile.name}'s Profile`}>
            <div className="profile-page">
                <DashboardHero
                    role="fan"
                    title={isOwnProfile ? 'My Profile' : fanProfile.name}
                    subtitle={isOwnProfile
                        ? `Manage your personal information and preferences for your ${tournament?.short_name || 'tournament'} journey.`
                        : `Viewing the profile of ${fanProfile.name}. Supports ${fanProfile.team_support || 'the beautiful game'}.`}
                    breadcrumbs={[{ label: isOwnProfile ? 'Profile' : fanProfile.name }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                <div className="mb-4">
                    <AdPlaceholder position="horizontal" />
                </div>

                <SplitEditorLayout previewTitle={isOwnProfile ? 'Live preview' : 'Profile'} preview={identity}>
                    {isOwnProfile ? (
                        <div className="tfe-editor-stack">
                            <form onSubmit={handleProfileUpdate} className="tfe-editor-stack">
                                <section className="tfe-slab">
                                    <div className="tfe-slab__header">
                                        <h3 className="tfe-slab__title">
                                            <i className="fas fa-user me-2" aria-hidden="true" /> Personal details
                                        </h3>
                                    </div>
                                    <div className="tfe-slab__body">
                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label">Full name</label>
                                            <input
                                                type="text"
                                                className="tfe-input"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                required
                                            />
                                            {errors.name && <div className="tfe-form-error">{errors.name}</div>}
                                        </div>
                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label">Email address</label>
                                            <input
                                                type="email"
                                                className="tfe-input profile-input-disabled"
                                                value={fanProfile.email}
                                                disabled
                                                title="Email cannot be changed"
                                            />
                                            <p className="tfe-form-help">
                                                Contact + KYC details (phone, address, country) live with your booking,
                                                travel, finance and ticket partners — they collect and hold whatever they
                                                need to service you.
                                            </p>
                                        </div>
                                        <div className="tfe-form-field">
                                            <label className="tfe-form-label">Bio / about you</label>
                                            <textarea
                                                className="tfe-textarea"
                                                rows={4}
                                                value={data.bio}
                                                onChange={(e) => setData('bio', e.target.value)}
                                                placeholder="Tell fans about your journey…"
                                            />
                                            {errors.bio && <div className="tfe-form-error">{errors.bio}</div>}
                                        </div>
                                    </div>
                                </section>

                                <section className="tfe-slab">
                                    <div className="tfe-slab__header">
                                        <h3 className="tfe-slab__title">
                                            <i className="fas fa-futbol me-2" aria-hidden="true" /> Supporting team
                                        </h3>
                                        <span className="tfe-slab__title-sub">{tournament?.short_name || 'Tournament'}</span>
                                    </div>
                                    <div className="tfe-slab__body">
                                        <div className="team-grid no-scrollbar dash-team-grid">
                                            {teams.map((team) => (
                                                <button
                                                    type="button"
                                                    key={team.name}
                                                    className={`team-option dash-team-option ${data.team_support === team.name ? 'selected' : ''}`}
                                                    onClick={() => setData('team_support', team.name)}
                                                >
                                                    {team.flag
                                                        ? <img src={team.flag} alt="" className="team-flag dash-team-flag" />
                                                        : <i className={`${team.icon} team-icon`} />}
                                                    <span className="team-name text-white dash-team-name">{team.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <section className="tfe-slab">
                                    <div className="tfe-slab__header">
                                        <h3 className="tfe-slab__title">
                                            <i className="fas fa-image me-2" aria-hidden="true" /> Cover image
                                        </h3>
                                    </div>
                                    <div className="tfe-slab__body">
                                        <ImageUpload
                                            value={data.cover_image}
                                            onFile={(f) => setData('cover_image_file', f)}
                                            onClear={() => { setData('cover_image', ''); setData('cover_image_file', null); }}
                                            gallery
                                            onPick={(url) => { setData('cover_image', url); setData('cover_image_file', null); }}
                                        />
                                        {errors.cover_image && <div className="tfe-form-error">{errors.cover_image}</div>}
                                    </div>
                                </section>

                                <section className="tfe-slab">
                                    <div className="tfe-slab__header">
                                        <h3 className="tfe-slab__title">
                                            <i className="fas fa-envelope-open-text me-2" aria-hidden="true" /> Communication preferences
                                        </h3>
                                    </div>
                                    <div className="tfe-slab__body">
                                        <div className="tfe-setting-row">
                                            <div>
                                                <h4>Marketing messages</h4>
                                                <p>News, offers and promotions.</p>
                                            </div>
                                            <button
                                                type="button"
                                                className={`toggle-switch ${data.marketing_consent ? 'active' : ''}`}
                                                onClick={() => setData('marketing_consent', !data.marketing_consent)}
                                                aria-pressed={data.marketing_consent}
                                                aria-label="Toggle marketing messages"
                                            />
                                        </div>
                                        <div className="tfe-setting-row">
                                            <div>
                                                <h4>Community access</h4>
                                                <p>Tribe invitations and exclusive community events.</p>
                                            </div>
                                            <button
                                                type="button"
                                                className={`toggle-switch ${data.community_consent ? 'active' : ''}`}
                                                onClick={() => setData('community_consent', !data.community_consent)}
                                                aria-pressed={data.community_consent}
                                                aria-label="Toggle community access"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="tfe-form-actions">
                                    <button type="submit" className="tfe-btn tfe-btn--filled" disabled={processing || !isDirty}>
                                        {processing ? 'Saving…' : 'Save changes'}
                                    </button>
                                </div>
                            </form>

                            {/* Its own endpoint, so its own form — uploading a
                                picture should not require saving the rest. */}
                            <section className="tfe-slab">
                                <div className="tfe-slab__header">
                                    <h3 className="tfe-slab__title">
                                        <i className="fas fa-camera me-2" aria-hidden="true" /> Profile picture
                                    </h3>
                                    <span className="tfe-slab__title-sub">Saves as soon as you choose one</span>
                                </div>
                                <div className="tfe-slab__body">
                                    <ImageUpload
                                        compact
                                        value={avatarSrc}
                                        onFile={uploadAvatar}
                                        onClear={() => {
                                            avatarForm.transform(() => ({ avatar_url: '' }));
                                            avatarForm.post(route('fan.profile.avatar.update'), {
                                                preserveScroll: true,
                                                onSuccess: () => toast.success('Avatar reset to the default.'),
                                            });
                                        }}
                                        label="Upload a profile picture"
                                    />
                                    {avatarForm.processing && <p className="tfe-form-help mt-2">Uploading…</p>}
                                </div>
                            </section>

                            {community}
                        </div>
                    ) : (
                        <div className="tfe-editor-stack">
                            {fanProfile.bio && (
                                <section className="tfe-slab">
                                    <div className="tfe-slab__header">
                                        <h3 className="tfe-slab__title">
                                            <i className="fas fa-quote-left me-2" aria-hidden="true" /> About
                                        </h3>
                                    </div>
                                    <div className="tfe-slab__body">
                                        <p className="mb-0 text-white-50">{fanProfile.bio}</p>
                                    </div>
                                </section>
                            )}
                            {community}
                        </div>
                    )}
                </SplitEditorLayout>

                {/* Network (followers / following) */}
                <DashboardModal
                    open={showNetworkModal}
                    onOpenChange={setShowNetworkModal}
                    title={networkTab === 'followers' ? 'Followers' : 'Following'}
                    maxWidth="md"
                >
                    <div className="network-modal-content p-2">
                        <div className="user-list-container d-flex flex-column gap-2">
                            {(networkTab === 'followers' ? followers : followingList).length > 0 ? (
                                (networkTab === 'followers' ? followers : followingList).map((person) => (
                                    <div key={person.id} className="user-list-item d-flex align-items-center justify-content-between p-3 rounded dash-modal-subtle">
                                        <div className="d-flex align-items-center gap-3">
                                            <img
                                                src={person.avatar || `${assetUrl}assets/img/fan/avatars/default.png`}
                                                className="user-list-avatar dash-avatar dash-avatar-md"
                                                alt={person.name}
                                            />
                                            <div>
                                                <h4 className="h6 mb-0 text-white fw-bold">{person.name}</h4>
                                                <small className="text-white-50">Fan Profile</small>
                                            </div>
                                        </div>
                                        <Link
                                            href={route('fan.profile.show', person.id)}
                                            className="tfe-btn tfe-btn--sm"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__icon">
                                        <i className={`fas ${networkTab === 'followers' ? 'fa-user-friends' : 'fa-users'}`} />
                                    </div>
                                    <div className="tfe-empty__body">No {networkTab} found.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </DashboardModal>
            </div>
        </FanLayout>
    );
}
