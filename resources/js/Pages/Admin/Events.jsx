import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import AdminToolbar from '@/Components/Admin/AdminToolbar';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import FilePondUploader from '@/Components/Common/FilePondUploader';
import { router, useForm } from '@inertiajs/react';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Common/DashboardModal';
import ListingGrid from '@/Components/Common/ListingGrid';

export default function Events({ auth, events = { data: [] }, stats = {}, filters }) {
    const safeFilters = (filters && !Array.isArray(filters)) ? filters : {};
    // State management for events
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState(safeFilters.search || '');
    const [imageFiles, setImageFiles] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [eventToDelete, setEventToDelete] = useState(null);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    
    const [activeTab, setActiveTab] = useState('details');
    
    const { data, setData, post, put, processing, reset, errors } = useForm({
        title: '', description: '', date: '', location: '', type: '', image: null
    });

    const breadcrumbs = [
        { label: 'Admin', icon: 'fas fa-home', href: route('admin.dashboard') },
        { label: 'Events' }
    ];

    // Event categories — filter chips on the shared design system (no more
    // one-off bgimageNN.jpg art). `icon` drives the chip glyph.
    const categories = [
        { key: 'all', label: 'All Events', icon: 'fas fa-calendar-alt' },
        { key: 'match_day', label: 'Match Day', icon: 'fas fa-futbol' },
        { key: 'watch_party', label: 'Watch Party', icon: 'fas fa-tv' },
        { key: 'tournament', label: 'Tournament', icon: 'fas fa-trophy' },
        { key: 'community', label: 'Community', icon: 'fas fa-users' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isViewOnly) return;

        const routeName = eventToEdit ? 'admin.events.update' : 'admin.events.store';
        const routeParams = eventToEdit ? eventToEdit.id : undefined;

        post(route(routeName, routeParams), {
            _method: eventToEdit ? 'PUT' : 'POST',
            onSuccess: () => { 
                reset(); 
                setShowForm(false); 
                setEventToEdit(null);
                setImageFiles([]);
                setActiveTab('details');
            },
            forceFormData: true
        });
    };

    const handleDelete = () => {
        if (eventToDelete) {
            router.delete(`/admin/events/${eventToDelete}`, {
                onSuccess: () => setEventToDelete(null)
            });
        }
    };

    const handleEdit = (event) => {
        setEventToEdit(event);
        setIsViewOnly(false);
        setData({
            title: event.title || '',
            description: event.description || '',
            date: event.date || '',
            location: event.location || '',
            type: event.type || '',
            image: null
        });
        setActiveTab('details');
        setShowForm(true);
    };

    const handleView = (event) => {
        setEventToEdit(event);
        setIsViewOnly(true);
        setData({
            title: event.title || '',
            description: event.description || '',
            date: event.date || '',
            location: event.location || '',
            type: event.type || '',
            image: null
        });
        setActiveTab('details');
        setShowForm(true);
    };

    const eventsList = events.data?.length > 0 ? events.data : [];

    const filteredEvents = eventsList.filter(e => 
        (selectedCategory === 'all' || e.type === selectedCategory) &&
        (e.title.toLowerCase().includes(search.toLowerCase()) || 
         (e.location && e.location.toLowerCase().includes(search.toLowerCase())))
    );

    return (
        <AdminLayout title="Events Management">
            <DashboardHero role="admin" 
                title="Events Management"
                subtitle="Organize, schedule, and manage platform events."
                breadcrumbs={breadcrumbs}
                action={{
                    label: "New Event",
                    icon: "fas fa-plus me-2",
                    onClick: () => {
                        reset();
                        setEventToEdit(null);
                        setIsViewOnly(false);
                        setActiveTab('details');
                        setShowForm(true);
                    }
                }}
            />

            <SummaryTiles items={[
                { label: 'Total Events', value: stats.total || eventsList.length, icon: 'fa-calendar-alt', accent: 'blue' },
                { label: 'Upcoming', value: stats.upcoming || 0, icon: 'fa-clock', accent: 'amber' },
                { label: 'Attendees', value: stats.attendees || 0, icon: 'fa-users', accent: 'teal' },
            ]} className="mb-4" />

            <div className="feed-tabs mb-4">
                {categories.map(cat => {
                    const count = cat.key === 'all'
                        ? eventsList.length
                        : eventsList.filter(e => e.type === cat.key).length;
                    return (
                        <button
                            key={cat.key}
                            type="button"
                            className={`tfe-btn tfe-btn--sm${selectedCategory === cat.key ? ' is-active' : ''}`}
                            onClick={() => setSelectedCategory(cat.key)}
                        >
                            <i className={`${cat.icon} me-2`}></i>
                            {cat.label}
                            <span className="tfe-pill tfe-pill--info ms-2">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Premium Tabbed Modal for Create/Edit */}
            <DashboardModal
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open);
                    if (!open) { setEventToEdit(null); setIsViewOnly(false); reset(); }
                }}
                title={isViewOnly ? "Event Details" : (eventToEdit ? "Edit Event" : "Create Event")}
                label="Event Management"
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    { id: 'details', label: 'Details', icon: 'fas fa-info-circle' },
                    { id: 'media', label: 'Banner / Media', icon: 'fas fa-image' },
                    { id: 'rsvps', label: 'RSVP Stats', icon: 'fas fa-users' },
                ]}
            >
                <form onSubmit={handleSubmit} className="h-100 d-flex flex-column">
                    <div className="modal-body">
                        {activeTab === 'details' && (
                            <div className="row g-3 bounce-in">
                                <div className="col-12">
                                    <div className="admin-form-group">
                                        <label className="tfe-form-label">Event Title *</label>
                                        <input 
                                            type="text" 
                                            className="tfe-input" 
                                            placeholder="e.g., Match Day Meetup" 
                                            value={data.title} 
                                            onChange={e => setData('title', e.target.value)} 
                                            required 
                                            disabled={isViewOnly}
                                        />
                                        {errors.title && <div className="text-danger small mt-1">{errors.title}</div>}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="admin-form-group">
                                        <label className="tfe-form-label">Date *</label>
                                        <input 
                                            type="date" 
                                            className="tfe-input" 
                                            value={data.date} 
                                            onChange={e => setData('date', e.target.value)} 
                                            required 
                                            disabled={isViewOnly}
                                        />
                                        {errors.date && <div className="text-danger small mt-1">{errors.date}</div>}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="admin-form-group">
                                        <label className="tfe-form-label">Type</label>
                                        <select 
                                            className="tfe-select" 
                                            value={data.type} 
                                            onChange={e => setData('type', e.target.value)}
                                            disabled={isViewOnly}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="match_day">Match Day</option>
                                            <option value="watch_party">Watch Party</option>
                                            <option value="tournament">Tournament</option>
                                            <option value="community">Community</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="admin-form-group">
                                        <label className="tfe-form-label">Location</label>
                                        <input 
                                            type="text" 
                                            className="tfe-input" 
                                            placeholder="e.g., Nairobi, Kenya" 
                                            value={data.location} 
                                            onChange={e => setData('location', e.target.value)} 
                                            disabled={isViewOnly}
                                        />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="admin-form-group">
                                        <label className="tfe-form-label">Description</label>
                                        <textarea 
                                            className="tfe-input" 
                                            placeholder="Describe the event..." 
                                            rows={4}
                                            value={data.description} 
                                            onChange={e => setData('description', e.target.value)}
                                            disabled={isViewOnly}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div className="bounce-in">
                                <div className="admin-form-group mb-4">
                                    <label className="tfe-form-label">Event Banner Image</label>
                                    <div className="mb-3">
                                        {eventToEdit?.image_url && !imageFiles.length && (
                                            <div className="position-relative mb-3 rounded-4 overflow-hidden shadow-sm" style={{ height: '180px' }}>
                                                <img src={eventToEdit.image_url} alt="Current Preview" className="w-100 h-100 object-fit-cover" />
                                                <div className="position-absolute bottom-0 start-0 w-100 p-2" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                                                    <span className="text-white small fw-medium">Current Banner</span>
                                                </div>
                                            </div>
                                        )}
                                        <FilePondUploader 
                                            files={imageFiles}
                                            onUpdateFiles={(files) => {
                                                if (isViewOnly) return;
                                                setImageFiles(files);
                                                if (files[0]) setData('image', files[0].file);
                                            }}
                                            labelIdle={isViewOnly ? 'Event Banner' : 'Drag & Drop event banner or <span class="filepond--label-action">Browse</span>'}
                                            disabled={isViewOnly}
                                        />
                                    </div>
                                    <div className="alert-glass p-3 rounded-4 small text-medium-contrast">
                                        <i className="fas fa-info-circle me-2 text-blue-400"></i>
                                        Upload a high-quality banner image for better social engagement. Ideal ratio 16:9.
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'rsvps' && (
                            <div className="bounce-in">
                                <div className="p-5 text-center">
                                    <div className="mb-4">
                                        <i className="fas fa-users-slash fa-3x text-medium-contrast opacity-25"></i>
                                    </div>
                                    <h5 className="text-white fw-bold">RSVP Tracking</h5>
                                    <p className="text-medium-contrast mb-4">Detailed attendee tracking is coming in the next update.</p>
                                    
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div className="p-3 rounded-4 bg-glass-card shadow-sm text-center">
                                                <div className="display-6 fw-bold text-white mb-0">{eventToEdit?.rsvps_count || 0}</div>
                                                <div className="small text-medium-contrast uppercase tracking-wider">Total RSVPs</div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 rounded-4 bg-glass-card shadow-sm text-center">
                                                <div className="display-6 fw-bold text-white mb-0">100%</div>
                                                <div className="small text-medium-contrast uppercase tracking-wider">Confirmed</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setEventToEdit(null); reset(); }}>
                            {isViewOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!isViewOnly && (
                            <button type="submit" className="btn-submit-modal" disabled={processing}>
                                <i className="fas fa-check-circle me-2"></i>
                                {eventToEdit ? 'Save Changes' : 'Create Event'}
                            </button>
                        )}
                        {isViewOnly && (
                            <button type="button" className="btn-submit-modal" onClick={() => setIsViewOnly(false)}>
                                <i className="fas fa-edit me-2"></i> Edit Event
                            </button>
                        )}
                    </div>
                </form>
            </DashboardModal>

            {/* Toolbar */}
            <AdminToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search events..."
                showViewToggle={false}
                showSort={false}
            />

            {/* Events Display */}
            <div className="admin-card-dark">
                <div className="card-header">
                    <h3>
                        <i className="fas fa-calendar-alt"></i> 
                        {selectedCategory === 'all' ? 'All Events' : categories.find(c => c.key === selectedCategory)?.label}
                    </h3>
                    <span className="admin-badge admin-badge-gray">{filteredEvents.length} events</span>
                </div>
                
                <div className="card-body">
                    <ListingGrid
                        items={filteredEvents}
                        emptyIcon="fas fa-calendar-times"
                        emptyTitle="No events found"
                        emptyBody="Create an event, or clear the filters above."
                        to={(event) => ({
                            title: event.title,
                            eyebrow: event.type?.replace('_', ' ') || 'Event',
                            desc: event.description,
                            accent: '#3b82f6',
                            cover: event.image_url || undefined,
                            artwork: event.image_url ? undefined : { icon: 'fas fa-calendar' },
                            meta: [
                                { label: 'Date', value: event.date || event.start_date || '—' },
                                { label: 'Location', value: event.location || '—' },
                            ],
                            cornerButton: {
                                icon: 'fas fa-edit',
                                label: `Edit ${event.title}`,
                                onClick: () => handleEdit(event),
                            },
                        })}
                        tableView={
                            <table className="tfe-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Date</th>
                                        <th>Location</th>
                                        <th>Type</th>
                                        <th style={{ width: 130 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEvents.map((event) => (
                                        <tr key={event.id}>
                                            <td className="fw-semibold">{event.title}</td>
                                            <td>{event.date || event.start_date || '—'}</td>
                                            <td>{event.location || '—'}</td>
                                            <td>
                                                <span className="tfe-pill tfe-pill--info">
                                                    {event.type?.replace('_', ' ') || 'General'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="View event" onClick={() => handleView(event)}>
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Edit event" onClick={() => handleEdit(event)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--icon" aria-label="Delete event" onClick={() => setEventToDelete(event.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        }
                    />
                </div>
            </div>


            <ConfirmationDialog
                open={!!eventToDelete}
                onOpenChange={(open) => !open && setEventToDelete(null)}
                title="Delete Event?"
                description="Are you sure you want to delete this event? This action cannot be undone."
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </AdminLayout>
    );
}
