import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import DashboardModal from '@/Components/Common/DashboardModal';
import { PrivacyPolicy, CookiePolicy, TermsOfService } from '@/Components/LegalDocs';

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
            {/* Consent Banner */}
            {bannerVisible && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    padding: '20px',
                    zIndex: 9999,
                    borderTop: '1px solid #333',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <h4 style={{ fontSize: '16px', marginBottom: '8px', color: '#e31b23' }}>We value your privacy</h4>
                        <p style={{ fontSize: '14px', color: '#ccc', margin: 0 }}>
                            We use cookies to enhance your experience, analyze site traffic, and serve tailored advertisements. 
                            By continuing to visit this site you agree to our use of cookies. 
                            <button 
                                onClick={() => openLegal('privacy')} 
                                style={{ background: 'none', border: 'none', color: '#e31b23', textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px' }}
                            >
                                Privacy Policy
                            </button>
                            &nbsp;and&nbsp;
                            <button 
                                onClick={() => openLegal('cookies')} 
                                style={{ background: 'none', border: 'none', color: '#e31b23', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                Cookie Policy
                            </button>.
                        </p>
                    </div>
                    <div>
                        <button 
                            onClick={handleAccept}
                            style={{
                                backgroundColor: '#e31b23',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Accept All
                        </button>
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
