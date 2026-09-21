import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import ContactSection from '@/Components/Contact';

export default function ContactPage({ hero }) {
    return (
        <SectionPageShell title="Contact" hero={hero}>
            <ContactSection hideHeader />
        </SectionPageShell>
    );
}
