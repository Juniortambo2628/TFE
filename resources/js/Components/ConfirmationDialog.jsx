import React from 'react';

import TfeModal from '@/Components/Common/TfeModal';

/**
 * ConfirmationDialog — the standard "are you sure?", replacing window.confirm().
 *
 * A thin wrapper over the unified `TfeModal`, so a confirmation is the same
 * dialog as everything else on the platform. It used to be its own shadcn
 * Dialog with `bg-blue-600` / `bg-red-600` buttons, which is a colourful
 * button variant the design system does not have — category colour belongs on
 * `.tfe-pill`, never on a button. The destructive intent now reads from the
 * dialog's own copy and icon instead.
 *
 * The props are unchanged from the shadcn version on purpose: twenty call
 * sites use this, and none of them needed to move.
 */
export default function ConfirmationDialog({
    open,
    onOpenChange,
    title = 'Are you sure?',
    description,
    onConfirm,
    confirmText = 'Continue',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false,
}) {
    const destructive = variant === 'destructive';
    const close = () => onOpenChange(false);

    return (
        <TfeModal
            open={open}
            onClose={close}
            size="sm"
            label={destructive ? 'Confirm' : 'Confirm action'}
            title={title}
            tabs={[{
                id: 'confirm',
                label: destructive ? 'Confirm' : 'Review',
                icon: destructive ? 'fas fa-triangle-exclamation' : 'fas fa-circle-question',
            }]}
            heading={title}
            // A confirmation must not be dismissable by a stray backdrop click:
            // the whole point is a deliberate answer.
            closeOnBackdrop={false}
            footer={(
                <>
                    <button type="button" className="tfe-btn" onClick={close} disabled={isLoading}>
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="tfe-btn tfe-btn--filled"
                        onClick={onConfirm}
                        disabled={isLoading}
                        data-autofocus
                    >
                        {isLoading ? 'Working…' : confirmText}
                    </button>
                </>
            )}
        >
            {description
                ? <p className="tfe-modal__prose">{description}</p>
                : <p className="tfe-modal__prose">This action cannot be undone.</p>}
        </TfeModal>
    );
}
