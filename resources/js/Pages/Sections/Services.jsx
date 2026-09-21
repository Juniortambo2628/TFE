import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import ServicesSection from '@/Components/Services';

export default function ServicesPage() {
    return (
        <SectionPageShell title="Services">
            <ServicesSection variant="split" />
        </SectionPageShell>
    );
}
