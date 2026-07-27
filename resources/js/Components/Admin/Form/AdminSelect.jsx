import React from 'react';
import SearchableSelect from '@/Components/SearchableSelect';

export default function AdminSelect({ 
    label, 
    value, 
    onChange, 
    options = [], 
    error, 
    required = false, 
    searchable = false,
    placeholder = 'Select option',
    className = '',
    labelKey = 'label',
    valueKey = 'value',
    searchKeys = ['label'],
    ...props 
}) {
    return (
        <div className={`admin-form-group ${className}`}>
            <label className="admin-form-label text-white">
                {label} {required && <span className="text-danger">*</span>}
            </label>
            
            {searchable ? (
                <SearchableSelect
                    options={options}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    labelKey={labelKey}
                    valueKey={valueKey}
                    searchKeys={searchKeys}
                    {...props}
                />
            ) : (
                <select 
                    className={`admin-form-input ${error ? 'is-invalid' : ''}`}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    {...props}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map((opt, index) => {
                        const optVal = typeof opt === 'object' ? opt[valueKey] : opt;
                        const optLabel = typeof opt === 'object' ? opt[labelKey] : opt;
                        return (
                            <option key={index} value={optVal}>
                                {optLabel}
                            </option>
                        );
                    })}
                </select>
            )}
            
            {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
    );
}
