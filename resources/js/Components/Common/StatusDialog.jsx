import React from 'react';

import TfeModal from '@/Components/Common/TfeModal';

/**
 * StatusDialog — the shared success / error acknowledgement.
 *
 * On the unified `TfeModal` like every other dialog. It was previously its own
 * shadcn Dialog with a hand-rolled 96px status disc and a `bg-red-600` button;
 * the disc survives as `.tfe-modal__status`, the button is now `.tfe-btn`.
 *
 * Props unchanged from the previous version.
 */
export default function StatusDialog({
    open,
    onOpenChange,
    type = 'success',
    title,
    message,
    buttonText = 'Great, Thanks!',
    onButtonClick,
}) {
    const isSuccess = type === 'success';

    const dismiss = () => {
        if (onButtonClick) onButtonClick();
        onOpenChange(false);
    };

    const resolvedTitle = title || (isSuccess ? 'Everything set' : 'Something went wrong');

    return (
        <TfeModal
            open={open}
            onClose={() => onOpenChange(false)}
            size="sm"
            label={isSuccess ? 'Success' : 'Error'}
            title={resolvedTitle}
            tabs={[{
                id: 'status',
                label: isSuccess ? 'Success' : 'Error',
                icon: isSuccess ? 'fas fa-circle-check' : 'fas fa-circle-exclamation',
            }]}
            heading={resolvedTitle}
            footer={(
                <button type="button" className="tfe-btn tfe-btn--filled" onClick={dismiss} data-autofocus>
                    {buttonText || (isSuccess ? 'Great, Thanks!' : 'Try Again')}
                </button>
            )}
        >
            <div className="tfe-modal__status" data-state={isSuccess ? 'success' : 'error'}>
                <span className="tfe-modal__status-disc" aria-hidden="true">
                    <i className={`fas ${isSuccess ? 'fa-check' : 'fa-exclamation'}`} />
                </span>
                {message && <p className="tfe-modal__prose">{message}</p>}
            </div>
        </TfeModal>
    );
}
