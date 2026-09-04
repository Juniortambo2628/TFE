import React from 'react';
import { Link } from '@inertiajs/react';
import CapacityBar from '@/Components/Common/CapacityBar';

/**
 * PackagePicker — Step-0 chooser in the BudgetCalculator wizard.
 *
 * Renders the prepacked packages for the active tournament and a
 * "Build custom" card. Selecting a package calls onPickPackage(pkg);
 * "Build custom" calls onBuildCustom(). Nothing is submitted here —
 * parent controls wizard state.
 */
export default function PackagePicker({ packages = [], onPickPackage, onBuildCustom }) {
    const hasPackages = packages && packages.length > 0;

    return (
        <div className="package-picker">
            <div className="d-flex align-items-baseline justify-content-between mb-3">
                <h3 className="text-white mb-0">Choose a starting point</h3>
                <span className="text-white-50 small">
                    {hasPackages ? `${packages.length} package${packages.length === 1 ? '' : 's'} available` : 'Build your own from scratch'}
                </span>
            </div>

            <div className="row g-3">
                {/* Custom-build card is always first — the default path. */}
                <div className="col-md-6 col-lg-4">
                    <button
                        type="button"
                        className="w-100 text-start fan-card-premium h-100 border-0"
                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(0,210,255,0.10))', cursor: 'pointer' }}
                        onClick={onBuildCustom}
                    >
                        <div className="p-4">
                            <div className="mb-3" style={{ fontSize: 28, color: 'var(--fan-cyan)' }}>
                                <i className="fas fa-magic-wand-sparkles"></i>
                            </div>
                            <h4 className="text-white mb-2">Build a custom itinerary</h4>
                            <p className="text-white-50 small mb-3">
                                Pick your own matches, nights, class and accommodation. We total the cost as you go.
                            </p>
                            <div className="d-flex align-items-center gap-2 text-info">
                                <span className="fw-semibold">Start blank</span>
                                <i className="fas fa-arrow-right"></i>
                            </div>
                        </div>
                    </button>
                </div>

                {hasPackages && packages.map((pkg) => {
                    const soldOut = pkg.is_sold_out;
                    return (
                        <div key={pkg.id} className="col-md-6 col-lg-4">
                            <button
                                type="button"
                                disabled={soldOut}
                                onClick={() => onPickPackage(pkg)}
                                className="w-100 text-start fan-card-premium h-100 border-0"
                                style={{
                                    background: 'rgba(20,20,20,0.6)',
                                    cursor: soldOut ? 'not-allowed' : 'pointer',
                                    opacity: soldOut ? 0.55 : 1,
                                    overflow: 'hidden',
                                    position: 'relative',
                                }}
                            >
                                {pkg.is_featured && (
                                    <div
                                        style={{
                                            position: 'absolute', top: 12, right: 12, zIndex: 2,
                                            background: 'linear-gradient(135deg, #f59e0b, #dc143c)',
                                            color: '#fff', fontSize: 11, fontWeight: 700,
                                            padding: '4px 10px', borderRadius: 999,
                                        }}
                                    >
                                        Featured
                                    </div>
                                )}
                                {pkg.hero_image && (
                                    <img
                                        src={pkg.hero_image}
                                        alt={pkg.name}
                                        className="w-100"
                                        style={{ height: 130, objectFit: 'cover' }}
                                    />
                                )}
                                <div className="p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h4 className="text-white mb-0" style={{ fontSize: '1.1rem' }}>{pkg.name}</h4>
                                        <div className="text-end">
                                            <div className="text-white fw-bold">{pkg.currency} {Number(pkg.base_price).toLocaleString()}</div>
                                            <div className="text-white-50 small">{pkg.nights} nights</div>
                                        </div>
                                    </div>
                                    {pkg.description && (
                                        <p className="text-white-50 small mb-3" style={{ minHeight: 44 }}>
                                            {pkg.description.length > 100 ? pkg.description.slice(0, 100) + '…' : pkg.description}
                                        </p>
                                    )}
                                    <div className="d-flex flex-wrap gap-1 mb-3">
                                        <span className="badge bg-primary bg-opacity-25 text-info">
                                            {pkg.included_match_ids.length} match{pkg.included_match_ids.length === 1 ? '' : 'es'}
                                        </span>
                                        <span className="badge bg-dark text-white-50 text-capitalize">
                                            {pkg.flight_class}
                                        </span>
                                        <span className="badge bg-dark text-white-50">
                                            {pkg.accommodation_level.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <CapacityBar
                                        sold={pkg.sold_count}
                                        capacity={pkg.capacity}
                                        pct={pkg.availability_pct}
                                        className="mb-3"
                                    />

                                    <div className="d-flex align-items-center justify-content-between gap-2">
                                        <span className={`fw-semibold ${soldOut ? 'text-white-50' : 'text-danger'}`}>
                                            {soldOut ? 'Sold out' : 'Use this package'}
                                            {!soldOut && <i className="fas fa-arrow-right ms-2"></i>}
                                        </span>
                                        {/* Detail-page link. stopPropagation so it doesn't
                                            trigger the parent "pick package" onClick. */}
                                        <Link
                                            href={route('fan.packages.show', pkg.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-info small text-decoration-none"
                                        >
                                            Details
                                            <i className="fas fa-external-link-alt ms-1" style={{ fontSize: '0.6rem' }}></i>
                                        </Link>
                                    </div>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
