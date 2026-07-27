import React from 'react';
import '../../../css/fan/fan-dashboard-cards.css';

export default function FanFooter() {
    return (
        <div className="content-card footer-card mt-4 mb-5">
            <div className="footer-content">
                <div className="footer-section">
                    <h4>How to Reach Us</h4>
                    <div className="contact-info">
                        <p>WCTFE Dashboard</p>
                        <p>World Cup Travel Experience</p>
                        <p><a href="mailto:support@wctfe.com">support@wctfe.com</a></p>
                    </div>
                </div>

                <div className="footer-section">
                    <h4>Follow Us</h4>
                    <div className="social-links">
                        <a href="#0" className="social-link">
                            <i className="fab fa-facebook-f"></i>
                            <span>Facebook</span>
                        </a>
                        <a href="#0" className="social-link">
                            <i className="fab fa-twitter"></i>
                            <span>Twitter</span>
                        </a>
                        <a href="#0" className="social-link">
                            <i className="fab fa-instagram"></i>
                            <span>Instagram</span>
                        </a>
                    </div>
                </div>

                <div className="footer-section footer-actions">
                    <a href="mailto:support@wctfe.com" className="btn btn--primary support-btn">
                        <i className="fas fa-headset"></i>
                        <span>Get Support</span>
                    </a>
                    <div className="copyright">
                        <span>WCTFE Dashboard - My World Cup Journey</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
