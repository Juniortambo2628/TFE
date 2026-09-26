import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import ImageUpload from '@/Components/Common/ImageUpload';
import AccentCard from '@/Components/Common/AccentCard';
import SplitEditorLayout from '@/Components/Common/SplitEditorLayout';
import StadiumImageCard from '@/Components/Admin/StadiumImageCard';
import { Link, router, usePage } from '@inertiajs/react';
import { assetPath } from '@/lib/assets';

/**
 * Admin → Tournaments → edit one tournament.
 *
 * Same shape as the partner edit page: form on the left, sticky live preview
 * on the right, one save bar at the bottom. Everything a tournament owns is
 * here — branding, the three images (trophy, landing hero background,
 * organiser card watermark) and its venue photography.
 *
 * Config (config/tournaments.php) is the default for every field; an empty
 * value means "fall back to config", which is how TournamentService reads it.
 */
export default function TournamentEdit({ tournament, fields, isFeatured, venues = [], hasCatalogue }) {
    const flash = usePage().props.flash || {};

    const [tagline, setTagline] = useState(fields.tagline.value || '');
    const [accent, setAccent] = useState(fields.accent.value || fields.accent.resolved || '#dc143c');
    const [files, setFiles] = useState({ trophy_image: null, hero_image: null, organizer_card_bg: null });
    const [cleared, setCleared] = useState({});
    const [processing, setProcessing] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Tournaments', href: route('admin.tournaments.index') },
        { label: tournament.name },
    ];

    // Which image to show: a freshly picked file wins, then the saved
    // override, then the config default.
    const previewFor = (field) => {
        if (cleared[field]) return fields[field].default ? assetPath(fields[field].default) : null;
        const saved = fields[field].value || fields[field].default;
        return saved ? assetPath(saved) : null;
    };

    const pickFile = (field) => (file) => {
        setFiles((f) => ({ ...f, [field]: file }));
        setCleared((c) => ({ ...c, [field]: false }));
    };

    const clearFile = (field) => () => {
        setFiles((f) => ({ ...f, [field]: null }));
        setCleared((c) => ({ ...c, [field]: true }));
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('admin.tournaments.update', tournament.id), {
            tagline,
            accent,
            ...Object.fromEntries(
                Object.entries(files).filter(([, file]) => !!file),
            ),
            ...Object.fromEntries(
                Object.entries(cleared)
                    .filter(([, on]) => on)
                    .map(([field]) => [`clear_${field}`, true]),
            ),
        }, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const refreshThis = () => {
        setRefreshing(true);
        router.post(route('admin.tournaments.refresh'), { tournament: tournament.id }, {
            preserveScroll: true,
            onFinish: () => setRefreshing(false),
        });
    };

    const IMAGE_FIELDS = [
        {
            key: 'trophy_image',
            label: 'Trophy image',
            hint: 'Transparent PNG, portrait — floats on the hero card',
        },
        {
            key: 'hero_image',
            label: 'Landing hero background',
            hint: '1920×800 landscape — behind the landing hero',
        },
        {
            key: 'organizer_card_bg',
            label: 'Organiser card watermark',
            hint: 'Organiser brand visual behind the tournament card',
        },
    ];

    return (
        <AdminLayout title={`Edit ${tournament.name}`}>
            <DashboardHero
                role="admin"
                title={tournament.name}
                subtitle={`${tournament.status || 'tournament'}${tournament.hosts?.length ? ' · ' + tournament.hosts.join(', ') : ''}`}
                breadcrumbs={breadcrumbs}
                action={{
                    label: 'View page',
                    icon: 'fas fa-external-link-alt',
                    onClick: () => window.open(tournament.public_url, '_blank'),
                }}
            />

            <form onSubmit={submit}>
                <SplitEditorLayout preview={(
                    <>
                        <AccentCard
                            LinkComponent="div"
                            accent={accent}
                            title={tournament.name}
                            eyebrow={tournament.short_name || tournament.id}
                            desc={tagline || fields.tagline.default}
                            status={tournament.status}
                            bgImage={previewFor('organizer_card_bg') || undefined}
                            artwork={previewFor('trophy_image')
                                ? { src: previewFor('trophy_image'), alt: '', variant: 'float' }
                                : { icon: 'fas fa-trophy' }}
                            pills={tournament.hosts || []}
                            meta={[
                                { label: 'Teams', value: tournament.num_teams || '—' },
                                { label: 'Venues', value: venues.length || '—' },
                            ]}
                        />

                        <div className="admin-tournament-preview__hero">
                            <span className="tfe-form-label">Landing hero background</span>
                            {previewFor('hero_image') ? (
                                <img src={previewFor('hero_image')} alt="" loading="lazy" />
                            ) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <p className="tfe-empty__body mb-0">No hero background set.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}>
                    {/* ── Branding ──────────────────────────────── */}
                        <section className="tfe-slab">
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">Branding</h2>
                                    <p className="tfe-slab__title-sub">
                                        Leave a field blank to use the value from config.
                                    </p>
                                </div>
                                {isFeatured && <span className="tfe-pill tfe-pill--approved">Featured</span>}
                            </div>
                            <div className="tfe-slab__body">
                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="t-tagline">Tagline</label>
                                    <input
                                        id="t-tagline"
                                        className="tfe-input"
                                        value={tagline}
                                        placeholder={fields.tagline.default || 'e.g. East Africa welcomes AFCON…'}
                                        onChange={(e) => setTagline(e.target.value)}
                                    />
                                    <p className="tfe-form-help">Shown under the tournament name on the hero card.</p>
                                </div>

                                <div className="tfe-form-field">
                                    <label className="tfe-form-label" htmlFor="t-accent">Accent colour</label>
                                    <input
                                        id="t-accent"
                                        type="color"
                                        className="tfe-color-swatch"
                                        value={accent}
                                        onChange={(e) => setAccent(e.target.value)}
                                    />
                                    <p className="tfe-form-help">
                                        Drives the card glow and the active host country on the world map.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* ── Imagery ───────────────────────────────── */}
                        <section className="tfe-slab mt-4">
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">Imagery</h2>
                                    <p className="tfe-slab__title-sub">
                                        Upload to override; remove to fall back to the shipped default.
                                    </p>
                                </div>
                            </div>
                            <div className="tfe-slab__body">
                                <div className="admin-cms-grid admin-cms-grid--tight">
                                    {IMAGE_FIELDS.map((f) => (
                                        <div className="tfe-form-field" key={f.key}>
                                            <label className="tfe-form-label">{f.label}</label>
                                            <ImageUpload
                                                value={previewFor(f.key)}
                                                hint={f.hint}
                                                onFile={pickFile(f.key)}
                                                onClear={clearFile(f.key)}
                                            />
                                            {fields[f.key].value ? (
                                                <p className="tfe-form-help">Overridden — remove to restore the default.</p>
                                            ) : (
                                                <p className="tfe-form-help">Showing the config default.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ── Venues ────────────────────────────────── */}
                        <section className="tfe-slab mt-4">
                            <div className="tfe-slab__header">
                                <div>
                                    <h2 className="tfe-slab__title">Venue imagery</h2>
                                    <p className="tfe-slab__title-sub">
                                        {venues.length} venue{venues.length === 1 ? '' : 's'}
                                        {hasCatalogue ? ' · local catalogue' : ' · from Wikipedia'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="tfe-btn tfe-btn--sm"
                                    disabled={refreshing}
                                    onClick={refreshThis}
                                >
                                    <i className={refreshing ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'} />{' '}
                                    {refreshing ? 'Refreshing…' : 'Refresh'}
                                </button>
                            </div>
                            <div className="tfe-slab__body">
                                {venues.length === 0 ? (
                                    <div className="tfe-empty tfe-empty--inline">
                                        <div className="tfe-empty__icon"><i className="fas fa-image" /></div>
                                        <p className="tfe-empty__body mb-0">
                                            No venues resolved yet — try Refresh above.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="admin-cms-grid admin-cms-grid--tight">
                                        {venues.map((venue) => (
                                            <StadiumImageCard
                                                key={venue.slug}
                                                venue={venue}
                                                tournamentId={tournament.id}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {flash.tournament_refresh_output && (
                            <pre className="admin-refresh-output mt-3">{flash.tournament_refresh_output}</pre>
                        )}
                </SplitEditorLayout>

                <div className="mt-4 d-flex gap-2 align-items-center">
                    <Link href={route('admin.tournaments.index')} className="tfe-btn">
                        <i className="fas fa-arrow-left" /> Back
                    </Link>
                    <button
                        type="submit"
                        className="tfe-btn tfe-btn--filled"
                        disabled={processing}
                        style={{ marginLeft: 'auto' }}
                    >
                        <i className="fas fa-save" /> {processing ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
