import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import AboutSection from '@/Components/About';

export default function AboutPage({ hero }) {
    return (
        <SectionPageShell title="About" hero={hero}>
            <AboutSection variant="split" />
        </SectionPageShell>
    );
}
