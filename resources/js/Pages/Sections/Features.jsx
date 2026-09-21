import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import FeaturesSection from '@/Components/Features';

export default function FeaturesPage({ hero }) {
    return (
        <SectionPageShell title="Features" hero={hero}>
            <FeaturesSection variant="split" />
        </SectionPageShell>
    );
}
