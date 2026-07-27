import React from 'react';
import { Link } from '@inertiajs/react';

export default function DashboardPreview() {
    // Mock data for illustration
    const stats = {
        budget: "KES 450,000",
        spent: "KES 150,000",
        bookings: "3 Matches",
        tribe: "12 Members"
    };

    return (
        <section className="dashboard-preview py-5 py-lg-10 bg-dark" id="dashboard-preview">
            <div className="container">
                <div className="row justify-content-center mb-5">
                    <div className="col-lg-8 text-center" data-aos="fade-up">
                        <span className="badge text-bg-primary mb-3">Fan Dashboard</span>
                        <h2 className="display-6 fw-bold text-white mb-3">Your World Cup Command Center</h2>
                        <p className="text-white text-opacity-70 fs-5">
                            Manage your budget, book matches, and coordinate with your tribe all in one place.
                        </p>
                    </div>
                </div>

                <div className="summary-cards-grid" data-aos="fade-up" data-aos-delay="200">
                    {/* Budget Card */}
                    <div className="summary-card budget-card">
                        <div className="card-icon"><i className="fas fa-map-marked-alt"></i></div>
                        <div className="card-content">
                            <div className="card-value">{stats.budget}</div>
                            <div className="card-label">Planned Budget</div>
                            <div className="card-change">On Track</div>
                        </div>
                    </div>
                    
                    {/* Expenses Card */}
                    <div className="summary-card expenses-card">
                        <div className="card-icon"><i className="fas fa-credit-card"></i></div>
                        <div className="card-content">
                            <div className="card-value">{stats.spent}</div>
                            <div className="card-label">Total Paid</div>
                            <div className="card-change">4 transactions</div>
                        </div>
                    </div>

                    {/* Bookings Card */}
                    <div className="summary-card projects-card">
                        <div className="card-icon"><i className="fas fa-ticket-alt"></i></div>
                        <div className="card-content">
                            <div className="card-value">{stats.bookings}</div>
                            <div className="card-label">Active Bookings</div>
                            <div className="card-change">Confirmed</div>
                        </div>
                    </div>

                    {/* Tribe Card */}
                    <div className="summary-card photos-card">
                        <div className="card-icon"><i className="fas fa-users"></i></div>
                        <div className="card-content">
                            <div className="card-value">{stats.tribe}</div>
                            <div className="card-label">My Tribe</div>
                            <div className="card-change text-success">Active Group</div>
                        </div>
                    </div>
                </div>

                 <div className="text-center mt-5" data-aos="fade-up" data-aos-delay="400">
                    <Link href={route('register')} className="btn btn-primary btn-lg rounded-pill px-5">
                        Start Planning Now
                    </Link>
                </div>
            </div>
        </section>
    );
}
