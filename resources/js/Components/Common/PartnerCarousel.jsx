import React from 'react';
import { usePage } from '@inertiajs/react';
import '../../../css/partner-carousel.css';

export default function PartnerCarousel() {
    // Get assetUrl from page props to ensure correct paths
    const { assetUrl } = usePage().props;
    const baseUrl = assetUrl || '';

    // Define partners
    const partners = [
        {
            name: 'Terik Tours',
            logo: 'assets/partner-logos/terik-tours-logo-yellow-bg.png',
            height: '60px',
            link: 'https://teriktours.com/'
        },
        {
            name: 'OKJ Technologies',
            logo: 'assets/partner-logos/OKJTechLogo-White_Transparent.png',
            height: '50px',
            link: 'https://okjtech.co.ke'
        },
        {
            name: 'The Football Experience',
            logo: 'assets/img/logo/TFE-logo.png',
            height: '60px',
            link: '/'
        },
        {
            name: 'FIFA World Cup 2026',
            logo: 'assets/partner-logos/fifa-world-cup-2026-logo-alt.png',
            height: '70px',
            disclaimer: 'We are facilitating travel to this tournament. Not officially affiliated with FIFA.',
            link: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026'
        }
    ];

    // Double the array to create seamless loop
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
