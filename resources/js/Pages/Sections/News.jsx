import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import NewsSection from '@/Components/News';

export default function NewsPage({ hero }) {
    return (
        <SectionPageShell title="News" hero={hero}>
            <NewsSection variant="split" />
        </SectionPageShell>
    );
}
