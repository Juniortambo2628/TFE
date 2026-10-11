import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ItinerarySummary from '@/Components/Fan/ItinerarySummary';

/**
 * Full-screen, printable itinerary. Not a TfeModal on purpose: it is a page
 * for window.print(), and the dialog chrome (rail, footer) would print too.
 * Portalled to <body> for the same containing-block reason TfeModal is.
 */
export default function ItineraryPrintView({ onClose, ...summary }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    return createPortal(
        <div className="itinerary-print" role="dialog" aria-modal="true" aria-label="Itinerary">
            <div className="itinerary-print__bar">
                <button type="button" className="tfe-btn tfe-btn--sm tfe-btn--filled" onClick={() => window.print()}>
                    <i className="fas fa-print" aria-hidden="true"></i> Print
                </button>
                <button type="button" className="tfe-btn tfe-btn--sm" onClick={onClose} autoFocus>
                    <i className="fas fa-times" aria-hidden="true"></i> Close
                </button>
            </div>
            <div className="itinerary-print__body">
                <ItinerarySummary {...summary} />
            </div>
        </div>,
        document.body,
    );
}
