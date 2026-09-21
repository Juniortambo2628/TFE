import { usePage } from '@inertiajs/react';
import AccentCard from '@/Components/Common/AccentCard';

/**
 * LandingCard — a horizontal-scroll section card (Popular Experiences,
 * News). Now a thin wrapper over the shared AccentCard in cover mode, so
 * the section cards match the tournament cards while keeping their photo
 * backgrounds and the click-to-open dialog.
 *
 * Props: image, title, subtitle, tags[], alt, onClick(data), modalData.
 */
export default function LandingCard({ image, title, subtitle, tags, alt, onClick, modalData }) {
    const { assetUrl } = usePage().props;
    const baseUrl = assetUrl || '';
    const src = image.startsWith('http') || image.startsWith('/') ? image : baseUrl + image;

    const handleClick = () => {
        if (!onClick) return;
        const data = modalData
            ? { ...modalData, image, title, subtitle, tags }
            : { image, title, subtitle, tags };
        onClick(data);
    };

    return (
        <AccentCard
            LinkComponent="div"
            className="tfe-acard--landing"
            cover={src}
            pills={tags}
            title={title}
            desc={subtitle}
            cta={onClick ? { label: 'Learn More', icon: 'fas fa-arrow-up-right' } : undefined}
            cornerButton={onClick ? { icon: 'fas fa-plus', label: `More about ${title}`, onClick: handleClick } : undefined}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick ? handleClick : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
            aria-label={alt || title}
        />
    );
}
