import React from 'react';
import KitShell from './KitShell';
import { INSTITUTION_MENU, INSTITUTION_TABS } from '@/Components/Institution/Sidebar';

const BADGE = { icon: 'fas fa-school', label: 'Institution' };

/**
 * An institution's dashboard on the OKJT kit's shell (phase 4, the first
 * role moved). It wraps the institution's own pages AND the fan pages it
 * plans trips on, so the shell stays mounted between them (FanShell).
 */
export default function InstitutionKitShell({ children }) {
    return (
        <KitShell role="institution" menu={INSTITUTION_MENU} tabs={INSTITUTION_TABS} homeRoute="institution.dashboard" badge={BADGE}>
            {children}
        </KitShell>
    );
}
