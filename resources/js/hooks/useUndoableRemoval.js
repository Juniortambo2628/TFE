import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { scheduleUndoable, UNDO_WINDOW_MS } from '@/lib/undo';

/**
 * Remove-with-Undo for a list rendered from Inertia props (Sprint 69).
 *
 *   const { isHidden, remove } = useUndoableRemoval();
 *   remove(id, { message: 'Goal deleted', url: route('…destroy', id) });
 *   items.filter((i) => !isHidden(i.id))
 *
 * Only for actions that are safe to take back: the fan's own content, an
 * RSVP. Anything that notifies someone else, moves money or cannot be
 * re-requested keeps its ConfirmationDialog.
 */
export default function useUndoableRemoval() {
    const [hidden, setHidden] = useState(() => new Set());
    const pending = useRef(new Map());

    const unhide = useCallback((id) => {
        setHidden((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }, []);

    // Leaving the page commits what is pending rather than dropping it: the
    // fan already saw it go, and an Inertia visit is not closing the tab.
    useEffect(() => () => { pending.current.forEach((job) => job.flush()); }, []);

    const remove = useCallback((id, { message, url, method = 'delete', errorMessage }) => {
        setHidden((prev) => new Set(prev).add(id));

        const job = scheduleUndoable({
            commit: () => {
                pending.current.delete(id);
                router.visit(url, {
                    method,
                    preserveScroll: true,
                    preserveState: true,
                    onError: () => {
                        unhide(id);
                        toast.error(errorMessage || "That didn't go through — it's back.");
                    },
                });
            },
        });
        pending.current.set(id, job);

        toast(message, {
            duration: UNDO_WINDOW_MS,
            action: {
                label: 'Undo',
                onClick: () => {
                    if (job.undo()) {
                        pending.current.delete(id);
                        unhide(id);
                    }
                },
            },
        });
    }, [unhide]);

    return { isHidden: (id) => hidden.has(id), remove };
}
