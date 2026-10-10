import AccentCard from '@/Components/Common/AccentCard';
import { assetPath } from '@/lib/assets';

/**
 * LandingCard — a horizontal-scroll section card (Popular Experiences,
 * News). Now a thin wrapper over the shared AccentCard in cover mode, so
 * the section cards match the tournament cards while keeping their photo
 * backgrounds and the click-to-open dialog.
 *
 * Props: image, title, subtitle, tags[], alt, onClick(data), modalData.
 */
export default function LandingCard({ image, title, subtitle, tags, alt, onClick, modalData }) {
    const src = assetPath(image);

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
            // The whole card stays clickable for the mouse, but it is NOT a
            // second button: the labelled "+" corner button is the one control
            // keyboards and screen readers meet. A role="button" card holding a
            // <button> is nested-interactive, which assistive tech cannot
            // operate reliably (Sprint 66 a11y pass).
            onClick={onClick ? handleClick : undefined}
            aria-label={alt || title}
        />
    );
}
