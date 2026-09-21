import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import FeaturesSection from '@/Components/Features';

export default function FeaturesPage() {
    return (
        <SectionPageShell title="Features">
            <FeaturesSection variant="split" />
        </SectionPageShell>
    );
}
