import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import AboutSection from '@/Components/About';

export default function AboutPage() {
    return (
        <SectionPageShell title="About">
            <AboutSection variant="split" />
        </SectionPageShell>
    );
}
