import React from 'react';

export default function AdminInput({ 
    label, 
    type = 'text', 
    value, 
    onChange, 
    placeholder, 
    error, 
    required = false, 
    className = '',
    ...props 
}) {
    return (
        <div className={`admin-form-group ${className}`}>
            <label className="admin-form-label text-white">
                {label} {required && <span className="text-danger">*</span>}
            </label>
            <input 
                type={type} 
                className={`admin-form-input ${error ? 'is-invalid' : ''}`} 
                value={value} 
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                {...props}
            />
            {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
    );
}
