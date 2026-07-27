import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

export default function Stories({ stories }) {
    return (
        <AdminLayout>
            <Head title="Admin - Stories" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Stories Management</h1>
                    {/* Add Data Table or content here */}
                </div>
            </div>
        </AdminLayout>
    );
}
