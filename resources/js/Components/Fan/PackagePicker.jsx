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

            {/* A grid sized by the panel, not the window: Bootstrap's col-lg-4
                gave three 170px columns inside the calculator's narrow pane. */}
            <div className="package-picker__grid">
                {/* Custom-build card is always first — the default path. */}
                <button
                    type="button"
                    className="package-picker__card package-picker__card--custom"
                    onClick={onBuildCustom}
                >
                    <span className="package-picker__custom-icon" aria-hidden="true">
                        <i className="fas fa-magic-wand-sparkles"></i>
                    </span>
                    <h4 className="package-picker__name">Build a custom itinerary</h4>
                    <p className="package-picker__desc">
                        Pick your own matches, nights, class and accommodation. We total the cost as you go.
                    </p>
                    <span className="package-picker__custom-go">
                        Start blank <i className="fas fa-arrow-right" aria-hidden="true"></i>
                    </span>
                </button>

                {hasPackages && packages.map((pkg) => {
                    const soldOut = pkg.is_sold_out;
                    return (
                        /* A container, not a <button>: it holds the Details link
                           and the partner badge, and a link inside a button is
                           invisible to a screen reader (axe nested-interactive).
                           "Use this package" stretches over the card instead. */
                        <article
                            key={pkg.id}
                            className={`package-picker__card${soldOut ? ' is-sold-out' : ''}`}
                        >
                            {pkg.hero_image && (
                                <img src={assetPath(pkg.hero_image)} alt="" className="package-picker__img" loading="lazy" />
                            )}
                            <div className="package-picker__body">
                                <div className="package-picker__top">
                                    <h4 className="package-picker__name">{pkg.name}</h4>
                                    {pkg.is_featured && <span className="tfe-pill tfe-pill--pending">Featured</span>}
                                </div>
                                {/* Name over price (UX plan, Nov 2026). */}
                                <p className="package-picker__price">
                                    <strong>{formatMoney(pkg.base_price, pkg.currency || 'USD')}</strong>
                                    <span> · {pkg.nights} nights</span>
                                </p>
                                {pkg.description && (
                                    <p className="package-picker__desc">{pkg.description}</p>
                                )}
                                <div className="package-picker__chips">
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

                                <div className="package-picker__foot">
                                    <button
                                        type="button"
                                        disabled={soldOut}
                                        onClick={() => onPickPackage(pkg)}
                                        className="package-picker__pick"
                                        aria-label={soldOut ? `${pkg.name} is sold out` : `Use the ${pkg.name} package`}
                                    >
                                        {soldOut ? 'Sold out' : 'Use this package'}
                                        {!soldOut && <i className="fas fa-arrow-right" aria-hidden="true"></i>}
                                    </button>
                                    <Link
                                        href={route('fan.packages.show', pkg.id)}
                                        className="package-picker__over package-picker__details"
                                    >
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
