import React, { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

export default function AdPostCard({ ad, assetUrl }) {
    const impressionTracked = useRef(false);

    useEffect(() => {
        if (!impressionTracked.current && ad.id) {
            fetch(route('fan.ads.impression', ad.id), { method: 'POST' });
            impressionTracked.current = true;
        }
    }, [ad.id]);

    const handleClick = () => {
        if (ad.link_url) {
            fetch(route('fan.ads.click', ad.id), { method: 'POST' });
            window.open(ad.link_url, '_blank');
        }
    };

    return (
        <div className="feed-ad-post" onClick={handleClick}>
            <div className="ad-post-badge">
                <i className="fas fa-ad me-1"></i>Sponsored
            </div>
            <div className="ad-post-content">
                {ad.image_url ? (
                    <div className="ad-post-image-wrapper">
                        <img src={ad.image_url} alt={ad.title} className="ad-post-image" />
                    </div>
                ) : (
                    <div className="ad-post-illustration">
                        <i className="fas fa-bullhorn"></i>
                    </div>
                )}
                <div className="ad-post-info">
                    <h4 className="ad-post-title">{ad.title}</h4>
                    {ad.description && (
                        <p className="ad-post-description">{ad.description}</p>
                    )}
                    {ad.partner_name && (
                        <div className="ad-post-partner">
                            <i className="fas fa-building me-1"></i>
                            {ad.partner_name}
                        </div>
                    )}
                    {ad.link_url && (
                        <button className="ad-post-cta">
                            Learn More <i className="fas fa-arrow-right ms-1"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
