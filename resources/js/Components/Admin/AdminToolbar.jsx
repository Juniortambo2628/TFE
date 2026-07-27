import React from 'react';

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
    return (
        <div className="admin-toolbar">
            <div className="admin-toolbar-left">
                {/* Search */}
                <div className="admin-search">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                </div>

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
            {showViewToggle && (
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
