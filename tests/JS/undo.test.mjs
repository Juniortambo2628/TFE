import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleUndoable } from '../../resources/js/lib/undo.js';

function fakeTimers() {
    const q = new Map(); let n = 0;
    return {
        setTimeout: (fn) => { q.set(++n, fn); return n; },
        clearTimeout: (h) => q.delete(h),
        run: () => { for (const [h, fn] of [...q]) { q.delete(h); fn(); } },
    };
}

test('nothing is sent until the window closes', () => {
    const t = fakeTimers(); let sent = 0;
    const job = scheduleUndoable({ commit: () => sent++, timers: t });
    assert.equal(sent, 0);
    t.run();
    assert.equal(sent, 1);
    assert.equal(job.state, 'committed');
});

test('undo inside the window means it is never sent', () => {
    const t = fakeTimers(); let sent = 0;
    const job = scheduleUndoable({ commit: () => sent++, timers: t });
    assert.equal(job.undo(), true);
    t.run();
    assert.equal(sent, 0);
});

test('undo after commit is refused', () => {
    const t = fakeTimers();
    const job = scheduleUndoable({ commit: () => {}, timers: t });
    t.run();
    assert.equal(job.undo(), false);
});

test('flush commits once, immediately', () => {
    const t = fakeTimers(); let sent = 0;
    const job = scheduleUndoable({ commit: () => sent++, timers: t });
    job.flush(); job.flush(); t.run();
    assert.equal(sent, 1);
});
