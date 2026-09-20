import { useState } from 'react';

/*
 * PasswordField — a glass `.tfe-input` password box with a show/hide
 * toggle. Shared across the auth pages so the reveal affordance and
 * styling stay identical everywhere.
 */
export default function PasswordField({ id, value, onChange, autoComplete = 'current-password', placeholder, required, autoFocus }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="tfe-auth__password">
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                name={id}
                value={value}
                className="tfe-input"
                autoComplete={autoComplete}
                placeholder={placeholder}
                required={required}
                autoFocus={autoFocus}
                onChange={onChange}
            />
            <button
                type="button"
                className="tfe-auth__eye"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                tabIndex={-1}
            >
                <i className={visible ? 'fas fa-eye-slash' : 'fas fa-eye'} aria-hidden="true"></i>
            </button>
        </div>
    );
}
