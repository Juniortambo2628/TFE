import React from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, Link } from '@inertiajs/react';
import FanHero from '@/Components/Fan/FanHero';
import AdPlaceholder from '@/Components/Common/AdPlaceholder';
import '../../../css/fan/dashboard.css';

export default function Activities({ auth, activities }) {
    const formatMoney = (amount) => 'KES ' + new Intl.NumberFormat().format(amount || 0);

    return (
        <FanLayout title="My Activity">
            <Head title="Activity History" />
            
            <div className="container-fluid p-0">
                <FanHero 
                    title="Activity History"
                    subtitle="Track your recent interactions, bookings, and payments"
                    breadcrumbs={[
                        { label: 'Activity' }
                    ]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                />

                <div className="mb-4 px-4">
                    <AdPlaceholder position="horizontal" />
                </div>

                <div className="px-4 pb-5">
                    <div className="content-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <i className="fas fa-history"></i>
                                <h3 className="m-0">Full Activity Log</h3>
                            </div>
                        </div>
                        
                        <div className="activity-list p-3">
                            {activities && activities.length > 0 ? (
                                <div className="d-flex flex-column gap-3">
                                    {activities.map((activity, index) => (
                                        <div key={activity.id} className="activity-item-full d-flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                            <div className={`activity-icon-large d-flex align-items-center justify-content-center rounded-circle`} 
                                                 style={{ 
                                                     width: '60px', 
                                                     height: '60px', 
                                                     background: activity.type === 'payment' ? 'rgba(0, 210, 255, 0.1)' : activity.type === 'booking' ? 'rgba(255, 45, 85, 0.1)' : 'rgba(255, 215, 0, 0.1)',
                                                     color: activity.type === 'payment' ? '#00d2ff' : activity.type === 'booking' ? '#ff2d55' : '#ffd700',
                                                     fontSize: '1.5rem',
                                                     flexShrink: 0
                                                 }}>
                                                <i className={`fas ${activity.icon}`}></i>
                                            </div>
                                            
                                            <div className="activity-content-full flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h4 className="h5 fw-bold text-white mb-1">{activity.title}</h4>
                                                        <div className="text-white-50">{activity.description}</div>
                                                    </div>
                                                    <div className="text-end">
                                                        <div className="text-white fw-bold h5 mb-1">
                                                            {activity.amount > 0 ? formatMoney(activity.amount) : 'Social'}
                                                        </div>
                                                        <div className="small text-white-50">{activity.date}</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="activity-footer-full mt-3 d-flex gap-3">
                                                    <Link 
                                                        href={activity.type === 'payment' ? route('fan.payments') : activity.type === 'booking' ? route('fan.journey') : route('fan.events')} 
                                                        className="btn-fan-custom btn-fan-custom-sm py-1 px-3"
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <i className="fas fa-history fa-4x text-white-50 mb-3 opacity-20"></i>
                                    <h4 className="text-white">No activity yet</h4>
                                    <p className="text-white-50">Your personal activity history will appear here once you start exploring the World Cup journey.</p>
                                    <Link href={route('fan.dashboard')} className="btn-fan-custom mt-3">Back to Dashboard</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .activity-item-full {
                    animation: fadeInUp 0.5s ease forwards;
                    opacity: 0;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .activity-item-full:nth-child(2) { animation-delay: 0.1s; }
                .activity-item-full:nth-child(3) { animation-delay: 0.2s; }
                .activity-item-full:nth-child(4) { animation-delay: 0.3s; }
                .activity-item-full:nth-child(5) { animation-delay: 0.4s; }
            `}} />
        </FanLayout>
    );
}
