import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import '../../../css/fan/fan-pages.css';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Fan/DashboardModal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";

export default function Events({ auth, events, userRsvps = [] }) {
    const [activeTab, setActiveTab] = useState('details');
    const [activeFilter, setActiveFilter] = useState('all');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventToCancel, setEventToCancel] = useState(null);

    const handleRsvp = (eventId) => {
        router.post(route('fan.events.rsvp', eventId), { status: 'attending' }, {
            preserveScroll: true,
            onSuccess: () => toast.success('You have registered for the event!')
        });
    };

    const handleCancelRsvp = () => {
        if (!eventToCancel) return;
        router.delete(route('fan.events.rsvp.cancel', eventToCancel), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('RSVP cancelled');
                setEventToCancel(null);
            }
        });
    };

    // DB Type mapping for inconsistent data
    const categoryMap = {
        'All': [],
        'Match Events': ['Match t', 'match_event', 'Tournament', 'match'],
        'Watch Parties': ['watch_party'],
        'Fan Festivals': ['fan_fest', 'fan_festival'],
        'Fan Meetups': ['meetup', 'fan_meetup', 'Community', 'community']
    };

    const isRsvped = (eventId) => userRsvps.includes(eventId);

    const categories = ['All', 'Match Events', 'Watch Parties', 'Fan Festivals', 'Fan Meetups'];

    const filteredEvents = events.filter(event => {
        const matchesFilter = activeFilter === 'all' || (activeFilter === 'registered' && isRsvped(event.id));
        
        let matchesCategory = activeCategory === 'All';
        if (!matchesCategory) {
            const allowedTypes = categoryMap[activeCategory] || [];
            // looser check: if event type contains any of the allowed keywords
            matchesCategory = allowedTypes.some(type => event.type.toLowerCase().includes(type.toLowerCase()));
        }
        
        return matchesFilter && matchesCategory;
    });

    const modalTabs = [
        { id: 'details', label: 'Event Details', icon: 'fas fa-calendar-alt' },
        { id: 'location', label: 'Location', icon: 'fas fa-map-marker-alt' }
    ];

    return (
        <FanLayout user={auth.user} header="Events & Activities">
            <Head title="Events" />

            <div>
                {/* Hero Section */}
                <DashboardHero role="fan" 
                    title="Events & Activities"
                    subtitle="Discover local World Cup events, watch parties, and fan activities"
                    breadcrumbs={[{ label: 'Social' }, { label: 'Events' }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                {/* Ad Placeholder */}
                <div className="mb-4">
                    <AdPlaceholder position="horizontal" />
                </div>

                {/* Summary Cards */}
                <div className="summary-cards-grid mb-5">
                    <div className="fan-card-premium glow-red">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                <i className="fas fa-calendar"></i>
                            </div>
                            <h3 className="card-title-gaming">Events</h3>
                            <div className="card-value-gaming">{events.length}</div>
                            <div className="text-white-50 small mt-1">Found near you</div>
                        </div>
                    </div>
                    
                    <div className="fan-card-premium glow-blue">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h3 className="card-title-gaming">Registered</h3>
                            <div className="card-value-gaming">{userRsvps.length}</div>
                            <div className="text-white-50 small mt-1">My activities</div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="events-layout mt-4">
                    {/* Events List */}
                    <div className="events-main">
                        <div className="content-card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="fas fa-clock"></i>
                                    <h3>Upcoming Events</h3>
                                </div>
                                <div className="d-flex gap-2">
                                    <button 
                                        className={`btn-fan-custom btn-fan-custom-sm ${activeFilter === 'all' ? 'active' : 'opacity-50'}`}
                                        onClick={() => setActiveFilter('all')}
                                    >
                                        All
                                    </button>
                                    <button 
                                        className={`btn-fan-custom btn-fan-custom-sm ${activeFilter === 'registered' ? 'active' : 'opacity-50'}`}
                                        onClick={() => setActiveFilter('registered')}
                                    >
                                        My Events
                                    </button>
                                </div>
                            </div>
                            {filteredEvents.length > 0 ? (
                                <div className="events-list">
                                    {filteredEvents.map((event) => (
                                        <div key={event.id} className="event-card">
                                            <div className="event-image">
                                                <img 
                                                    src={event.image_url || '/assets/img/fan/backgrounds/events_hero.png'} 
                                                    alt={event.title} 
                                                    className="w-100 h-100 object-fit-cover" 
                                                />
                                                <div className="event-type-badge">{event.type.replace('_', ' ')}</div>
                                            </div>
                                            <div className="event-content">
                                                <div className="event-date">
                                                    <i className="fas fa-calendar"></i>
                                                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <h4 className="event-title">{event.title}</h4>
                                                <p className="event-description">{event.description}</p>
                                                <div className="event-footer">
                                                    <div className="event-location">
                                                        <i className="fas fa-map-marker-alt"></i> {event.location || 'TBA'}
                                                    </div>
                                                    <div className="event-actions">
                                                        <span className="event-price">Free</span>
                                                        <button className="btn-fan-custom btn-fan-custom-sm" onClick={() => setSelectedEvent(event)}>Details</button>
                                                        {isRsvped(event.id) ? (
                                                            <button className="btn-fan-custom btn-fan-custom-sm border-danger text-danger" onClick={() => setEventToCancel(event.id)}>X</button>
                                                        ) : (
                                                            <button className="btn-fan-custom btn-fan-custom-sm bg-primary border-primary" onClick={() => handleRsvp(event.id)}>Register</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state-inline">
                                    <i className="fas fa-calendar-times"></i>
                                    <p>No upcoming events found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="events-sidebar">
                        {/* Categories */}
                        <div className="content-card">
                            <div className="card-header">
                                <i className="fas fa-th-large"></i>
                                <h3>Categories</h3>
                            </div>
                            <div className="categories-list">
                                {categories.map((cat, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`category-item cursor-pointer transition-all ${activeCategory === cat ? 'active-category bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        <div className="category-icon">
                                            <i className={`fas ${cat === 'All' ? 'fa-list' : cat === 'Match Events' ? 'fa-futbol' : cat === 'Watch Parties' ? 'fa-tv' : cat === 'Fan Festivals' ? 'fa-music' : 'fa-users'}`}></i>
                                        </div>
                                        <div>
                                            <h5 className="category-title">{cat}</h5>
                                            <p className="category-subtitle">Browse {cat.toLowerCase()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationDialog
                open={!!eventToCancel}
                onOpenChange={(open) => !open && setEventToCancel(null)}
                title="Cancel RSVP?"
                description="Are you sure you want to cancel your RSVP for this event? You can RSVP again later if spots are available."
                onConfirm={handleCancelRsvp}
                confirmText="Cancel RSVP"
                variant="destructive"
            />

            {/* Reusable Dashboard Modal for Event Details */}
            {selectedEvent && (
                <DashboardModal
                    open={!!selectedEvent}
                    onOpenChange={(open) => !open && setSelectedEvent(null)}
                    title={selectedEvent.title}
                    label="Event Details"
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={modalTabs}
                >
                    {activeTab === 'details' && (
                        <>
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <span className="badge bg-primary">{selectedEvent.type.replace('_', ' ')}</span>
                                        {isRsvped(selectedEvent.id) && <span className="badge bg-success">Registered</span>}
                                    </div>
                                    <h4 className="text-white mb-2">Date & Time</h4>
                                    <div className="text-white-50">
                                        <i className="fas fa-calendar me-2"></i>
                                        {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                        <br />
                                        <i className="fas fa-clock me-2"></i>
                                        {new Date(selectedEvent.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="form-label">Description</h4>
                                <p className="text-white-50" style={{ lineHeight: '1.6' }}>
                                    {selectedEvent.description || 'No detailed description available for this event.'}
                                </p>
                            </div>

                            <div className="mb-4">
                                <h4 className="form-label">Registration</h4>
                                <p className="text-white-50 text-sm mb-3">
                                    {isRsvped(selectedEvent.id) 
                                        ? 'You are currently registered for this event. We look forward to seeing you there!' 
                                        : 'Space is limited. Register now to secure your spot.'}
                                </p>
                            </div>

                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setSelectedEvent(null)}>Close</button>
                                {isRsvped(selectedEvent.id) ? (
                                    <button 
                                        className="btn-submit-modal"
                                        style={{ background: '#dc3545' }}
                                        onClick={() => {
                                            setEventToCancel(selectedEvent.id);
                                            setSelectedEvent(null);
                                        }}
                                    >
                                        Cancel RSVP
                                    </button>
                                ) : (
                                    <button 
                                        className="btn-submit-modal bg-primary border-primary"
                                        onClick={() => {
                                            handleRsvp(selectedEvent.id);
                                            setSelectedEvent(null);
                                        }}
                                    >
                                        Register Now
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'location' && (
                        <>
                            <div className="mb-4">
                                <h4 className="form-label">Venue / Location</h4>
                                <div className="d-flex align-items-center gap-3 text-white">
                                    <div className="bg-white/10 p-3 rounded-circle" style={{ width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="fas fa-map-marker-alt text-primary fa-lg"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold">{selectedEvent.location || 'TBA'}</div>
                                        <div className="text-white-50 text-sm">Venue details</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/5 rounded-xl p-5 text-center border border-dashed border-white/20">
                                <i className="fas fa-map text-white-50 fa-3x mb-3"></i>
                                <p className="text-white-50">Map view is currently unavailable for this location.</p>
                            </div>

                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setSelectedEvent(null)}>Close</button>
                            </div>
                        </>
                    )}
                </DashboardModal>
            )}
        </FanLayout>
    );
}
