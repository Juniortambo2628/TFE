import React from 'react';
import { usePage } from '@inertiajs/react';
import '../../../css/partner-carousel.css';

export default function PartnerCarousel() {
    const { assetUrl, partners: sharedPartners } = usePage().props;
    const baseUrl = assetUrl || '';

    const partners = sharedPartners && sharedPartners.length > 0
        ? sharedPartners
        : [];

    if (partners.length === 0) {
        return null;
    }

    const carouselItems = [...partners, ...partners, ...partners];

    return (
        <div className="partner-carousel-container">
            <h3>Our Partners & Facilitators</h3>
            <div className="partner-track-container">
                <div className="partner-track">
                    {carouselItems.map((partner, index) => (
                        <div key={`${partner.name}-${index}`} className="partner-logo-item" title={partner.name}>
                            {partner.link ? (
                                <a href={partner.link} target="_blank" rel="noopener noreferrer" className="d-flex flex-column align-items-center text-decoration-none">
                                    <img
                                        src={`${baseUrl}${partner.logo}`}
                                        alt={partner.name}
                                        className="partner-logo-img"
                                        style={{ height: partner.height }}
                                    />
                                    {partner.disclaimer && (
                                        <span className="partner-disclaimer">{partner.disclaimer}</span>
                                    )}
                              </a>
                            ) : (
                                <>
                                    <img
                                        src={`${baseUrl}${partner.logo}`}
                                        alt={partner.name}
                                        className="partner-logo-img"
                                        style={{ height: partner.height }}
                                    />
                                    {partner.disclaimer && (
                                        <span className="partner-disclaimer">{partner.disclaimer}</span>
                                    )}
                                </>
                            )}
                      </div>
                    ))}
              </div>
          </div>
      </div>
    );
}