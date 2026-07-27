import React from 'react';

export default function AdPlaceholder({ position = 'horizontal', className = '' }) {
    const isHorizontal = position === 'horizontal';
    
    // Dimensions based on standard IAB ad units
    // Horizontal: Leaderboard (728x90) or similar
    // Vertical: Skyscraper (160x600) or similar
    // Rectangle: Medium Rectangle (300x250)

    const style = {
        background: 'linear-gradient(45deg, #2a2a2a 25%, #333 25%, #333 50%, #2a2a2a 50%, #2a2a2a 75%, #333 75%, #333 100%)',
        backgroundSize: '20px 20px',
        border: '2px dashed #444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: isHorizontal ? '120px' : '300px',
        color: '#666',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        resize: 'both',
        overflow: 'hidden',
        position: 'relative'
    };

    return (
        <div className={`ad-placeholder ${className}`} style={style}>
            <div className="text-center p-3">
                <i className="fas fa-ad fa-2x mb-2 d-block opacity-50"></i>
                <span>Advertisement Space</span>
                <div className="small opacity-50 mt-1">
                    {isHorizontal ? 'Leaderboard / Banner' : 'Sidebar / Rectangle'}
                </div>
            </div>
            <div style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                fontSize: '10px',
                background: '#444',
                color: '#aaa',
                padding: '2px 5px',
                borderRadius: '3px'
            }}>
                Sponsor
            </div>
        </div>
    );
}
