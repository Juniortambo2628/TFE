import React, { createContext, useContext, useState } from 'react';

const AdminThemeContext = createContext();

export function AdminThemeProvider({ children }) {
    const [editMode, setEditMode] = useState(false);

    const toggleEditMode = () => setEditMode(prev => !prev);

    return (
        <AdminThemeContext.Provider value={{ editMode, toggleEditMode }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

export function useAdminTheme() {
    const context = useContext(AdminThemeContext);
    if (!context) {
        throw new Error('useAdminTheme must be used within an AdminThemeProvider');
    }
    return context;
}
