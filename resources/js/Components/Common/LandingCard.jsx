import React from 'react';
import { usePage } from '@inertiajs/react';
import '../../../css/landing-section.css';

/**
 * LandingCard — Individual image card for landing page horizontal scroll sections.
 *
 * Props:
 *  - image (string, required): image path relative to assetUrl
 *  - title (string, required): card title (rendered uppercase)
 *  - subtitle (string): optional description shown below the title
 *  - tags (string[]): optional badge tags
 *  - alt (string): image alt text (defaults to title)
 *  - onClick (function): called when card is clicked — typically opens LandingModal
 *  - modalData (object): optional object passed to onClick as argument. If provided,
 *      the card will pass { ...modalData, image, title, subtitle, tags } on click.
 *      Convenient for "click → open modal" pattern.
 */
export default function LandingCard(props) {
    var image = props.image;
    var title = props.title;
    var subtitle = props.subtitle;
    var tags = props.tags;
    var alt = props.alt;
    var onClick = props.onClick;
    var modalData = props.modalData;

    var pageData = usePage().props;
    var assetUrl = pageData.assetUrl;
    var baseUrl = assetUrl || '';
    var src = image.startsWith('http') || image.startsWith('/') ? image : baseUrl + image;

    var handleClick = function () {
        if (onClick) {
            var data = modalData
                ? Object.assign({}, modalData, { image: image, title: title, subtitle: subtitle, tags: tags })
                : { image: image, title: title, subtitle: subtitle, tags: tags };
            onClick(data);
        }
    };

    return (
        React.createElement('article', {
            className: 'landing-card',
            onClick: handleClick,
            role: onClick ? 'button' : undefined,
            tabIndex: onClick ? 0 : undefined,
            onKeyDown: onClick ? function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined,
        },
            React.createElement('img', {
                src: src,
                alt: alt || title,
                className: 'landing-card-image',
                loading: 'lazy',
            }),
            React.createElement('div', { className: 'landing-card-overlay' },
                tags && tags.length > 0 && React.createElement('div', { className: 'landing-card-tags' },
                    tags.map(function (tag) {
                        return React.createElement('span', { key: tag, className: 'landing-card-tag' }, tag);
                    })
                ),
                React.createElement('h3', { className: 'landing-card-title' }, title),
                subtitle && React.createElement('p', { className: 'landing-card-subtitle' }, subtitle),
                onClick && React.createElement('div', { className: 'landing-card-cta' },
                    React.createElement('span', null, 'Learn More'),
                    React.createElement('iconify-icon', { icon: 'lucide:arrow-up-right' })
                )
            )
        )
    );
}
