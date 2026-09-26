import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import ServicesSection from '@/Components/Services';

export default function ServicesPage({ hero, cards }) {
    return (
        <SectionPageShell title="Services" hero={hero}>
            <ServicesSection hideHeader cards={cards} />
        </SectionPageShell>
    );
}
