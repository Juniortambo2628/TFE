import React, { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import '../../../css/landing-section.css';

export default function LandingModal(props) {
    var open = props.open;
    var onClose = props.onClose;
    var data = props.data;
    var pageData = usePage().props;
    var assetUrl = pageData.assetUrl;
    var baseUrl = assetUrl || '';

    React.useEffect(function () {
        if (open) { document.body.style.overflow = 'hidden'; }
        else { document.body.style.overflow = ''; }
    }, [open]);

    if (!open || !data) return null;

    var imgSrc = null;
    if (data.image) {
        if (data.image.startsWith('http') || data.image.startsWith('/')) { imgSrc = data.image; }
        else { imgSrc = baseUrl + data.image; }
    }

    return (
        React.createElement('div', { className: 'landing-modal-overlay', onClick: onClose, role: 'dialog', 'aria-modal': 'true' },
            React.createElement('div', { className: 'landing-modal', onClick: function (e) { e.stopPropagation(); } },
                React.createElement('button', { className: 'landing-modal-close', onClick: onClose, 'aria-label': 'Close' },
                    React.createElement('i', { className: 'fas fa-times' })
                ),
                imgSrc && React.createElement('img', { src: imgSrc, alt: (data.title) || '', className: 'landing-modal-image' })
            ),
            React.createElement('div', { className: 'landing-modal-body' },
                data.title && React.createElement('h2', { className: 'landing-modal-title' }, data.title),
                data.description && React.createElement('p', { className: 'landing-modal-description' }, data.description),
                data.cta && React.createElement('a', { href: data.cta.href, className: 'landing-modal-cta', onClick: function (e) { e.stopPropagation(); } },
                    React.createElement('span', null, data.cta.label),
                    React.createElement('iconify-icon', { icon: 'lucide:arrow-up-right' })
                )
            )
        )
    );
}