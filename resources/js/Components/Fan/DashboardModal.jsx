import React, { useEffect } from 'react';
import '../../../css/fan/dashboard-modals.css';

/**
 * Reusable Dashboard Modal Component
 * 
 * @param {boolean} open - Whether the modal is open
 * @param {function} onOpenChange - Function to handle close/open state
 * @param {string} title - The title/name displayed in the sidebar
 * @param {string} label - The label above the title (e.g. "Event Details", "Profile Settings")
 * @param {string} activeTab - The key of the currently active tab
 * @param {function} onTabChange - Function to handle tab changes
 * @param {Array} tabs - Array of tab objects: { id: 'info', label: 'Info', icon: 'fas fa-info' }
 * @param {React.ReactNode} children - The content to display in the right panel
 */
export default function DashboardModal({ 
    open, 
    onOpenChange, 
    title, 
    label, 
    activeTab, 
    onTabChange, 
    tabs = [], 
    children 
}) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="dashboard-modal-overlay" onClick={() => onOpenChange(false)}>
            <div 
                className="dashboard-modal" 
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                {/* Left Sidebar — Tabs */}
                <div className="dashboard-modal-sidebar">
                    <div className="modal-title-area">
                        <div className="modal-title-label">{label}</div>
                        <h3 id="modal-title" className="modal-title-text">{title}</h3>
                    </div>
                    
                    <div className="modal-tabs-container">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                className={`dashboard-modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => onTabChange(tab.id)}
                            >
                                <i className={tab.icon}></i> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="dashboard-modal-content">
                    <div className="modal-content-header">
                        <button 
                            className="close-modal-btn" 
                            onClick={() => onOpenChange(false)}
                            aria-label="Close"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    {children}
                </div>
            </div>
        </div>
    );
}
