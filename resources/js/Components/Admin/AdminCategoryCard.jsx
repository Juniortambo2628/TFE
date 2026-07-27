import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useAdminTheme } from '@/Contexts/AdminThemeContext';
import AdminCustomizeModal from '@/Components/Admin/AdminCustomizeModal';

export default function AdminCategoryCard({ 
    label, 
    subtitle,
    image, 
    settingsKey, 
    active,
    onClick,
    className = "" 
}) {
    const { adminSettings = {} } = usePage().props;
    const { editMode } = useAdminTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Determine the actual image to use
    const displayImage = (settingsKey && adminSettings[settingsKey]) || image;

    // Determine background style
    const cardStyle = displayImage ? {
        backgroundImage: `url(${displayImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {};

    return (
        <div 
            onClick={editMode ? null : onClick}
            className={`visual-card ${active ? 'active' : ''} ${className} ${editMode ? 'edit-mode-active' : ''}`} 
            style={{ 
                position: 'relative',
                overflow: 'hidden',
                cursor: editMode ? 'default' : 'pointer',
                minWidth: '180px'
            }}
        >
            <div className="visual-card-bg" style={cardStyle}></div>
            <div className="visual-card-overlay"></div>
            <div className="visual-card-check"><i className="fas fa-check"></i></div>
            
            {/* Live Edit Overlay */}
            {editMode && settingsKey && (
                <div 
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ 
                        background: 'rgba(59, 130, 246, 0.4)', 
                        backdropFilter: 'blur(4px)',
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                    }}
                >
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                        }}
                        className="btn btn-sm btn-light fw-bold"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    >
                        <i className="fas fa-image me-1"></i> Edit Background
                    </button>
                </div>
            )}
            
            <div className="visual-card-content">
                <div className="visual-card-title">{label}</div>
                {subtitle && <div className="visual-card-subtitle">{subtitle}</div>}
            </div>

            <AdminCustomizeModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                cardData={{
                    label,
                    settingsKey,
                    currentImage: displayImage
                }}
            />
        </div>
    );
}
