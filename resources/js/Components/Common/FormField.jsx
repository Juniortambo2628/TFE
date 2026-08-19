import React from 'react';

/**
 * Reusable form field wrapper with label, input, and error display.
 *
 * @param {string} label - Label text
 * @param {string} [error] - Validation error message
 * @param {string} [type] - Input type (default: "text")
 * @param {string} [className] - Additional CSS classes on the input
 * @param {boolean} [required] - Whether the field is required
 * @param {boolean} [disabled] - Whether the input is disabled
 * @param {string} [placeholder] - Placeholder text
 * @param {*} value - Input value
 * @param {function} onChange - Change handler
 * @param {React.ReactNode} [children] - Custom input element (overrides default <input>)
 * @param {Object} [inputProps] - Additional props spread onto the input
 */
export default function FormField({
    label,
    error,
    type = 'text',
    className = '',
    required = false,
    disabled = false,
    placeholder,
    value,
    onChange,
    children,
    ...inputProps
}) {
    const inputClasses = `form-control pill-input ${error ? 'is-invalid' : ''} ${className}`.trim();

    return (
        <div className="mb-3">
            {label && (
                <label className="form-label text-white-50 small mb-1">
                    {label}
                    {required && <span className="text-danger ms-1">*</span>}
                </label>
            )}
            {children || (
                <input
                    type={type}
                    className={inputClasses}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    {...inputProps}
                />
            )}
            {error && (
                <span className="text-danger small d-block mt-1">{error}</span>
            )}
        </div>
    );
}
