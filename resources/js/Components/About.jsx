import React from 'react';

export default function About() {
    return (
        <section className="stats-facts py-5 py-lg-11 py-xl-12 position-relative overflow-hidden bg-dark" id="about">
            <div className="container">
            <div className="row gap-7 gap-xl-0">
                <div className="col-xl-4 col-xxl-4">
                <div className="d-flex align-items-center gap-7 py-2" data-aos="fade-right" data-aos-delay="100" data-aos-duration="1000">
                    <span className="round-36 flex-shrink-0 text-white rounded-circle bg-primary hstack justify-content-center fw-medium">01</span>
                    <hr className="border-line border-white border-opacity-25"/>
                    <span className="badge text-bg-primary">About TFE</span>
                </div>
                </div>
                <div className="col-xl-8 col-xxl-7">
                <div className="d-flex flex-column gap-9">
                    <div className="row">
                    <div className="col-xxl-8">
                        <div className="d-flex flex-column gap-6" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
                        <h2 className="mb-0 text-white fw-bold display-6">What is The Football Experience?</h2>
                        <p className="fs-5 mb-0 text-white text-opacity-70">WCTFE is a specialized platform designed exclusively for <span className="fw-bold" style={{color: '#ef4050'}}>African football fans</span> who dream of experiencing the FIFA World Cup 2026 in North America. We break down financial barriers and create pathways for passionate fans to witness history in the making.</p>
                        </div>
                    </div>
                    </div>
                    <div className="row row-cols-1 row-cols-md-2 g-4 mb-4">
                      {/* Stat 1 */}
                      <div className="col">
                        <div className="d-flex flex-column gap-2 pt-4 border-top border-white border-opacity-25" data-aos="fade-up" data-aos-delay="200" data-aos-duration="1000">
                          <h2 className="mb-0 fs-4 text-white fw-bold">KES 450,000</h2>
                          <div className="d-flex align-items-center justify-content-between">
                            <p className="mb-0 text-white text-opacity-70">Planned Budget</p>
                            <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 rounded-pill">On Track</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stat 2 */}
                      <div className="col">
                        <div className="d-flex flex-column gap-2 pt-4 border-top border-white border-opacity-25" data-aos="fade-up" data-aos-delay="300" data-aos-duration="1000">
                          <h2 className="mb-0 fs-4 text-white fw-bold">KES 150,000</h2>
                          <div className="d-flex align-items-center justify-content-between">
                            <p className="mb-0 text-white text-opacity-70">Total Paid</p>
                            <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 rounded-pill">4 transactions</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stat 3 */}
                      <div className="col">
                         <div className="d-flex flex-column gap-2 pt-4 border-top border-white border-opacity-25" data-aos="fade-up" data-aos-delay="400" data-aos-duration="1000">
                          <h2 className="mb-0 fs-4 text-white fw-bold">3 Matches</h2>
                          <div className="d-flex align-items-center justify-content-between">
                            <p className="mb-0 text-white text-opacity-70">Active Bookings</p>
                            <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 rounded-pill">Confirmed</span>
                          </div>
                         </div>
                      </div>
                      
                      {/* Stat 4 */}
                      <div className="col">
                        <div className="d-flex flex-column gap-2 pt-4 border-top border-white border-opacity-25" data-aos="fade-up" data-aos-delay="500" data-aos-duration="1000">
                          <h2 className="mb-0 fs-4 text-white fw-bold">12 Members</h2>
                           <div className="d-flex align-items-center justify-content-between">
                            <p className="mb-0 text-white text-opacity-70">My Tribe</p>
                            <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 rounded-pill">Active Group</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <a href="#features" className="btn-glass-pill mt-4" style={{ background: '#e31b23', borderColor: '#e31b23' }}>
                        <span>Learn More</span>
                        <iconify-icon icon="lucide:arrow-up-right" className="btn-icon"></iconify-icon>
                    </a>
                </div>
                </div>
            </div>
            </div>
        </section>
    );
}
