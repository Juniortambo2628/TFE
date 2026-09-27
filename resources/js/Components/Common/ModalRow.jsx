import React from 'react';

/**
 * ModalRow — one labelled setting inside a dialog pane.
 *
 * Title and description on the left, the control on the right, separated from
 * its neighbours by a hairline. This is the row shape the unified dialog is
 * built around; reach for it instead of hand-rolling a flex row with a label,
 * so every dialog aligns its controls on the same axis.
 *
 * Wrap groups of rows in `ContentCard` when a pane has more than one group.
 *
 *   <ModalRow title="Private profile" desc="Only you can see your portfolio">
 *     <Toggle … />
 *   </ModalRow>
 *
 * `stacked` drops the control onto its own line beneath the text, for a
 * control that needs the full width (a textarea, an upload, a long select).
 * `htmlFor` makes the title a real <label>, so clicking it focuses the control.
 */
export default function ModalRow({
    title,
    desc,
    htmlFor,
    stacked = false,
    align = 'center',
    className = '',
    children,
}) {
    const TitleTag = htmlFor ? 'label' : 'div';

    return (
        <div
            className={`tfe-modal-row ${stacked ? 'tfe-modal-row--stacked' : ''} ${className}`.trim()}
            data-align={align}
        >
            {(title || desc) && (
                <div className="tfe-modal-row__text">
                    {title && (
                        <TitleTag className="tfe-modal-row__title" htmlFor={htmlFor || undefined}>
                            {title}
                        </TitleTag>
                    )}
                    {desc && <p className="tfe-modal-row__desc">{desc}</p>}
                </div>
            )}

            {children !== undefined && children !== null && (
                <div className="tfe-modal-row__control">{children}</div>
            )}
        </div>
    );
}

/**
 * A read-only value in the same row shape — for detail dialogs, where the
 * right-hand side is a fact rather than a control.
 */
export function ModalFact({ title, desc, value, className = '' }) {
    return (
        <ModalRow title={title} desc={desc} className={className}>
            <span className="tfe-modal-row__value">{value}</span>
        </ModalRow>
    );
}
