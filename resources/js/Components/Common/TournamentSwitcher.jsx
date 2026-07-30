import React, { useState } from 'react';
import { useTournament } from '@/Context/TournamentContext';

/**
 * TournamentSwitcher — Dropdown shown in the landing page header that lets
 * visitors switch between configured tournaments (e.g. WC 2026, AFCON 2027).
 *
 * Reads from the shared tournament context. Clicking an item reloads the
 * page with ?tournament=<id> — the ResolveTournament middleware picks it up.
 */
export default function TournamentSwitcher() {
    var ctx = useTournament();
    var tournament = ctx.tournament;
    var tournamentList = ctx.tournamentList;
    var switchTournament = ctx.switchTournament;
    var isActive = ctx.isActive;

    var openState = useState(false);
    var isOpen = openState[0];
    var setIsOpen = openState[1];

    if (!tournamentList || tournamentList.length === 0) {
        return null;
    }

    return React.createElement('div', { className: 'tournament-switcher' },
        React.createElement('button', {
            className: 'tournament-switcher-trigger',
            onClick: function () { setIsOpen(!isOpen); },
            'aria-expanded': isOpen,
            'aria-haspopup': 'true',
            type: 'button',
        },
            React.createElement('span', { className: 'tournament-switcher-icon' },
                React.createElement('iconify-icon', { icon: 'lucide:trophy' })
            ),
            React.createElement('span', { className: 'tournament-switcher-label' }, tournament ? tournament.short_name : 'Tournament'),
            React.createElement('span', { className: 'tournament-switcher-status status-' + (tournament ? tournament.status : 'upcoming') },
                tournament ? tournament.status : ''
            ),
            React.createElement('iconify-icon', { icon: 'lucide:chevron-down', className: 'tournament-switcher-chevron' })
        ),
        isOpen && React.createElement('ul', { className: 'tournament-switcher-menu', role: 'menu' },
            tournamentList.map(function (item) {
                return React.createElement('li', { key: item.id, role: 'none' },
                    React.createElement('button', {
                        className: 'tournament-switcher-item' + (isActive(item.id) ? ' active' : ''),
                        onClick: function () {
                            setIsOpen(false);
                            switchTournament(item.slug);
                        },
                        role: 'menuitem',
                        type: 'button',
                    },
                        React.createElement('div', { className: 'tournament-switcher-item-name' },
                            React.createElement('strong', null, item.name),
                            React.createElement('small', null,
                                item.hosts && item.hosts.length > 0 ? 'Hosted by ' + item.hosts.join(', ') : ''
                            )
                        ),
                        React.createElement('span', { className: 'tournament-switcher-item-status status-' + item.status }, item.status)
                    )
                );
            })
        )
    );
}
