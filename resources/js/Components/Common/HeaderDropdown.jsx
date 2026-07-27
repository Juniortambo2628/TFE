import React from 'react';

const dropdownStyle = {
    display: 'block',
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: '0',
    width: '320px',
    maxWidth: '90vw',
    zIndex: 1000,
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    overflow: 'hidden'
};

export default function HeaderDropdown({ isOpen, title, badge, children, footer }) {
    if (!isOpen) return null;

    return (
        <div style={dropdownStyle}>
            <div className="p-3" style={{ borderBottom: '1px solid #333' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className="text-white mb-0">{title}</h6>
                    {badge && <span className="admin-badge admin-badge-blue">{badge}</span>}
                </div>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {children}
            </div>
            {footer && (
                <div style={{ borderTop: '1px solid #333' }}>
                    {footer}
                </div>
            )}
        </div>
    );
}

export { dropdownStyle };
