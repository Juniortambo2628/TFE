import React, { useState, useEffect } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import SearchableSelect from '@/Components/SearchableSelect';
import { countries } from '../../Data/countries';
import WorldCup2026Data from '../../Data/WorldCup2026Data';
import '../../../css/fan/profile.css';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Common/DashboardModal';
import { useTournament } from '@/Context/TournamentContext';
import { SPECIAL_MAPPINGS } from '@/Data/countryFlags';

export default function Profile({ auth, socialStats, profile, additionalSettings, isOwnProfile = true, isFollowing = false, userTribes = [], userPosts = [], followers = [], followingList = [], security_settings = {} }) {
    const { tournament } = useTournament();
    const { user } = auth;
    const { flash, assetUrl } = usePage().props;

    // Dynamically load model-viewer for 3D avatar rendering
    useEffect(() => {
        if (!document.querySelector('script[src*="model-viewer"]')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
            document.head.appendChild(script);
        }
    }, []);

    // Use profile data from props or fallback to auth user
    const fanProfile = profile || {
        name: user.name,
        email: user.email,
        avatar: user.avatar || `${assetUrl}assets/img/avatars/default-avatar.png`,
        country: 'Kenya', // Default or fetch
        team_support: 'Not Set',
    };

    const [activeTab, setActiveTab] = useState('info');
    const [showAvatarCreator, setShowAvatarCreator] = useState(false);
    const [following, setFollowing] = useState(isFollowing);
    
    // 2FA Modal State
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [activeSecurityTab, setActiveSecurityTab] = useState('2fa');
    const [setupCode, setSetupCode] = useState('');
    const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);
    
    // Edit Profile Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [networkTab, setNetworkTab] = useState('followers'); // 'followers' or 'following'
    const [editProfileTab, setEditProfileTab] = useState('personal');
    const [coverFiles, setCoverFiles] = useState([]);
    const [editForm, setEditForm] = useState({
        name: fanProfile.name,
        email: fanProfile.email,
        country: fanProfile.country,
        country_code: fanProfile.country_code || '',
        team_support: fanProfile.team_support,
        date_of_birth: fanProfile.date_of_birth || '',
        phone: fanProfile.phone || '',
        bio: fanProfile.bio || '',
        cover_image: fanProfile.cover_image || '',
        marketing_consent: !!fanProfile.marketing_consent,
        community_consent: !!fanProfile.community_consent,
        terms_agreed: !!fanProfile.terms_agreed
    });

    const toggle2FA = () => {
        if (security_settings.two_factor_enabled) {
            setConfirmDisable2FA(true);
        } else {
            router.post(route('fan.security.two-factor'), {}, { 
                preserveScroll: true,
                onSuccess: () => setShow2FAModal(true)
            });
        }
    };

    const handleDisable2FA = () => {
        router.post(route('fan.security.two-factor'), {}, { 
            preserveScroll: true,
            onSuccess: () => setConfirmDisable2FA(false)
        });
    };

    const confirm2FA = (e) => {
        e.preventDefault();
        router.post(route('fan.security.two-factor.confirm'), {
            code: setupCode,
            secret: flash.two_factor_setup?.secret
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShow2FAModal(false);
                setSetupCode('');
            }
        });
    };

    const handleAvatarExported = (event) => {
        const avatarUrl = event.data.url;
        // Close modal
        setShowAvatarCreator(false);
        // Save to backend
        router.post(route('fan.profile.avatar.update'), { 
            avatar_url: avatarUrl 
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Inertia handles state updates automatically via prop refresh
            }
        });
    };

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', editForm.name);
        formData.append('country', editForm.country || '');
        formData.append('country_code', editForm.country_code || '');
        formData.append('team_support', editForm.team_support || '');
        formData.append('date_of_birth', editForm.date_of_birth || '');
        formData.append('phone', editForm.phone || '');
        formData.append('bio', editForm.bio || '');
        formData.append('marketing_consent', editForm.marketing_consent ? '1' : '0');
        formData.append('community_consent', editForm.community_consent ? '1' : '0');
        
        if (coverFiles.length > 0 && coverFiles[0].file) {
            formData.append('cover_image', coverFiles[0].file);
        } else {
            formData.append('cover_image', editForm.cover_image || '');
        }
        router.post(route('fan.profile.update'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowEditModal(false);
                setCoverFiles([]);
                toast.success('Profile updated successfully!');
            }
        });
    };

    const stats = socialStats || { followers: 0, tribes: 0, posts: 0 };

    const editTabs = [
        { id: 'personal', label: 'Personal', icon: 'fas fa-user' },
        { id: 'team', label: 'My Team', icon: 'fas fa-futbol' },
        { id: 'bio', label: 'Bio', icon: 'fas fa-pen' },
        { id: 'appearance', label: 'Appearance', icon: 'fas fa-image' },
        { id: 'legal', label: 'Preferences', icon: 'fas fa-shield-alt' }
    ];

    const securityTabs = [
        { id: '2fa', label: 'Two-Factor Auth', icon: 'fas fa-shield-alt' }
    ];

    const teams = [
        ...WorldCup2026Data.qualifiedTeams.map(teamName => {
            let iso = SPECIAL_MAPPINGS[teamName];
            let flag = null;
            if (iso) {
                 flag = `${assetUrl}assets/Flags/${iso.toLowerCase()}.png`;
            } else {
                 const country = countries.find(c => 
                    c.value.toLowerCase() === teamName.toLowerCase() || 
                    (teamName === 'USA' && c.iso === 'US') ||
                    (teamName === 'Korea Republic' && c.iso === 'KR') ||
                    (teamName === 'IR Iran' && c.iso === 'IR') ||
                    (teamName === 'Côte d\'Ivoire' && c.iso === 'CI')
                );
                if (country) {
                    iso = country.iso;
                    flag = `${assetUrl}assets/Flags/${country.iso.toLowerCase()}.png`;
                }
            }
            return {
                name: teamName,
                iso: iso || '',
                flag: flag,
                icon: flag ? null : 'fas fa-futbol'
            };
        }),
        { name: 'Other', icon: 'fas fa-globe' }
    ];

    return (
        <FanLayout title={isOwnProfile ? "My Profile" : `${fanProfile.name}'s Profile`}>
             <div className="container-fluid profile-page">
                {/* Profile Header Card */}
                <DashboardHero role="fan" 
                    title={isOwnProfile ? "My Profile" : fanProfile.name}
                    subtitle={isOwnProfile 
                        ? `Manage your personal information and preferences for your ${tournament?.short_name || 'tournament'} journey.` 
                        : `Viewing the profile of ${fanProfile.name}. Supports ${fanProfile.team_support || 'the beautiful game'}.`
                    }
                    breadcrumbs={[{ label: isOwnProfile ? 'Profile' : fanProfile.name }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                {/* Ad Placeholder */}
                <div className="mb-4">
                    <AdPlaceholder position="horizontal" />
                </div>

                <div className="profile-summary-grid">
                    
                    {/* Profile Information Card */}
                    <div className="content-card profile-info-card h-100 p-0 overflow-hidden">
                        {/* Cover Image Section */}
                        <div 
                            className="profile-cover-section"
                            style={{ 
                                backgroundImage: `url(${fanProfile.cover_image || `${assetUrl}assets/img/fan/backgrounds/default-cover.png`})`,
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                backgroundColor: '#000'
                            }}
                        >
                            <div className="profile-cover-overlay"></div>
                        </div>

                        <div className="profile-showcase text-center px-4 pt-0 profile-overlap-margin">
                            {/* Large Avatar Display */}
                            <div className="profile-avatar-display d-flex justify-content-center mb-3">
                                <div className="profile-avatar-wrapper">
                                    {fanProfile.avatar.includes('.glb') ? (
                                        <model-viewer 
                                            id="profileAvatar"
                                            src={fanProfile.avatar}
                                            alt={fanProfile.name}
                                            auto-rotate
                                            camera-controls
                                            shadow-intensity="1"
                                            class="profile-model-viewer">
                                        </model-viewer>
                                    ) : (
                                        <img 
                                            id="profileAvatar" 
                                            src={fanProfile.avatar} 
                                            alt={fanProfile.name} 
                                            className="profile-avatar-img"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Profile Info */}
                            <div className="profile-info mb-4">
                                <h2 id="profileName" className="h3 mb-2 text-white">{fanProfile.name}</h2>
                                <p id="profileEmail" className="text-medium-contrast mb-2">{fanProfile.email}</p>
                                <p className="profile-country mb-2 text-high-contrast"><i className="fas fa-flag me-1"></i> {fanProfile.country}</p>

                                {fanProfile.team_support && (
                                    <p className="profile-team mb-1">
                                        Supports: {fanProfile.team_support}
                                    </p>
                                )}

                                {fanProfile.bio && (
                                    <div className="profile-bio mt-3 px-3">
                                        <p className="text-white small opacity-75 italic mb-0">
                                            "{fanProfile.bio}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="profile-actions d-flex gap-3 justify-content-center pb-4">
                            {isOwnProfile ? (
                                <>
                                    <button className="btn-glass-pill" onClick={() => setShowEditModal(true)}>
                                        <i className="fas fa-edit me-2"></i>
                                        <span>Edit Profile</span>
                                    </button>
                                    <button className="btn-glass-pill" onClick={() => setShowAvatarCreator(true)}>
                                        <i className="fas fa-camera me-2"></i>
                                        <span>Change Avatar</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        className={`btn-glass-pill ${following ? '' : ''}`}
                                        onClick={() => {
                                            router.post(route('fan.follow.toggle', profile.id), {}, {
                                                preserveScroll: true,
                                                onSuccess: () => setFollowing(!following)
                                            });
                                        }}
                                    >
                                        {following ? (
                                            <>
                                                <i className="fas fa-check me-2"></i>
                                                <span>Following</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-user-plus me-2"></i>
                                                <span>Follow</span>
                                            </>
                                        )}
                                    </button>
                                    <button 
                                        className="btn-glass-pill"
                                        onClick={() => router.visit(route('fan.communication'))}
                                    >
                                        <i className="fas fa-envelope me-2"></i>
                                        <span>Message</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Ready Player Me Avatar Creator Modal */}
                    {showAvatarCreator && (
                        <div className="avatar-creator-modal-overlay">
                            <div className="d-flex justify-content-end p-3">
                                <button className="btn btn-sm btn-close-avatar" onClick={() => setShowAvatarCreator(false)}>
                                    <i className="fas fa-times me-2"></i> Close
                                </button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <AvatarCreator 
                                    subdomain="demo" 
                                    config={{
                                        clearCache: true,
                                        bodyType: 'fullbody',
                                        quickStart: false,
                                        language: 'en',
                                    }}
                                    style={{ width: '100%', height: '100%', border: 'none' }} 
                                    onAvatarExported={handleAvatarExported} 
                                />
                            </div>
                        </div>
                    )}

                    {/* Right Column: Stats & Settings */}
                    <div className="d-flex flex-column gap-4">
                        
                        {/* Social Stats Card */}
                        <div className="content-card social-stats-card mb-4">
                            <div className="card-header mb-3">
                                <i className="fas fa-chart-bar text-info me-2"></i>
                                <h3 className="m-0 text-white">Social Statistics</h3>
                            </div>

                            <div className="d-flex justify-content-around text-center py-3">
                                <div 
                                    className="stat-item cursor-pointer" 
                                    onClick={() => { setNetworkTab('followers'); setShowNetworkModal(true); }}
                                >
                                    <div className="stat-value h2 fw-bold mb-0">{stats.followers}</div>
                                    <div className="stat-label small">Followers</div>
                                </div>
                                <div className="stat-item border-start border-end border-secondary px-4">
                                    <div className="stat-value h2 fw-bold mb-0">{stats.tribes}</div>
                                    <div className="stat-label small">Tribes</div>
                                </div>
                                <div 
                                    className="stat-item cursor-pointer"
                                    onClick={() => { setNetworkTab('following'); setShowNetworkModal(true); }}
                                >
                                    <div className="stat-value h2 fw-bold mb-0">{socialStats.following_count || profile.following_count || 0}</div>
                                    <div className="stat-label small">Following</div>
                                </div>
                            </div>
                        </div>

                        {/* Account Settings Card - Only show if own profile */}
                        {isOwnProfile && (
                            <div className="content-card account-settings-card">
                                <div className="card-header mb-3">
                                    <i className="fas fa-cog text-secondary me-2"></i>
                                    <h3 className="m-0 text-white">Account Settings</h3>
                                </div>

                                <div className="settings-grid d-flex flex-column gap-3">
                                    <div className="setting-item d-flex justify-content-between align-items-center p-3 rounded">
                                        <div className="setting-info">
                                            <h4 className="h6 mb-0">Email Notifications</h4>
                                            <p className="small mb-0">Receive updates about your journey</p>
                                        </div>
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" defaultChecked />
                                        </div>
                                    </div>

                                    <div className="setting-item d-flex justify-content-between align-items-center p-3 rounded">
                                        <div className="setting-info">
                                            <h4 className="h6 mb-0">Two-Factor Authentication</h4>
                                            <p className="small mb-0">Add extra security layer</p>
                                        </div>
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                checked={security_settings.two_factor_enabled} 
                                                onChange={toggle2FA}
                                            />
                                        </div>
                                    </div>

                                     <div className="setting-item d-flex justify-content-between align-items-center p-3 rounded">
                                        <div className="setting-info">
                                            <h4 className="h6 mb-0">Marketing Communications</h4>
                                            <p className="small mb-0">Promotional offers and updates</p>
                                        </div>
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" defaultChecked={user.marketing_consent} />
                                        </div>
                                    </div>
                                </div>

                                 <div className="settings-actions d-flex gap-3 mt-4">
                                    <Link href={route('fan.security')} className="btn-glass-pill flex-grow-1">
                                        <i className="fas fa-cog me-2"></i>
                                        Advanced
                                    </Link>
                                    <Link href={route('fan.security')} className="btn-glass-pill flex-grow-1">
                                        <i className="fas fa-key me-2"></i>
                                        Password
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Tribes Section */}
                        <div className="content-card profile-tribes-card">
                            <div className="card-header mb-3">
                                <i className="fas fa-users text-warning me-2"></i>
                                <h3 className="m-0 text-white">{isOwnProfile ? 'My Tribes' : 'Joined Tribes'}</h3>
                            </div>
                            <div className="tribes-grid-compact">
                                {userTribes.length > 0 ? (
                                    userTribes.map(tribe => (
                                        <Link key={tribe.id} href={route('fan.tribes.show', tribe.slug)} className="compact-tribe-item">
                                            <img src={tribe.avatar || '/assets/img/fan/tribes/default.png'} alt={tribe.name} className="compact-tribe-avatar" />
                                            <span className="compact-tribe-name">{tribe.name}</span>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-white-50">
                                        <i className="fas fa-users-slash mb-2 d-block"></i>
                                        <small>Hasn't joined any tribes yet</small>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity / Posts Section */}
                        <div className="content-card profile-posts-card">
                            <div className="card-header mb-3">
                                <i className="fas fa-comment-alt text-success me-2"></i>
                                <h3 className="m-0 text-white">Recent Activity</h3>
                            </div>
                            <div className="profile-posts-list">
                                {userPosts.length > 0 ? (
                                    userPosts.map(post => (
                                        <div key={post.id} className="profile-post-item" onClick={() => router.visit(route('fan.feed.post.show', post.id))}>
                                            <div className="profile-post-header">
                                                <span className="profile-post-time">{post.created_at}</span>
                                            </div>
                                            <p className="profile-post-excerpt">{post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content}</p>
                                            <div className="profile-post-stats">
                                                <span><i className="far fa-heart me-1"></i> {post.likes_count}</span>
                                                <span><i className="far fa-comment me-1"></i> {post.comment_count}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-white-50">
                                        <i className="fas fa-pencil-alt mb-2 d-block"></i>
                                        <small>No recent posts to show</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>
 
                {/* Edit Profile Modal */}
                <DashboardModal
                    open={showEditModal}
                    onOpenChange={setShowEditModal}
                    title={fanProfile.name}
                    label="Profile Details"
                    activeTab={editProfileTab}
                    onTabChange={setEditProfileTab}
                    tabs={editTabs}
                >
                    <form onSubmit={handleProfileUpdate} className="flex flex-col h-full">
                        <div className="modal-body">
                            {editProfileTab === 'personal' && (
                                <div className="space-y-4 bounce-in">
                                    <div className="mb-3">
                                        <label className="form-label">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={editForm.name}
                                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            value={editForm.email}
                                            disabled
                                            title="Email cannot be changed"
                                            style={{ opacity: 0.5 }}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Country</label>
                                        <SearchableSelect
                                            options={countries}
                                            value={editForm.country}
                                            onChange={(val) => setEditForm({...editForm, country: val})}
                                            placeholder="Select Your Country"
                                            labelKey="text"
                                            valueKey="value"
                                        />
                                    </div>
                                    <div className="d-flex gap-3">
                                        <div className="flex-fill">
                                            <label className="form-label">Date of Birth</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                value={editForm.date_of_birth}
                                                onChange={e => setEditForm({...editForm, date_of_birth: e.target.value})}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                        <div className="flex-fill">
                                            <label className="form-label">Phone Number</label>
                                            <div className="d-flex gap-2">
                                                <div style={{width: '110px'}}>
                                                    <SearchableSelect
                                                        options={countries}
                                                        value={editForm.country_code}
                                                        onChange={(val) => {
                                                            const countryObj = countries.find(c => c.code === val);
                                                            setEditForm(prev => ({
                                                                ...prev, 
                                                                country_code: val,
                                                                country: countryObj ? countryObj.value : prev.country
                                                            }));
                                                        }}
                                                        placeholder="Code"
                                                        labelKey="code"
                                                        valueKey="code"
                                                        searchKeysKey={['code', 'value', 'iso']}
                                                        renderOption={(option) => (
                                                            <div className="d-flex align-items-center justify-content-between w-100">
                                                                <div className="d-flex align-items-center">
                                                                    <span className="text-white me-2 small">{option.iso}</span>
                                                                    <span className="text-white fw-bold">{option.code}</span>
                                                                </div>
                                                                <span className="text-white-50 small ms-1 text-truncate" style={{maxWidth: '60px'}}>{option.value}</span>
                                                            </div>
                                                        )}
                                                    />
                                                </div>
                                                <input 
                                                    type="tel" 
                                                    className="form-control" 
                                                    value={editForm.phone}
                                                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                                    placeholder="123 456 789"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editProfileTab === 'team' && (
                                <div className="space-y-4 bounce-in">
                                    <label className="form-label mb-3">Supporting Team</label>
                                    <div className="team-grid no-scrollbar dash-team-grid">
                                        {teams.map(team => (
                                            <div
                                                key={team.name}
                                                className={`team-option dash-team-option ${editForm.team_support === team.name ? 'selected' : ''}`}
                                                onClick={() => setEditForm({...editForm, team_support: team.name})}
                                            >
                                                {team.flag ? (
                                                    <img src={team.flag} alt={team.name} className="team-flag dash-team-flag" />
                                                ) : (
                                                    <i className={`${team.icon} team-icon`}></i>
                                                )}
                                                <span className="team-name text-white dash-team-name">{team.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {editProfileTab === 'bio' && (
                                <div className="space-y-4 bounce-in">
                                    <div className="mb-3 mt-3">
                                        <label className="form-label">Bio / About You</label>
                                        <textarea 
                                            className="form-control"
                                            rows={8}
                                            value={editForm.bio}
                                            onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                            placeholder="Tell fans about your journey..."
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {editProfileTab === 'appearance' && (
                                <div className="space-y-4 bounce-in text-white">
                                    {/* Current cover preview */}
                                    {editForm.cover_image && coverFiles.length === 0 && (
                                        <div className="mb-3">
                                            <label className="form-label">Current Cover</label>
                                            <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 180 }}>
                                                <img 
                                                    src={editForm.cover_image} 
                                                    alt="Current cover" 
                                                    style={{ width: '100%', height: 180, objectFit: 'cover' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="mb-3">
                                        <label className="form-label">Upload New Cover</label>
                                        <FilePondUploader
                                            files={coverFiles}
                                            onUpdateFiles={setCoverFiles}
                                            acceptedFileTypes={['image/*']}
                                            labelIdle='Drag & Drop cover image or <span class="filepond--label-action">Browse</span>'
                                            maxFiles={1}
                                        />
                                        <p className="form-hint small opacity-50 italic">Leave blank to use your team's flag as default.</p>
                                    </div>
                                </div>
                            )}

                            {editProfileTab === 'legal' && (
                                <div className="space-y-4 bounce-in text-white">
                                    <div className="p-4 rounded-4 dash-modal-subtle">
                                        <h4 className="h6 mb-4 fw-bold text-white">Communication Preferences</h4>
                                        
                                        <div className="settings-grid d-flex flex-column gap-3">
                                            <div className="setting-item d-flex justify-content-between align-items-center p-3 rounded-4 dash-modal-subtle-sm">
                                                <div className="setting-info">
                                                    <h4 className="h6 mb-1 text-white">Marketing Messages</h4>
                                                    <p className="small mb-0 text-white-50">Receive news, offers and promotions</p>
                                                </div>
                                                <div className="form-check form-switch custom-switch">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={editForm.marketing_consent} 
                                                        onChange={e => setEditForm({...editForm, marketing_consent: e.target.checked})}
                                                    />
                                                </div>
                                            </div>

                                            <div className="setting-item d-flex justify-content-between align-items-center p-3 rounded-4 dash-modal-subtle-sm">
                                                <div className="setting-info">
                                                    <h4 className="h6 mb-1 text-white">Weekly Newsletter</h4>
                                                    <p className="small mb-0 text-white-50">A summary of your journey and platform updates</p>
                                                </div>
                                                <div className="form-check form-switch custom-switch">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={editForm.community_consent} 
                                                        onChange={e => setEditForm({...editForm, community_consent: e.target.checked})}
                                                    />
                                                </div>
                                            </div>

                                            <div className="setting-item d-flex justify-content-between align-items-center p-3 rounded-4 dash-modal-subtle-sm">
                                                <div className="setting-info">
                                                    <h4 className="h6 mb-1 text-white">TFE Community Access</h4>
                                                    <p className="small mb-0 text-white-50">Participate in exclusive community events</p>
                                                </div>
                                                <div className="form-check form-switch custom-switch">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        checked={editForm.terms_agreed} 
                                                        disabled
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 rounded-4 border border-info border-opacity-10" style={{ background: 'rgba(13, 202, 240, 0.05)' }}>
                                            <div className="d-flex gap-3">
                                                <i className="fas fa-info-circle text-info mt-1"></i>
                                                <p className="small text-white-50 mb-0">
                                                    {`By keeping these enabled, you ensure you don't miss out on match tickets, exclusive tribes, and ${tournament?.short_name || 'tournament'} prizes. You can change these at any time.`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button type="submit" className="btn-submit-modal">Save Changes</button>
                        </div>
                    </form>
                </DashboardModal>

                {/* 2FA Setup Modal */}
                 <DashboardModal
                    open={show2FAModal}
                    onOpenChange={setShow2FAModal}
                    title="Setup 2FA"
                    label="Security"
                    activeTab={activeSecurityTab}
                    onTabChange={setActiveSecurityTab}
                    tabs={securityTabs}
                >
                    <div className="modal-body text-center">
                        <div className="bg-[#111] p-4 rounded-xl border border-white/5 mb-4 inline-block">
                             <i className="fas fa-shield-alt fa-3x text-green-500 mb-2"></i>
                             <h4 className="text-white mb-1">Two-Factor Authentication</h4>
                             <p className="text-gray-400 text-sm">Scan the QR code below</p>
                        </div>

                        {flash?.two_factor_setup?.qr_code && (
                            <div 
                                className="bg-white p-3 rounded-2xl mb-4 d-inline-block shadow-lg"
                                dangerouslySetInnerHTML={{ __html: flash.two_factor_setup.qr_code }}
                            />
                        )}

                        <form onSubmit={confirm2FA} className="max-w-xs mx-auto">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-400 text-center">Enter Verification Code</label>
                                <input 
                                    type="text" 
                                    className="w-full text-center text-3xl font-bold tracking-[0.5rem] py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl text-[#d97706] focus:outline-none focus:ring-2 focus:ring-[#d97706]/50 transition-all"
                                    placeholder="000 000"
                                    maxLength="6"
                                    value={setupCode}
                                    onChange={e => setSetupCode(e.target.value)}
                                    required 
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full mt-4 py-3 bg-[#10b981] hover:bg-[#059669] rounded-xl text-white font-bold shadow-lg shadow-[#10b981]/20 transition-all"
                            >
                                Confirm & Enable
                            </button>
                        </form>
                    </div>
                     <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setShow2FAModal(false)}>Cancel</button>
                    </div>
                </DashboardModal>
                
                {/* Network Modal (Followers/Following) */}
                <DashboardModal
                    open={showNetworkModal}
                    onOpenChange={setShowNetworkModal}
                    title={networkTab === 'followers' ? 'Followers' : 'Following'}
                    maxWidth="md"
                >
                    <div className="network-modal-content p-2">
                        <div className="user-list-container d-flex flex-column gap-2">
                            {(networkTab === 'followers' ? followers : followingList).length > 0 ? (
                                (networkTab === 'followers' ? followers : followingList).map(person => (
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
                                            className="btn-glass-pill btn-sm py-1 px-3"
                                            style={{ fontSize: '0.8rem' }}
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <i className={`fas ${networkTab === 'followers' ? 'fa-user-friends' : 'fa-users'} fa-3x mb-3 text-white-50`} style={{ opacity: 0.2 }}></i>
                                    <p className="text-white-50">No {networkTab} found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DashboardModal>

                <ConfirmationDialog
                    open={confirmDisable2FA}
                    onOpenChange={setConfirmDisable2FA}
                    title="Disable 2FA?"
                    description="Are you sure you want to disable 2FA? This will make your account less secure."
                    onConfirm={handleDisable2FA}
                    confirmText="Disable"
                    variant="destructive"
                />
            </div>
        </FanLayout>
    );
}
