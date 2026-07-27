import React from 'react';

export default function EmptyState({ icon = 'fas fa-inbox', title = 'No data', description, className = '' }) {
    return (
        <div className={`text-center py-5 ${className}`} style={{ opacity: 0.6 }}>
            <i className={`${icon} d-block mb-2`} style={{ fontSize: '2rem' }}></i>
            <div className="text-white fw-semibold">{title}</div>
            {description && <div className="text-white-50 small mt-1">{description}</div>}
        </div>
    );
}
