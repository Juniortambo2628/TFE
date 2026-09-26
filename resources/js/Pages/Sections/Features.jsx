import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import FeaturesSection from '@/Components/Features';

export default function FeaturesPage({ hero, cards }) {
    return (
        <SectionPageShell title="Features" hero={hero}>
            <FeaturesSection hideHeader cards={cards} />
        </SectionPageShell>
    );
}
