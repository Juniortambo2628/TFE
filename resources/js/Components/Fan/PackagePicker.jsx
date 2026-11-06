import React from 'react';
import { Link } from '@inertiajs/react';
import { assetPath } from '@/lib/assets';
import CapacityBar from '@/Components/Common/CapacityBar';
import PoweredByBadge from '@/Components/Common/PoweredByBadge';
import { formatMoney, titleCase } from '@/lib/utils';

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
                            {/* A container, not a <button>: it holds the Details link
                                and the partner badge, and a link inside a button is
                                invisible to a screen reader (axe nested-interactive).
                                "Use this package" stretches over the card instead. */}
                            <article
                                className="w-100 text-start fan-card-premium h-100 border-0 package-picker__card"
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
                                        src={assetPath(pkg.hero_image)}
                                        alt={pkg.name}
                                        className="w-100"
                                        style={{ height: 130, objectFit: 'cover' }}
                                    />
                                )}
                                <div className="p-4">
                                    {/* Name over price (UX plan, Nov 2026): side by side,
                                        a long name wrapped into four narrow lines. */}
                                    <h4 className="package-picker__name">{pkg.name}</h4>
                                    <p className="package-picker__price">
                                        <strong>{formatMoney(pkg.base_price, pkg.currency || 'USD')}</strong>
                                        <span> · {pkg.nights} nights</span>
                                    </p>
                                    {pkg.description && (
                                        <p className="package-picker__desc">{pkg.description}</p>
                                    )}
                                    <div className="d-flex flex-wrap gap-1 mb-3">
                                        <span className="tfe-pill tfe-pill--info">
                                            {pkg.included_match_ids.length} match{pkg.included_match_ids.length === 1 ? '' : 'es'}
                                        </span>
                                        <span className="tfe-pill">{titleCase(pkg.flight_class)}</span>
                                        <span className="tfe-pill">{titleCase(pkg.accommodation_level.replace(/_/g, ' '))}</span>
                                    </div>

                                    <CapacityBar
                                        sold={pkg.sold_count}
                                        capacity={pkg.capacity}
                                        pct={pkg.availability_pct}
                                        className="mb-3"
                                    />

                                    {pkg.publisher && (
                                        <div className="mb-3 package-picker__over">
                                            <PoweredByBadge publisher={pkg.publisher} variant="chip" />
                                        </div>
                                    )}

                                    <div className="d-flex align-items-center justify-content-between gap-2">
                                        <button
                                            type="button"
                                            disabled={soldOut}
                                            onClick={() => onPickPackage(pkg)}
                                            className={`package-picker__pick fw-semibold ${soldOut ? 'text-white-50' : ''}`}
                                            aria-label={soldOut ? `${pkg.name} is sold out` : `Use the ${pkg.name} package`}
                                        >
                                            {soldOut ? 'Sold out' : 'Use this package'}
                                            {!soldOut && <i className="fas fa-arrow-right ms-2" aria-hidden="true"></i>}
                                        </button>
                                        <Link
                                            href={route('fan.packages.show', pkg.id)}
                                            className="package-picker__over text-info small text-decoration-none"
                                        >
                                            Details
                                            <i className="fas fa-external-link-alt ms-1" style={{ fontSize: '0.6rem' }}></i>
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
