import React from 'react';
import SectionPageShell from '@/Components/Landing/SectionPageShell';
import NewsSection from '@/Components/News';

export default function NewsPage() {
    return (
        <SectionPageShell title="News">
            <NewsSection variant="split" />
        </SectionPageShell>
    );
}
