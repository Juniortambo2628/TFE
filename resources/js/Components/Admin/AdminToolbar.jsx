import React from 'react';
import { useToolbarSlot } from '@/Layouts/DashboardV2';

/**
 * Admin Toolbar Component
 * Search, Sort, and Grid/List view toggle
 */
export default function AdminToolbar({
    search = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    sortOptions = [],
    sortValue = '',
    onSortChange,
    viewMode = 'list',
    onViewChange,
    showViewToggle = true,
    showSort = true,
    children // For additional toolbar items
}) {
    // In the v2 dashboard, search and the grid/list switch move into the
    // page toolbar (Naoa's floating toolbar); sort and any extras stay here.
    const searchInToolbar = useToolbarSlot('search', onSearchChange ? {
        value: search,
        placeholder: searchPlaceholder,
        onChange: (v) => onSearchChange(v),
    } : null);
    const viewInToolbar = useToolbarSlot('views', showViewToggle && onViewChange ? {
        value: viewMode,
        options: [
            { value: 'grid', label: 'Grid', icon: 'fas fa-table-cells-large' },
            { value: 'list', label: 'List', icon: 'fas fa-list' },
        ],
        onChange: (v) => onViewChange(v),
    } : null);
    const hasSort = showSort && sortOptions.length > 0;
    if (searchInToolbar && (viewInToolbar || !showViewToggle) && !hasSort && !children) return null;

    return (
        <div className="admin-toolbar">
            <div className="admin-toolbar-left">
                {/* Search */}
                {!searchInToolbar && <div className="admin-search">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                </div>}

                {/* Sort Dropdown */}
                {showSort && sortOptions.length > 0 && (
                    <div className="admin-sort">
                        <select 
                            value={sortValue} 
                            onChange={(e) => onSortChange?.(e.target.value)}
                        >
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {children}
            </div>

            {/* View Toggle */}
            {showViewToggle && !viewInToolbar && (
                <div className="admin-toolbar-right">
                    <div className="admin-view-toggle">
                        <button
                            type="button"
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => onViewChange?.('grid')}
                            title="Grid View"
                        >
                            <i className="fas fa-th-large"></i>
                        </button>
                        <button
                            type="button"
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => onViewChange?.('list')}
                            title="List View"
                        >
                            <i className="fas fa-list"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
