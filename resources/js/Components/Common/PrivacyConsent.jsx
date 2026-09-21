import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import DashboardModal from '@/Components/Common/DashboardModal';
import { PrivacyPolicy, CookiePolicy, TermsOfService } from '@/Components/LegalDocs';
import '../../../css/privacy-consent.css';

export default function PrivacyConsent() {
    const { auth } = usePage().props;
    const [bannerVisible, setBannerVisible] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [activeLegalTab, setActiveLegalTab] = useState('privacy');

    const legalTabs = [
        { id: 'privacy', label: 'Privacy Policy', icon: 'fas fa-shield-alt' },
        { id: 'cookies', label: 'Cookie Policy', icon: 'fas fa-cookie-bite' },
        { id: 'terms', label: 'Terms of Service', icon: 'fas fa-file-contract' }
    ];

    const openLegal = (tab = 'privacy') => {
        setActiveLegalTab(tab);
        setShowLegalModal(true);
    };

    useEffect(() => {
        const localConsent = localStorage.getItem('privacy_consent');
        const userConsent = auth.user?.privacy_consent;

        if (auth.user) {
            // Logged in logic
            if (userConsent) {
                // User has consented in DB -> Sync to local and hide
                if (!localConsent) {
                    localStorage.setItem('privacy_consent', 'true');
                }
                setBannerVisible(false);
            } else {
                // User has NOT consented in DB
                if (localConsent) {
                    // But has local consent -> Sync to DB and hide
                    axios.post(route('profile.privacy'));
                    setBannerVisible(false);
                } else {
                    // No consent anywhere -> Show
                    setBannerVisible(true);
                }
            }
        } else {
            // Guest logic
            if (!localConsent) {
                setBannerVisible(true);
            }
        }
    }, [auth.user]);

    const handleAccept = () => {
        localStorage.setItem('privacy_consent', 'true');
        setBannerVisible(false);

        if (auth.user) {
            axios.post(route('profile.privacy'));
        }
    };

    if (!bannerVisible && !showLegalModal) return null;

    return (
        <>
            {/* Consent Banner — floating glass card */}
            {bannerVisible && (
                <div className="tfe-consent" role="dialog" aria-label="Cookie consent">
                    <span className="tfe-consent__badge">Privacy</span>
                    <h4 className="tfe-consent__title">We value your privacy</h4>
                    <p className="tfe-consent__body">
                        We use cookies to enhance your experience, analyze site traffic, and serve tailored content. By continuing you agree to our{' '}
                        <button onClick={() => openLegal('privacy')} className="tfe-consent__link">Privacy Policy</button>
                        {' '}and{' '}
                        <button onClick={() => openLegal('cookies')} className="tfe-consent__link">Cookie Policy</button>.
                    </p>
                    <div className="tfe-consent__actions">
                        <button onClick={handleAccept} className="tfe-consent__accept">Accept all</button>
                        <button onClick={() => openLegal('cookies')} className="tfe-consent__manage">Manage</button>
                    </div>
                </div>
            )}

            {/* Legal Documents Modal */}
            <DashboardModal
                open={showLegalModal}
                onOpenChange={setShowLegalModal}
                title="Legal Documents"
                label="Compliance"
                activeTab={activeLegalTab}
                onTabChange={setActiveLegalTab}
                tabs={legalTabs}
            >
                <div className="modal-body overflow-y-auto" style={{ maxHeight: '80vh' }}>
                    {activeLegalTab === 'privacy' && <PrivacyPolicy />}
                    {activeLegalTab === 'cookies' && <CookiePolicy />}
                    {activeLegalTab === 'terms' && <TermsOfService />}
                </div>
            </DashboardModal>
        </>
    );
}
