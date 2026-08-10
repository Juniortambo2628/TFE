import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm } from '@inertiajs/react';
import '../../../css/fan/fan-pages.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import { useTournament } from '@/Context/TournamentContext';

export default function Contact({ auth }) {
    const { tournament } = useTournament();
    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        priority: 'medium',
        message: '',
    });

    const [activeFaq, setActiveFaq] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        post(route('fan.contact.store'), {
            onSuccess: () => reset(),
        });
    };

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const faqs = [
        { question: "How do I make a payment for my booking?", answer: "You can make payments through your dashboard by going to the Payments section. We accept various payment methods including credit cards, mobile money, and bank transfers." },
        { question: "Can I modify my booking after payment?", answer: "Yes, you can modify your booking through the Journey section of your dashboard. Changes may be subject to availability and additional fees." },
        { question: "What happens if I need to cancel my trip?", answer: "Cancellation policies vary depending on your booking type and timing. Please contact our support team for specific cancellation terms and refund information." },
        { question: "How do I update my personal information?", answer: "You can update your personal information in the Profile section of your dashboard. Make sure to keep your contact details current for important updates." }
    ];

    return (
        <FanLayout user={auth.user} header="Contact Support">
            <Head title="Contact" />

            <div className="">
                <DashboardHero role="fan" 
                    title="Contact Support"
                    subtitle={`Get help with your ${tournament?.short_name || 'tournament'} journey. We're here to assist you.`}
                    breadcrumbs={[{ label: 'Contact Support' }]}
                    bgImage="/assets/img/fan/backgrounds/social_hero.png"
                />

                {/* Stats Cards */}
                {/* Stats Cards */}
                <div className="summary-cards-grid">
                    <div className="fan-card-premium glow-red">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                <i className="fas fa-envelope"></i>
                            </div>
                            <h3 className="card-title-gaming">Support Email</h3>
                            <div className="card-value-gaming" style={{ fontSize: '1.2rem' }}>support@wctfe.com</div>
                            <div className="text-white-50 small mt-1">24/7 Support</div>
                        </div>
                    </div>
                    
                    <div className="fan-card-premium glow-blue">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                <i className="fas fa-phone"></i>
                            </div>
                            <h3 className="card-title-gaming">Phone Support</h3>
                            <div className="card-value-gaming">+254 700 000 000</div>
                            <div className="text-white-50 small mt-1">Mon-Fri 9AM-6PM</div>
                        </div>
                    </div>
                    
                    <div className="fan-card-premium glow-red">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#ff2d55' }}>
                                <i className="fas fa-comments"></i>
                            </div>
                            <h3 className="card-title-gaming">Live Chat</h3>
                            <div className="card-value-gaming">AVAILABLE</div>
                            <div className="text-white-50 small mt-1">Instant Support</div>
                        </div>
                    </div>
                    
                    <div className="fan-card-premium glow-blue">
                        <div className="card-content-gaming">
                            <div className="card-icon-gaming" style={{ color: '#00d2ff' }}>
                                <i className="fas fa-clock"></i>
                            </div>
                            <h3 className="card-title-gaming">Response Time</h3>
                            <div className="card-value-gaming">&lt; 2 HOURS</div>
                            <div className="text-white-50 small mt-1">Average Time</div>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="content-cards-grid">
                    {/* Contact Form */}
                    <div className="content-card">
                        <div className="card-header">
                            <i className="fas fa-paper-plane"></i>
                            <h3>Send us a Message</h3>
                        </div>
                        <form onSubmit={submit} className="contact-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <select
                                        id="subject"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        required
                                    >
                                        <option value="">Select a subject</option>
                                        <option value="booking">Booking Inquiry</option>
                                        <option value="payment">Payment Issue</option>
                                        <option value="technical">Technical Support</option>
                                        <option value="general">General Question</option>
                                        <option value="feedback">Feedback</option>
                                    </select>
                                    {errors.subject && <div className="form-error">{errors.subject}</div>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="priority">Priority</label>
                                    <select
                                        id="priority"
                                        value={data.priority}
                                        onChange={(e) => setData('priority', e.target.value)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    rows="6"
                                    placeholder="Please describe your issue or question in detail..."
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    required
                                ></textarea>
                                {errors.message && <div className="form-error">{errors.message}</div>}
                            </div>
                            <div className="form-actions">
                                <button type="submit" disabled={processing} className="btn-primary">
                                    <i className="fas fa-paper-plane"></i>
                                    {processing ? 'Sending...' : 'Send Message'}
                                </button>
                                <button type="button" onClick={() => reset()} className="btn-secondary">
                                    <i className="fas fa-eraser"></i> Clear
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* FAQ Section */}
                    <div className="content-card">
                        <div className="card-header">
                            <i className="fas fa-question-circle"></i>
                            <h3>Frequently Asked Questions</h3>
                        </div>
                        <div className="faq-list">
                            {faqs.map((faq, index) => (
                                <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                                    <button className="faq-question" onClick={() => toggleFaq(index)}>
                                        <h4>{faq.question}</h4>
                                        <i className="fas fa-chevron-down"></i>
                                    </button>
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </FanLayout>
    );
}
