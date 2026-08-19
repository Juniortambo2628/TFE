import React, { useEffect } from 'react';

/**
 * Generic modal component with overlay, close button, and body scroll lock.
 *
 * @param {boolean} open - Whether the modal is visible
 * @param {function} onClose - Called when the user clicks the overlay or close button
 * @param {string} [title] - Optional heading inside the modal
 * @param {string} [size] - "sm" | "md" | "lg" | "xl" (default: "md")
 * @param {boolean} [closeOnOverlay=true] - Whether clicking the overlay closes the modal
 * @param {React.ReactNode} children - Modal body content
 */
export default function Modal({
    open,
    onClose,
    title,
    size = 'md',
    closeOnOverlay = true,
    children,
}) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, [open]);

    if (!open) return null;

    const sizeClass = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }[size] || 'max-w-lg';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
        >
            <div
                className={`relative w-full ${sizeClass} mx-4 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {(title || onClose) && (
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="ml-auto text-white/50 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <i className="fas fa-times text-lg"></i>
                            </button>
                        )}
                    </div>
                )}
                <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
