import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import '../../../css/fan/fan-pages.css';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Common/DashboardModal';
import { useTournament } from '@/Context/TournamentContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";

export default function Events({ auth, events, userRsvps = [] }) {
    const { tournament } = useTournament();
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
                    subtitle={`Discover local ${tournament?.short_name || 'tournament'} events, watch parties, and fan activities`}
                    breadcrumbs={[{ label: 'Social' }, { label: 'Events' }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                {/* Ad Placeholder */}
                <div className="mb-4">
                    <AdPlaceholder position="horizontal" />
                </div>

                <SummaryTiles
                    className="mb-5"
                    items={[
                        { label: 'Events',     value: events.length,    icon: 'fa-calendar',      accent: 'red',  subtext: 'Found near you' },
                        { label: 'Registered', value: userRsvps.length, icon: 'fa-check-circle',  accent: 'blue', subtext: 'My activities' },
                    ]}
                />

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
                                        type="button"
                                        className="tfe-btn tfe-btn--sm"
                                        aria-pressed={activeFilter === 'all'}
                                        onClick={() => setActiveFilter('all')}
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        className="tfe-btn tfe-btn--sm"
                                        aria-pressed={activeFilter === 'registered'}
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
                                                        <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setSelectedEvent(event)}>Details</button>
                                                        {isRsvped(event.id) ? (
                                                            <button type="button" className="tfe-btn tfe-btn--sm" onClick={() => setEventToCancel(event.id)} aria-label="Cancel RSVP">
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        ) : (
                                                            <button type="button" className="tfe-btn tfe-btn--filled tfe-btn--sm" onClick={() => handleRsvp(event.id)}>Register</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="tfe-empty tfe-empty--inline">
                                    <div className="tfe-empty__icon"><i className="fas fa-calendar-times"></i></div>
                                    <div className="tfe-empty__body">No upcoming events found.</div>
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
                                        <span className="tfe-pill tfe-pill--info">{selectedEvent.type.replace('_', ' ')}</span>
                                        {isRsvped(selectedEvent.id) && <span className="tfe-pill tfe-pill--approved">Registered</span>}
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
                                <h4 className="tfe-form-label">Description</h4>
                                <p className="text-white-50 lh-base">
                                    {selectedEvent.description || 'No detailed description available for this event.'}
                                </p>
                            </div>

                            <div className="mb-4">
                                <h4 className="tfe-form-label">Registration</h4>
                                <p className="text-white-50 text-sm mb-3">
                                    {isRsvped(selectedEvent.id) 
                                        ? 'You are currently registered for this event. We look forward to seeing you there!' 
                                        : 'Space is limited. Register now to secure your spot.'}
                                </p>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="tfe-btn" onClick={() => setSelectedEvent(null)}>Close</button>
                                {isRsvped(selectedEvent.id) ? (
                                    <button
                                        type="button"
                                        className="tfe-btn"
                                        onClick={() => {
                                            setEventToCancel(selectedEvent.id);
                                            setSelectedEvent(null);
                                        }}
                                    >
                                        Cancel RSVP
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="tfe-btn tfe-btn--filled"
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
                                <h4 className="tfe-form-label">Venue / Location</h4>
                                <div className="d-flex align-items-center gap-3 text-white">
                                    <div className="event-location-glyph">
                                        <i className="fas fa-map-marker-alt fa-lg"></i>
                                    </div>
                                    <div>
                                        <div className="fw-bold">{selectedEvent.location || 'TBA'}</div>
                                        <div className="text-white-50 small">Venue details</div>
                                    </div>
                                </div>
                            </div>

                            <div className="tfe-empty tfe-empty--inline">
                                <div className="tfe-empty__icon"><i className="fas fa-map"></i></div>
                                <div className="tfe-empty__body">Map view is currently unavailable for this location.</div>
                            </div>

                            <div className="d-flex justify-content-end mt-4">
                                <button type="button" className="tfe-btn" onClick={() => setSelectedEvent(null)}>Close</button>
                            </div>
                        </>
                    )}
                </DashboardModal>
            )}
        </FanLayout>
    );
}
