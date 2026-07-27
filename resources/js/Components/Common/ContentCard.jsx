import React from 'react';

export default function ContentCard({ icon, title, action, children, className = '' }) {
    return (
        <div className={`content-card ${className}`}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <h3 className="mb-0">
                    {icon && <i className={`${icon} me-2`}></i>}
                    {title}
                </h3>
                {action}
            </div>
            <div>
                {children}
            </div>
        </div>
    );
}
