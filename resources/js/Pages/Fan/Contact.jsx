import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm } from '@inertiajs/react';
import '../../../css/fan/fan-pages.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
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
        <FanLayout title="Contact Support">
            <Head title="Contact" />

            <div className="">
                <DashboardHero role="fan" 
                    title="Contact Support"
                    subtitle={`Get help with your ${tournament?.short_name || 'tournament'} journey. We're here to assist you.`}
                    breadcrumbs={[{ label: 'Contact Support' }]}
                    bgImage="/assets/img/fan/backgrounds/social_hero.png"
                />

                <SummaryTiles
                    items={[
                        { label: 'Support email',  value: 'support@wctfe.com', icon: 'fa-envelope', accent: 'red',  subtext: '24/7 support' },
                        { label: 'Phone support',  value: '+254 700 000 000',  icon: 'fa-phone',    accent: 'blue', subtext: 'Mon–Fri 9am–6pm' },
                        { label: 'Live chat',      value: 'Available',          icon: 'fa-comments', accent: 'teal', subtext: 'Instant support' },
                        { label: 'Response time',  value: '< 2 hours',          icon: 'fa-clock',    accent: 'rose', subtext: 'Average' },
                    ]}
                />

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
