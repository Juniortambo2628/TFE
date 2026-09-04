import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link, router } from '@inertiajs/react';
import '../../../css/fan/tribes.css';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import { useTournament } from '@/Context/TournamentContext';

export default function Tribes({ auth, tribes, stats, activeScope = 'this_and_cross' }) {
    const { tournament } = useTournament();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTribeData, setNewTribeData] = useState({
        name: '',
        description: '',
        privacy: 'public',
        cross_tournament: false,
    });
    const [tribeToLeave, setTribeToLeave] = useState(null);

    // Scope chips: null = default (this + cross), 'this' = only current,
    // 'cross' = only cross-tournament, 'all' = every tribe.
    const applyScope = (scope) => {
        const url = scope ? `?scope=${scope}` : '';
        router.get(route('fan.tribes') + url, {}, { preserveScroll: true, preserveState: false });
    };
    const scopeChips = [
        { key: 'this_and_cross', label: `${tournament?.short_name || 'This'} + open`, param: null },
        { key: 'this', label: `Only ${tournament?.short_name || 'this'}`, param: 'this' },
        { key: 'cross', label: 'Cross-tournament', param: 'cross' },
        { key: 'all', label: 'Every tribe', param: 'all' },
    ];

    const handleJoin = (tribeId) => {
        router.post(route('fan.tribes.join', tribeId));
    };

    const handleLeave = () => {
        if (tribeToLeave) {
            router.post(route('fan.tribes.leave', tribeToLeave), {
                onSuccess: () => setTribeToLeave(null)
            });
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        router.post(route('fan.tribes.store'), newTribeData, {
            onSuccess: () => setShowCreateModal(false)
        });
    };

    return (
        <FanLayout title="Tribes">
            <div className="container-fluid p-0">
                <DashboardHero role="fan" 
                    title="Tribes"
                    subtitle="Join communities of fans who share your interests and passion for football."
                    breadcrumbs={[{ label: 'Social' }, { label: 'Tribes' }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                <div className="tribes-container pt-0">
                    {/* Ad Placeholder */}
                    <AdPlaceholder position="horizontal" className="mb-4" />

            {/* Summary Cards */}
            <div className="summary-cards-grid mb-5">
                <div className="fan-card-premium glow-red">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                            <i className="fas fa-layer-group"></i>
                        </div>
                        <h3 className="card-title-gaming">Total Tribes</h3>
                        <div className="card-value-gaming">{stats.total_tribes}</div>
                        <div className="text-white-50 small mt-1">Available Communities</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-blue">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                            <i className="fas fa-users"></i>
                        </div>
                        <h3 className="card-title-gaming">Joined Tribes</h3>
                        <div className="card-value-gaming">{stats.joined_tribes}</div>
                        <div className="text-white-50 small mt-1">Your Communities</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-red">
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                            <i className="fas fa-globe"></i>
                        </div>
                        <h3 className="card-title-gaming">Public Tribes</h3>
                        <div className="card-value-gaming">{stats.public_tribes}</div>
                        <div className="text-white-50 small mt-1">Open to all</div>
                    </div>
                </div>
                
                <div className="fan-card-premium glow-blue pointer" onClick={() => setShowCreateModal(true)}>
                    <div className="card-content-gaming">
                        <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                            <i className="fas fa-plus" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <h3 className="card-title-gaming">Create</h3>
                        <div className="card-value-gaming">NEW TRIBE</div>
                        <div className="text-white-50 small mt-1">Start Community</div>
                    </div>
                </div>
            </div>

            {/* Tribes Grid */}
            <div className="content-card mt-4">
                <div className="card-header">
                    <i className="fas fa-layer-group"></i>
                    <h3>Available Tribes</h3>
                </div>
                <p className="text-white-50 px-3 mb-3">
                    Discover and join tribes that match your interests. Tribes are scoped to the tournament you're planning — "cross-tournament" tribes are open to every fan regardless of context.
                </p>

                {/* Scope filter chips */}
                <div className="d-flex flex-wrap gap-2 px-3 mb-3">
                    {scopeChips.map(chip => (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={() => applyScope(chip.param)}
                            className="btn-glass-pill"
                            style={{
                                fontSize: '0.75rem',
                                padding: '4px 12px',
                                background: activeScope === chip.key ? 'rgba(220,20,60,0.25)' : 'rgba(255,255,255,0.04)',
                                borderColor: activeScope === chip.key ? 'rgba(220,20,60,0.5)' : 'rgba(255,255,255,0.08)',
                            }}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
                
                {tribes.length > 0 ? (
                    <div className="tribes-grid">
                        {tribes.map(tribe => (
                            <div key={tribe.id} className="tribe-card">
                                <Link href={route('fan.tribes.show', tribe.id)} className="tribe-link-wrapper">
                                    <div className="tribe-cover" style={{
                                        backgroundImage: `url(${tribe.banner || '/assets/img/logo/TFE-logo.png'})`,
                                        backgroundSize: tribe.banner ? 'cover' : 'contain',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundColor: !tribe.banner ? '#1a1a1a' : 'transparent'
                                    }}>
                                        <div className="tribe-privacy">
                                            <i className={`fas fa-${tribe.privacy === 'public' ? 'globe' : (tribe.privacy === 'private' ? 'lock' : 'user-friends')}`}></i>
                                            <span>{tribe.privacy.charAt(0).toUpperCase() + tribe.privacy.slice(1)}</span>
                                        </div>
                                    </div>
                                </Link>
                                <div className="tribe-content">
                                    <Link href={route('fan.tribes.show', tribe.id)} className="text-decoration-none">
                                        <h3 className="tribe-name">{tribe.name}</h3>
                                    </Link>
                                    {/* Tournament pill — cross-tournament tribes read as
                                        "Open" so the fan knows they're not scoped. */}
                                    <span
                                        className="d-inline-flex align-items-center gap-1 mb-2"
                                        style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                            background: tribe.tournament_id ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                                            color: tribe.tournament_id ? '#3b82f6' : '#10b981',
                                            fontWeight: 600,
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        <i className={`fas ${tribe.tournament_id ? 'fa-trophy' : 'fa-globe'}`} style={{ fontSize: '0.55rem' }}></i>
                                        {tribe.tournament_short || (tribe.tournament_id ? tribe.tournament_id : 'Open to all')}
                                    </span>
                                    <p className="tribe-description">{tribe.description || 'A community for football fans'}</p>
                                    
                                    <div className="tribe-stats">
                                        <div className="tribe-members">
                                            <i className="fas fa-users"></i>
                                            <span>{tribe.member_count} members</span>
                                        </div>
                                        <div className="tribe-posts">
                                            <i className="fas fa-comments"></i>
                                            <span>{tribe.posts_count} posts</span>
                                        </div>
                                    </div>
                                    
                                    <div className="tribe-creator">
                                        Created by {tribe.creator?.name || 'Unknown'}
                                    </div>
                                    
                                    <div className="d-flex gap-2">
                                        {tribe.is_member ? (
                                            <>
                                                <Link 
                                                    href={route('fan.tribes.show', tribe.id)}
                                                    className="btn-glass-pill flex-1 justify-content-center"
                                                >
                                                    <i className="fas fa-eye me-2"></i>View
                                                </Link>
                                                <button 
                                                    className="btn-glass-pill justify-content-center px-3"
                                                    onClick={() => setTribeToLeave(tribe.id)}
                                                    style={{ backgroundColor: 'rgba(220, 20, 60, 0.2)', borderColor: 'rgba(220, 20, 60, 0.4)' }}
                                                    title="Leave Tribe"
                                                >
                                                    <i className="fas fa-sign-out-alt"></i>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button 
                                                    className="btn-glass-pill flex-1 justify-content-center"
                                                    onClick={() => handleJoin(tribe.id)}
                                                >
                                                    <i className="fas fa-sign-in-alt me-2"></i>Join
                                                </button>
                                                {(tribe.privacy === 'public' || tribe.is_member) && (
                                                    <Link 
                                                        href={route('fan.tribes.show', tribe.id)}
                                                        className="btn-glass-pill justify-content-center px-3"
                                                        title="Preview Tribe"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </Link>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state py-5 text-center">
                        <i className="fas fa-layer-group fa-3x mb-3 text-white-50"></i>
                        <h4 className="text-white">No Tribes Available</h4>
                        <p className="text-white-50">No tribes have been created yet. Be the first to create a community!</p>
                        <button className="btn-glass-pill mt-3 mx-auto" onClick={() => setShowCreateModal(true)}>
                            <i className="fas fa-plus me-2" style={{ fontSize: '0.9rem' }}></i>Create First Tribe
                        </button>
                    </div>
                )}
            </div>

            {/* Create Tribe Modal */}
            {showCreateModal && (
                <div className="tribe-modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="tribe-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Tribe</h3>
                            <button className="close-modal-btn" onClick={() => setShowCreateModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <form onSubmit={handleCreate}>
                                <div className="mb-4">
                                    <label className="form-label">Tribe Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={newTribeData.name}
                                        onChange={e => setNewTribeData({...newTribeData, name: e.target.value})}
                                        placeholder="e.g. Kenya Ultras"
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        className="form-control" 
                                        value={newTribeData.description}
                                        onChange={e => setNewTribeData({...newTribeData, description: e.target.value})}
                                        rows="3"
                                        placeholder="What is this community about?"
                                    ></textarea>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Privacy</label>
                                    <select 
                                        className="form-select"
                                        value={newTribeData.privacy}
                                        onChange={e => setNewTribeData({...newTribeData, privacy: e.target.value})}
                                    >
                                        <option value="public">Public (Open to everyone)</option>
                                        <option value="private">Private (Approval required)</option>
                                        <option value="invite_only">Invite Only</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="d-flex align-items-start gap-2 text-white" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={newTribeData.cross_tournament}
                                            onChange={e => setNewTribeData({ ...newTribeData, cross_tournament: e.target.checked })}
                                            className="mt-1"
                                        />
                                        <span>
                                            <span className="fw-semibold">Cross-tournament</span>
                                            <span className="d-block text-white-50 small">
                                                Open the tribe to fans of every tournament. Uncheck to scope it to <strong>{tournament?.short_name || tournament?.name || 'the current tournament'}</strong> only.
                                            </span>
                                        </span>
                                    </label>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-submit-tribe">Create Tribe</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                open={!!tribeToLeave}
                onOpenChange={(open) => !open && setTribeToLeave(null)}
                title="Leave Tribe?"
                description="Are you sure you want to leave this tribe? You can rejoined anytime if it is public."
                onConfirm={handleLeave}
                confirmText="Leave"
                variant="destructive"
            />
        </div>
    </div>
</FanLayout>
    );
}
