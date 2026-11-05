import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeMenuItem, dashboardTabs } from '../../resources/js/lib/dashboardTabs.js';

const MENU = [
    { label: 'Home', icon: 'fas fa-home', route: 'fan.dashboard', path: '/fan/dashboard' },
    { heading: 'Plan & book' },
    { label: 'Plan a Trip', icon: 'fas fa-calculator', route: 'fan.budget-calculator', path: '/fan/budget-calculator' },
    { label: 'Tickets', icon: 'fas fa-ticket-alt', route: 'fan.tickets.index', path: '/fan/tickets' },
    { label: 'My purchases', icon: 'fas fa-receipt', route: 'fan.tickets.purchases', path: '/fan/tickets/purchases' },
];

test('the longest matching menu path is the current item', () => {
    assert.equal(activeMenuItem(MENU, '/fan/tickets/purchases?x=1').route, 'fan.tickets.purchases');
    assert.equal(activeMenuItem(MENU, '/fan/tickets/7').route, 'fan.tickets.index');
    assert.equal(activeMenuItem(MENU, '/fan/ticketsx'), null, 'a shared prefix is not a match');
    assert.equal(activeMenuItem(MENU, '/fan/profile'), null);
});

test('tabs come from the menu, in tab order, with its labels and icons', () => {
    const tabs = dashboardTabs(MENU, ['fan.dashboard', { route: 'fan.budget-calculator', primary: true, label: 'Plan' }, 'fan.tickets.index'], '/fan/tickets');
    assert.deepEqual(tabs.map((t) => t.route), ['fan.dashboard', 'fan.budget-calculator', 'fan.tickets.index']);
    assert.equal(tabs[0].icon, 'fas fa-home');
    assert.equal(tabs[1].label, 'Plan');
    assert.equal(tabs[1].primary, true);
    assert.deepEqual(tabs.map((t) => t.current), [false, false, true]);
});

test('a tab whose route is not in this menu is left out, not rendered dead', () => {
    const tabs = dashboardTabs(MENU, ['fan.dashboard', 'partner.requests'], '/fan/dashboard');
    assert.deepEqual(tabs.map((t) => t.route), ['fan.dashboard']);
});
