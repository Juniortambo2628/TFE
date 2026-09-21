import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import ServicesSection from '@/Components/Services';

export default function ServicesPage({ hero }) {
    return (
        <SectionPageShell title="Services" hero={hero}>
            <ServicesSection variant="split" />
        </SectionPageShell>
    );
}
