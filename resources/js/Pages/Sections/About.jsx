import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import AboutSection from '@/Components/About';

export default function AboutPage({ hero, cards }) {
    return (
        <SectionPageShell title="About" hero={hero}>
            <AboutSection hideHeader cards={cards} />
        </SectionPageShell>
    );
}
