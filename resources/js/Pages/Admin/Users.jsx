import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import StatCard from '@/Components/Common/StatCard';
import { router } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DataTable from '@/Components/DataTable';
import DashboardModal from '@/Components/Common/DashboardModal';
import { useForm, usePage } from '@inertiajs/react';
import SearchableSelect from '@/Components/SearchableSelect';
import AdminInput from '@/Components/Admin/Form/AdminInput';
import { countries } from '../../Data/countries';
import WorldCup2026Data from '../../Data/WorldCup2026Data';

export default function Users({ auth, users = { data: [] }, stats = {}, filters }) {
    const { assetUrl } = usePage().props;
    const safeFilters = (filters && !Array.isArray(filters)) ? filters : {};
    const [search, setSearch] = useState(safeFilters.search || '');
    const [sortBy, setSortBy] = useState(typeof safeFilters.sort === 'string' ? safeFilters.sort : 'newest');
    const [viewMode, setViewMode] = useState('list');
    const [userToDelete, setUserToDelete] = useState(null);
    const [userToToggleAdmin, setUserToToggleAdmin] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    const { data, setData, put, processing, reset, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        country: '',
        country_code: '',
        team_support: '',
        date_of_birth: '',
        bio: '',
        is_admin: false,
        is_partner: false,
        marketing_consent: false,
        community_consent: false,
        terms_agreed: false
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Users' }
    ];

    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'name', label: 'Name A-Z' },
        { value: 'email', label: 'Email A-Z' }
    ];

    const teams = [
        ...WorldCup2026Data.qualifiedTeams.map(teamName => {
            const specialMappings = {
                'England': 'gb-eng', 'Scotland': 'gb-sct', 'Wales': 'gb-wls',
                'Curaçao': 'cw', 'Curacao': 'cw', 'Cabo Verde': 'cv', 'Cape Verde': 'cv',
            };
            let iso = specialMappings[teamName];
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

    const handleSearch = (value) => {
        setSearch(value);
        router.get('/admin/users', { search: value, sort: sortBy }, { preserveState: true });
    };

    const handleSort = (value) => {
        setSortBy(value);
        router.get('/admin/users', { search, sort: value }, { preserveState: true });
    };

    const handleToggleAdmin = () => {
        if (userToToggleAdmin) {
            router.post(`/admin/users/${userToToggleAdmin}/toggle-admin`, {}, {
                onSuccess: () => setUserToToggleAdmin(null)
            });
        }
    };

    const handleDelete = () => {
        if (userToDelete) {
            router.delete(`/admin/users/${userToDelete}`, {
                onSuccess: () => setUserToDelete(null)
            });
        }
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setActiveTab('profile');
        setData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            country: user.country || '',
            country_code: user.country_code || '',
            team_support: user.team_support || '',
            date_of_birth: user.date_of_birth || '',
            bio: user.bio || '',
            is_admin: !!user.is_admin,
            is_partner: !!user.is_partner,
            marketing_consent: !!user.marketing_consent,
            community_consent: !!user.community_consent,
            terms_agreed: !!user.terms_agreed
        });
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route('admin.users.update', selectedUser.id), {
            onSuccess: () => {
                // Keep the modal open but stay on edit tab or switch back?
                // Let's keep context.
            },
            preserveScroll: true
        });
    };

    const columns = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => <span className="fw-semibold">{row.original.name}</span>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => <span className="text-white" style={{ opacity: 0.8 }}>{row.original.email}</span>,
        },
        {
            accessorKey: "country",
            header: "Country",
            cell: ({ row }) => row.original.country || "-",
        },
        {
            accessorKey: "created_at",
            header: "Joined",
            cell: ({ row }) => (
                <span className="text-white small" style={{ opacity: 0.7 }}>
                    {new Date(row.original.created_at).toLocaleDateString()}
                </span>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => {
                const user = row.original;
                if (user.is_admin) return <span className="admin-badge admin-badge-amber">Admin</span>;
                if (user.is_partner) return <span className="admin-badge admin-badge-blue">Partner</span>;
                return <span className="admin-badge admin-badge-gray">Fan</span>;
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="d-flex gap-2">
                    <button 
                        className="btn-admin-icon"
                        title="View Details"
                        onClick={(e) => { e.stopPropagation(); handleViewUser(row.original); }}
                    >
                        <i className="fas fa-eye"></i>
                    </button>
                    <button 
                        className={`btn-admin-icon ${row.original.is_admin ? 'active' : ''}`}
                        title="Toggle Admin"
                        onClick={(e) => { e.stopPropagation(); setUserToToggleAdmin(row.original.id); }}
                    >
                        <i className="fas fa-user-shield"></i>
                    </button>
                    <button 
                        className="btn-admin-icon" 
                        title="Delete User"
                        onClick={(e) => { e.stopPropagation(); setUserToDelete(row.original.id); }}
                        style={{ '--admin-primary': 'var(--admin-danger)' }}
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout title="Users Management">
            <DashboardHero role="admin" 
                title="User Management"
                subtitle="View, search, and manage all registered users."
                breadcrumbs={breadcrumbs}
            />

            {/* Dashboard Stats */}
            <div className="admin-visual-cards mb-4" style={{ overflow: 'visible', flexWrap: 'wrap' }}>
                <StatCard 
                    type="visual"
                    label="Total Registered" 
                    value={stats.total || 0} 
                    icon="fas fa-users"
                    bgType="users"
                    settingsKey="bg_card_users_total"
                    image="/assets/images/bgimage05.jpg"
                    className="flex-grow-1"
                    allowEdit={adminTheme?.editMode}
                />
                <StatCard 
                    type="visual"
                    label="Platform Admins" 
                    value={stats.admins || 0} 
                    icon="fas fa-user-shield"
                    bgType="users"
                    settingsKey="bg_card_users_admins"
                    image="/assets/images/bgimage01.jpg"
                    className="flex-grow-1"
                    allowEdit={adminTheme?.editMode}
                />
                <StatCard 
                    type="visual"
                    label="Travel Partners" 
                    value={stats.partners || 0} 
                    icon="fas fa-handshake"
                    bgType="users"
                    settingsKey="bg_card_users_partners"
                    image="/assets/images/bgimage02.jpg"
                    className="flex-grow-1"
                    allowEdit={adminTheme?.editMode}
                />
                <StatCard 
                    type="visual"
                    label="Pending Consent" 
                    value={stats.pending_consent || 0} 
                    icon="fas fa-user-clock"
                    bgType="users"
                    settingsKey="bg_card_users_pending"
                    image="/assets/images/bgimage03.jpg"
                    className="flex-grow-1"
                    allowEdit={adminTheme?.editMode}
                />
            </div>

            {/* Toolbar */}
            <AdminToolbar
                search={search}
                onSearchChange={handleSearch}
                searchPlaceholder="Search users..."
                sortOptions={sortOptions}
                sortValue={sortBy}
                onSortChange={handleSort}
                viewMode={viewMode}
                onViewChange={setViewMode}
            />

            {/* Users Table/Grid */}
            <div className="admin-card-dark">
                <div className="card-header">
                    <h3><i className="fas fa-users"></i> All Users</h3>
                    <span className="admin-badge admin-badge-gray">{users.data?.length || 0} users</span>
                </div>
                
                {viewMode === 'list' ? (
                    <div className="card-body p-0">
                        <DataTable 
                            columns={columns} 
                            data={users.data || []} 
                            search={search}
                        />
                    </div>
                ) : (
                    /* Grid View */
                    <div className="card-body">
                        <div className="row g-3">
                            {users.data && users.data.length > 0 ? (
                                users.data.map(user => (
                                    <div key={user.id} className="col-md-6 col-lg-4">
                                        <div 
                                            className="p-3 rounded-3"
                                            style={{ 
                                                background: 'var(--admin-bg-dark)', 
                                                border: '1px solid var(--admin-border)' 
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div 
                                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ 
                                                        width: '48px', 
                                                        height: '48px', 
                                                        background: 'var(--admin-primary-light)',
                                                        color: 'var(--admin-primary)',
                                                        fontWeight: '700',
                                                        fontSize: '1.2rem'
                                                    }}
                                                >
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold text-white">{user.name}</div>
                                                    <small className="text-white opacity-75">{user.email}</small>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                {user.is_admin ? (
                                                    <span className="admin-badge admin-badge-amber">Admin</span>
                                                ) : user.is_partner ? (
                                                    <span className="admin-badge admin-badge-blue">Partner</span>
                                                ) : (
                                                    <span className="admin-badge admin-badge-gray">Fan</span>
                                                )}
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className={`btn-admin-icon ${user.is_admin ? 'active' : ''}`}
                                                        onClick={() => setUserToToggleAdmin(user.id)}
                                                    >
                                                        <i className="fas fa-user-shield"></i>
                                                    </button>
                                                    <button 
                                                        className="btn-admin-icon"
                                                        onClick={() => setUserToDelete(user.id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12">
                                    <div className="admin-empty-state">
                                        <i className="fas fa-users-slash"></i>
                                        <h4>No users found</h4>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* User Detail Modal — Tabbed Redesign */}
            <DashboardModal
                open={!!selectedUser}
                onOpenChange={(open) => !open && setSelectedUser(null)}
                title={selectedUser?.name || 'User Profile'}
                label="User Management"
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    { id: 'profile', label: 'Summary', icon: 'fas fa-id-card' },
                    { id: 'personal', label: 'Personal', icon: 'fas fa-user-edit' },
                    { id: 'team', label: 'Team', icon: 'fas fa-futbol' },
                    { id: 'bio', label: 'Bio', icon: 'fas fa-pen' },
                    { id: 'legal', label: 'Legal', icon: 'fas fa-shield-alt' },
                    { id: 'role', label: 'Role', icon: 'fas fa-user-shield' },
                    { id: 'activity', label: 'Activity', icon: 'fas fa-chart-line' },
                ]}
            >
                {selectedUser && (
                    <div className="p-0 h-100 overflow-hidden" style={{ color: '#fff !important' }}>
                        {activeTab === 'profile' && (
                            <div className="modal-body bounce-in no-scrollbar dash-modal-body-tab">
                                <div className="row g-4">
                                <div className="col-md-12 mb-2">
                                    <div className="d-flex align-items-center gap-4 mb-4 p-3 rounded-4 dash-modal-subtle">
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center dash-icon-bubble dash-icon-bubble-lg"
                                            style={{ 
                                                background: 'var(--admin-primary-light)',
                                                color: 'var(--admin-primary)',
                                            }}
                                        >
                                            {selectedUser.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h2 className="mb-1 text-white fw-bold">{selectedUser.name}</h2>
                                            <div className="d-flex gap-2">
                                                {selectedUser.is_admin && <span className="admin-badge admin-badge-amber">Administrator</span>}
                                                {selectedUser.is_partner && <span className="admin-badge admin-badge-blue">Partner</span>}
                                                {!selectedUser.is_admin && !selectedUser.is_partner && <span className="admin-badge admin-badge-gray">Fan Member</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <div className="mb-4">
                                        <label className="text-muted small uppercase tracking-wider mb-2 d-block opacity-50">Contact info</label>
                                        <div className="text-white mb-3 d-flex align-items-center">
                                            <div className="p-2 rounded-3 me-3" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}><i className="fas fa-envelope"></i></div>
                                            <div>
                                                <div className="small text-muted">Email Address</div>
                                                <div className="fw-medium">{selectedUser.email}</div>
                                            </div>
                                        </div>
                                        <div className="text-white mb-3 d-flex align-items-center">
                                            <div className="p-2 rounded-3 me-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}><i className="fas fa-phone"></i></div>
                                            <div>
                                                <div className="small text-muted">Phone Number</div>
                                                <div className="fw-medium">{selectedUser.phone || 'Not provided'}</div>
                                            </div>
                                        </div>
                                        <div className="text-white d-flex align-items-center">
                                            <div className="p-2 rounded-3 me-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}><i className="fas fa-map-marker-alt"></i></div>
                                            <div>
                                                <div className="small text-muted">Location</div>
                                                <div className="fw-medium">{selectedUser.country || 'Not specified'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-4">
                                        <label className="text-muted small uppercase tracking-wider mb-2 d-block opacity-50">Account Details</label>
                                        <div className="p-3 rounded-4 dash-modal-subtle">
                                            <div className="small text-muted mb-1">Date Joined</div>
                                            <div className="text-white mb-3">{new Date(selectedUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                            
                                            <div className="small text-muted mb-1">Email Verified</div>
                                            <div className={`fw-bold ${selectedUser.email_verified_at ? 'text-success' : 'text-warning'}`}>
                                                <i className={`fas ${selectedUser.email_verified_at ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-1`}></i>
                                                {selectedUser.email_verified_at ? 'Verified' : 'Pending'}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-muted small uppercase tracking-wider mb-2 d-block opacity-50">Bio / About</label>
                                        <div className="text-white small p-3 rounded-4 italic dash-modal-subtle" style={{ opacity: 0.8 }}>
                                            "{selectedUser.bio || 'This user hasn\'t added a bio yet.'}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                                </div>
                        )}

                        {activeTab === 'personal' && (
                            <div className="modal-body bounce-in no-scrollbar dash-modal-body-tab">
                                <form onSubmit={handleUpdate}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <AdminInput
                                                label="Full Name"
                                                value={data.name}
                                                onChange={e => setData('name', e.target.value)}
                                                error={errors.name}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <AdminInput
                                                label="Email Address"
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                error={errors.email}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <AdminInput
                                                label="Phone"
                                                value={data.phone}
                                                onChange={e => setData('phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <AdminInput
                                                label="Date of Birth"
                                                type="date"
                                                value={data.date_of_birth}
                                                onChange={e => setData('date_of_birth', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <div className="admin-form-group">
                                                <label className="admin-form-label text-white">Code</label>
                                                <SearchableSelect
                                                    options={countries}
                                                    value={data.country_code}
                                                    onChange={(val) => {
                                                        const countryObj = countries.find(c => c.code === val);
                                                        setData(prev => ({
                                                            ...prev, 
                                                            country_code: val,
                                                            country: countryObj ? countryObj.value : prev.country
                                                        }));
                                                    }}
                                                    placeholder="Code"
                                                    labelKey="code"
                                                    valueKey="code"
                                                    searchKeys={['code', 'value', 'iso']}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-9">
                                            <div className="admin-form-group">
                                                <label className="admin-form-label text-white">Country</label>
                                                <SearchableSelect
                                                    options={countries}
                                                    value={data.country}
                                                    onChange={(val) => {
                                                        const countryObj = countries.find(c => c.value === val);
                                                        setData(prev => ({
                                                            ...prev, 
                                                            country: val,
                                                            country_code: countryObj ? countryObj.code : prev.country_code
                                                        }));
                                                    }}
                                                    placeholder="Select Country"
                                                    labelKey="value"
                                                    valueKey="value"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-12 mt-4">
                                            <button className="btn-admin w-100 py-2" disabled={processing}>
                                                <i className="fas fa-check-circle me-2"></i> Save Personal Details
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="modal-body bounce-in no-scrollbar dash-modal-body-tab">
                                <form onSubmit={handleUpdate}>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label text-white mb-3">Supporting Team</label>
                                        <div className="no-scrollbar" style={{ 
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                                            gap: '8px',
                                            width: '100%',
                                            maxHeight: '400px',
                                            overflowY: 'auto',
                                            padding: '4px'
                                        }}>
                                            {teams.map(team => (
                                                <div
                                                    key={team.name}
                                                    className={`team-option ${data.team_support === team.name ? 'selected' : ''}`}
                                                    onClick={() => setData('team_support', team.name)}
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '8px 4px',
                                                        background: data.team_support === team.name ? 'rgba(220, 20, 60, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                                        border: data.team_support === team.name ? '1px solid #dc143c' : '1px solid transparent',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        minHeight: '64px',
                                                        textAlign: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {team.flag ? (
                                                        <img src={team.flag} alt={team.name} className="team-flag" style={{ width: '30px', height: '20px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <i className={`${team.icon} team-icon`} style={{ fontSize: '16px' }}></i>
                                                    )}
                                                    <span className="team-name text-white" style={{ fontSize: '9px', lineHeight: '1.2' }}>{team.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-12 mt-4">
                                        <button className="btn-admin w-100 py-2" disabled={processing}>
                                            <i className="fas fa-check-circle me-2"></i> Update Supporting Team
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'bio' && (
                            <div className="modal-body bounce-in no-scrollbar dash-modal-body-tab">
                                <form onSubmit={handleUpdate}>
                                    <div className="admin-form-group">
                                        <label className="admin-form-label text-white">About User</label>
                                        <textarea 
                                            className="admin-form-input admin-form-textarea" 
                                            rows={10}
                                            value={data.bio} 
                                            onChange={e => setData('bio', e.target.value)}
                                            placeholder="User biography and journey details..."
                                        ></textarea>
                                    </div>
                                    <div className="col-12 mt-4">
                                        <button className="btn-admin w-100 py-2" disabled={processing}>
                                            <i className="fas fa-check-circle me-2"></i> Save Bio
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'legal' && (
                            <div className="modal-body bounce-in no-scrollbar dash-modal-body-tab">
                                <form onSubmit={handleUpdate}>
                                    <div className="p-4 rounded-4 space-y-4 dash-modal-subtle">
                                        <div className="d-flex justify-content-between align-items-center p-3 rounded-4 dash-modal-subtle-sm">
                                            <div>
                                                <div className="text-white fw-medium">Marketing Consent</div>
                                                <div className="small text-white-50">Allow user to receive promotional materials</div>
                                            </div>
                                            <div className="form-check form-switch custom-switch">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    checked={data.marketing_consent}
                                                    onChange={e => setData('marketing_consent', e.target.checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center p-3 rounded-4 dash-modal-subtle-sm">
                                            <div>
                                                <div className="text-white fw-medium">Community Consent</div>
                                                <div className="small text-white-50">Newsletter and community engagement updates</div>
                                            </div>
                                            <div className="form-check form-switch custom-switch">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    checked={data.community_consent}
                                                    onChange={e => setData('community_consent', e.target.checked)}
                                                />
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center p-3 rounded-4 dash-modal-subtle-sm">
                                            <div>
                                                <div className="text-white fw-medium">Terms of Service</div>
                                                <div className="small text-white-50">Status of legal agreement acceptance</div>
                                            </div>
                                            <div className="form-check form-switch custom-switch">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    checked={data.terms_agreed}
                                                    onChange={e => setData('terms_agreed', e.target.checked)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 mt-4">
                                        <button className="btn-admin w-100 py-2" disabled={processing}>
                                            <i className="fas fa-check-circle me-2"></i> Update Preferences
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'role' && (
                            <div className="modal-body bounce-in no-scrollbar dash-modal-body-tab">
                                <form onSubmit={handleUpdate}>
                                    <div className="p-4 rounded-4 dash-modal-subtle">
                                        <h4 className="h6 mb-4 text-white">System Access & Roles</h4>
                                        <div className="d-flex flex-column gap-3">
                                            <div className="p-3 rounded-4 d-flex justify-content-between align-items-center dash-modal-subtle-sm">
                                                <div>
                                                    <div className="text-white fw-medium">Administrator Access</div>
                                                    <div className="small text-white-50">Full access to system management and settings</div>
                                                </div>
                                                <div className="form-check form-switch custom-switch">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        id="adminSwitch" 
                                                        checked={data.is_admin}
                                                        onChange={e => setData('is_admin', e.target.checked)}
                                                    />
                                                    <label className="form-check-label text-white small" htmlFor="adminSwitch">Admin</label>
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-4 d-flex justify-content-between align-items-center dash-modal-subtle-sm">
                                                <div>
                                                    <div className="text-white fw-medium">Travel Partner Status</div>
                                                    <div className="small text-white-50">Partner dashboard and API access enabled</div>
                                                </div>
                                                <div className="form-check form-switch custom-switch">
                                                    <input 
                                                        className="form-check-input" 
                                                        type="checkbox" 
                                                        id="partnerSwitch" 
                                                        checked={data.is_partner}
                                                        onChange={e => setData('is_partner', e.target.checked)}
                                                    />
                                                    <label className="form-check-label text-white small" htmlFor="partnerSwitch">Partner</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 mt-4">
                                        <button className="btn-admin w-100 py-2" disabled={processing}>
                                            <i className="fas fa-check-circle me-2"></i> Update User Roles
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="modal-body bounce-in no-scrollbar dash-modal-body-tab">
                                <div className="row g-4 mb-4">
                                    <div className="col-md-3">
                                        <div className="dash-activity-stat" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), transparent)' }}>
                                            <div className="h2 fw-bold text-white mb-1">{selectedUser.posts_count || 0}</div>
                                            <div className="text-white small uppercase">Posts</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="dash-activity-stat" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)' }}>
                                            <div className="h2 fw-bold text-white mb-1">{selectedUser.predictions_count || 0}</div>
                                            <div className="text-white small uppercase">Predictions</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="dash-activity-stat" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), transparent)' }}>
                                            <div className="h2 fw-bold text-white mb-1">{selectedUser.events_count || 0}</div>
                                            <div className="text-white small uppercase">RSVPs</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="dash-activity-stat" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)' }}>
                                            <div className="h2 fw-bold text-white mb-1">{selectedUser.followers_count || 0}</div>
                                            <div className="text-white small uppercase">Followers</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 rounded-4 dash-modal-subtle">
                                    <div className="d-flex align-items-center gap-3 mb-4">
                                        <div className="p-3 rounded-circle dash-contact-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}><i className="fas fa-history"></i></div>
                                        <div>
                                            <h4 className="text-white mb-0">Platform Engagement</h4>
                                            <p className="small text-white-50 mb-0">Overview of user participation across the ecosystem</p>
                                        </div>
                                    </div>
                                    <p className="text-white-50 small italic">Engagement logs and history visualization would be displayed here as the system scales.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DashboardModal>

            <ConfirmationDialog
                open={!!userToToggleAdmin}
                onOpenChange={(open) => !open && setUserToToggleAdmin(null)}
                title="Change Admin Status?"
                description="Are you sure you want to change the admin status for this user?"
                onConfirm={handleToggleAdmin}
                confirmText="Confirm"
            />

            <ConfirmationDialog
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
                title="Delete User?"
                description="Are you sure you want to delete this user? This cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
