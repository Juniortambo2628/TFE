import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_TAB_ICON,
    normalizeTabs,
    resolveActiveTab,
    resolvePanelContent,
    slugifyTabId,
    tabForKey,
} from '../../resources/js/lib/modalTabs.js';

/*
 * Guards the pure half of the unified dialog (`Components/Common/TfeModal`).
 *
 * The behaviour worth pinning is that the dialog cannot render an empty pane.
 * It absorbed four modal components with different APIs, so it is handed tab
 * lists in three shapes and those lists change WHILE the dialog is open — the
 * partner listing form adds and removes its "Trip" tab with the listing type.
 * A stale active id must fall back rather than blank the dialog.
 */

test('a dialog with no tabs still gets one, named after itself', () => {
    // Every dialog on the platform shows the rail, so a single-section dialog
    // needs a tab — synthesised from the title so the rail carries the
    // dialog's own name instead of a blank column.
    const [tab] = normalizeTabs(undefined, 'Delete this ad?');

    assert.equal(tab.id, 'default');
    assert.equal(tab.label, 'Delete this ad?');
    assert.equal(tab.icon, DEFAULT_TAB_ICON);
});

test('a dialog with no tabs and no title falls back to a usable label', () => {
    assert.equal(normalizeTabs(undefined, undefined)[0].label, 'Details');
    assert.equal(normalizeTabs([], '')[0].label, 'Details');
});

test('bare strings become tabs with derived ids', () => {
    const tabs = normalizeTabs(['Overview', 'Details & meta']);

    assert.deepEqual(tabs.map((t) => t.id), ['overview', 'details-meta']);
    assert.deepEqual(tabs.map((t) => t.label), ['Overview', 'Details & meta']);
});

test('full tab objects keep their own id, icon and badge', () => {
    const [tab] = normalizeTabs([{ id: 'rsvps', label: 'RSVPs', icon: 'fas fa-users', badge: 12 }]);

    assert.equal(tab.id, 'rsvps');
    assert.equal(tab.icon, 'fas fa-users');
    assert.equal(tab.badge, 12);
    assert.equal(tab.disabled, false);
});

test('a tab without a label is still addressable', () => {
    const tabs = normalizeTabs([{ id: 'x' }, {}]);

    assert.equal(tabs[0].label, 'x');
    assert.equal(tabs[1].label, 'Tab 2');
    assert.notEqual(tabs[0].id, tabs[1].id, 'ids must stay unique');
});

test('nullish entries in the tab list are dropped, not rendered', () => {
    // Call sites build lists with `...(cond ? [tab] : [])` and conditionals,
    // so a false or null can reach here.
    const tabs = normalizeTabs(['One', null, undefined, false, 'Two']);

    assert.deepEqual(tabs.map((t) => t.label), ['One', 'Two']);
});

test('slugifyTabId never returns an empty id', () => {
    assert.equal(slugifyTabId('Billing & Plans', 0), 'billing-plans');
    assert.equal(slugifyTabId('---', 3), 'tab-3');
    assert.equal(slugifyTabId('', 1), 'tab-1');
    assert.equal(slugifyTabId(null, 2), 'tab-2');
});

test('the requested tab wins when it exists', () => {
    const tabs = normalizeTabs(['One', 'Two']);

    assert.equal(resolveActiveTab(tabs, 'two', undefined), 'two');
});

test('a stale requested tab falls back instead of blanking the pane', () => {
    // The partner listing form drops its "Trip" tab when the type changes.
    // Without this the pane would render nothing and look broken.
    const tabs = normalizeTabs(['Details', 'Pricing', 'Media']);

    assert.equal(resolveActiveTab(tabs, 'trip', undefined), 'details');
});

test('the preferred default is used when nothing is requested', () => {
    const tabs = normalizeTabs(['Overview', 'Enquire']);

    assert.equal(resolveActiveTab(tabs, null, 'enquire'), 'enquire');
    // …and is itself ignored when it does not exist.
    assert.equal(resolveActiveTab(tabs, null, 'nope'), 'overview');
});

test('resolution skips disabled tabs', () => {
    const tabs = normalizeTabs([
        { id: 'a', label: 'A', disabled: true },
        { id: 'b', label: 'B' },
    ]);

    assert.equal(resolveActiveTab(tabs, 'a', undefined), 'b', 'a disabled tab must not be selected');
    assert.equal(resolveActiveTab(tabs, null, 'a'), 'b');
});

test('resolution survives an empty list', () => {
    assert.equal(resolveActiveTab([], 'a', 'b'), null);
    assert.equal(resolveActiveTab(null, 'a', 'b'), null);
});

test('arrow keys move through the rail and wrap', () => {
    const tabs = normalizeTabs(['A', 'B', 'C']);

    assert.equal(tabForKey(tabs, 'a', 'ArrowDown'), 'b');
    assert.equal(tabForKey(tabs, 'a', 'ArrowRight'), 'b');
    assert.equal(tabForKey(tabs, 'c', 'ArrowDown'), 'a', 'should wrap forwards');
    assert.equal(tabForKey(tabs, 'a', 'ArrowUp'), 'c', 'should wrap backwards');
    assert.equal(tabForKey(tabs, 'b', 'ArrowLeft'), 'a');
});

test('Home and End jump to the ends', () => {
    const tabs = normalizeTabs(['A', 'B', 'C']);

    assert.equal(tabForKey(tabs, 'b', 'Home'), 'a');
    assert.equal(tabForKey(tabs, 'b', 'End'), 'c');
});

test('keyboard navigation skips disabled tabs', () => {
    const tabs = normalizeTabs([
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B', disabled: true },
        { id: 'c', label: 'C' },
    ]);

    assert.equal(tabForKey(tabs, 'a', 'ArrowDown'), 'c');
    assert.equal(tabForKey(tabs, 'c', 'End'), 'c');
});

test('an unhandled key returns null so the event is left alone', () => {
    const tabs = normalizeTabs(['A', 'B']);

    // Typing in a field inside the rail must not be swallowed.
    assert.equal(tabForKey(tabs, 'a', 'Enter'), null);
    assert.equal(tabForKey(tabs, 'a', 'x'), null);
    assert.equal(tabForKey([], 'a', 'ArrowDown'), null);
});

test('panel content prefers the tab, then a render function, then children', () => {
    const tab = { id: 'a', content: 'from-tab' };

    assert.equal(resolvePanelContent(tab, 'from-children', 'a'), 'from-tab');
    assert.equal(resolvePanelContent({ id: 'a' }, (id) => `rendered-${id}`, 'a'), 'rendered-a');
    assert.equal(resolvePanelContent({ id: 'a' }, 'from-children', 'a'), 'from-children');
});

test('a tab carrying falsy-but-real content still wins over children', () => {
    // 0 and '' are legitimate content; only undefined/null mean "not set".
    assert.equal(resolvePanelContent({ id: 'a', content: 0 }, 'children', 'a'), 0);
    assert.equal(resolvePanelContent({ id: 'a', content: '' }, 'children', 'a'), '');
    assert.equal(resolvePanelContent({ id: 'a', content: null }, 'children', 'a'), 'children');
});
