import React from 'react';
import { usePage } from '@inertiajs/react';
import BaseLayout from './BaseLayout';

/**
 * AuthenticatedLayout - Legacy Breeze layout, now delegates to BaseLayout.
 * Kept for backward compatibility with Profile pages.
 */
export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    return (
        <BaseLayout
            title="Dashboard"
            user={user}
        >
            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}
            {children}
        </BaseLayout>
    );
}
