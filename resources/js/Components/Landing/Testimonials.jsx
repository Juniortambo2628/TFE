import React, { useState, useEffect } from 'react';

export default function Testimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        rating: 5,
        role: ''
    });
    const [submitStatus, setSubmitStatus] = useState(null);

    useEffect(() => {
        fetch('/testimonials')
            .then(res => res.json())
            .then(data => {
                setTestimonials(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch testimonials", err);
                setLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRating = (r) => {
        setFormData({ ...formData, rating: r });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitStatus('submitting');
        
        fetch('/testimonials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            body: JSON.stringify(formData)
        })
        .then(res => res.json())
        .then(data => {
            setSubmitStatus('success');
            setTestimonials([data.testimonial, ...testimonials]);
            setFormData({ name: '', content: '', rating: 5, role: '' });
            setTimeout(() => setShowForm(false), 2000);
        })
        .catch(err => {
            console.error("Error submitting", err);
            setSubmitStatus('error');
        });
    };

    return (
        <section className="testimonials py-5 py-lg-11 py-xl-12 bg-dark position-relative" id="community" style={{ overflow: 'hidden' }}>
            {/* Background enhancement */}
             <div className="position-absolute top-0 start-50 translate-middle w-50 h-50 bg-primary opacity-10 rounded-circle blur-3xl"></div>

            <div className="container position-relative z-1">
                <div className="row justify-content-center mb-8">
                    <div className="col-12 col-md-10 col-lg-8 text-center" data-aos="fade-up">
                        <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 rounded-pill mb-3">Our Community</span>
                        <h2 className="display-5 fw-bold text-white mb-4">What Fans Say</h2>
                        <p className="lead text-white text-opacity-70">Join thousands of African football fans experiencing the World Cup journey with us.</p>
                    </div>
                </div>

                <div className="row g-4 mb-8">
                    {loading ? (
                         <div className="col-12 text-center text-white opacity-50">Loading stories...</div>
                    ) : testimonials.length > 0 ? (
                        testimonials.map((item, index) => (
                            <div className="col-md-6 col-lg-4" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                                <div className="card h-100 border border-white border-opacity-10" 
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.05)', 
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '16px'
                                    }}>
                                    <div className="card-body p-4 d-flex flex-column">
                                        <div className="mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={`fas fa-star me-1 ${i < item.rating ? 'text-white' : 'text-white text-opacity-25'}`}></i>
                                            ))}
                                        </div>
                                        <p className="text-white text-opacity-90 fs-5 mb-4 flex-grow-1" style={{ fontStyle: 'italic' }}>"{item.content}"</p>
                                        <div className="d-flex align-items-center mt-auto">
                                            <div className="round-40 rounded-circle bg-white bg-opacity-20 d-flex align-items-center justify-content-center text-white fw-bold me-3">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h5 className="text-white fs-6 fw-bold mb-0">{item.name}</h5>
                                                {item.role && <small className="text-white text-opacity-50">{item.role}</small>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center text-white text-opacity-50">
                            No testimonials yet. Be the first to verify!
                        </div>
                    )}
                </div>

                <div className="text-center" data-aos="fade-up">
                    <button 
                        onClick={() => setShowForm(!showForm)} 
                        className="btn btn-primary btn-lg rounded-pill px-5"
                    >
                        {showForm ? 'Close Form' : 'Share Your Experience'}
                    </button>
                </div>

                {/* Submission Form */}
                {showForm && (
                     <div className="row justify-content-center mt-5" data-aos="fade-up">
                        <div className="col-md-8 col-lg-6">
                            <div className="card border border-white border-opacity-10"
                                style={{ 
                                    background: 'rgba(255, 255, 255, 0.05)', 
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px'
                                }}>
                                <div className="card-body p-5">
                                    <h3 className="text-white mb-4 text-center">Share Your Story</h3>
                                    
                                    {submitStatus === 'success' ? (
                                        <div className="alert alert-success bg-success bg-opacity-25 text-white border-success">
                                            Thank you! Your testimonial has been submitted.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="testimonials-form">
                                            <div className="mb-3">
                                                <label className="form-label text-white text-opacity-80">Rating</label>
                                                <div className="d-flex gap-2 mb-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <i 
                                                            key={star} 
                                                            className={`fas fa-star fs-4 cursor-pointer ${formData.rating >= star ? 'text-white' : 'text-white text-opacity-25'}`}
                                                            onClick={() => handleRating(star)}
                                                            style={{ cursor: 'pointer' }}
                                                        ></i>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                     <div className="mb-3">
                                                        <label className="form-label text-white text-opacity-80">Name</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control bg-transparent border-white border-opacity-25 text-white focus-white" 
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Your Name"
                                                            style={{ color: 'white' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                     <div className="mb-3">
                                                        <label className="form-label text-white text-opacity-80">Role (Optional)</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control bg-transparent border-white border-opacity-25 text-white" 
                                                            name="role"
                                                            value={formData.role}
                                                            onChange={handleChange}
                                                            placeholder="e.g. Fan Club Member"
                                                            style={{ color: 'white' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-4">
                                                <label className="form-label text-white text-opacity-80">Your Message</label>
                                                <textarea 
                                                    className="form-control bg-transparent border-white border-opacity-25 text-white" 
                                                    rows="4" 
                                                    name="content"
                                                    value={formData.content}
                                                    onChange={handleChange}
                                                    required
                                                    style={{ color: 'white' }}
                                                ></textarea>
                                            </div>
                                            
                                            <button 
                                                type="submit" 
                                                className="btn btn-light w-100 fw-bold"
                                                disabled={submitStatus === 'submitting'}
                                            >
                                                {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                     </div>
                )}
            </div>
        </section>
    );
}
