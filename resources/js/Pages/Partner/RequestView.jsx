import React, { useState, useRef } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { useForm, Link, router } from '@inertiajs/react';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';
import LoanReviewPanel from '@/Components/Partner/LoanReviewPanel';

/**
 * Partner request review — adjust a fan's travel package and approve / modify /
 * reject the quote. Rebuilt on the shared primitives (`DashboardHero` /
 * `tfe-slab` / `tfe-table` / `tfe-pill` / `tfe-btn`) so it matches the Profile
 * and the rest of the partner surfaces, instead of the bespoke
 * `partner-hero-dynamic` / `partner-content-card` / `partner-btn-*` chrome.
 */
const STATUS_PILL = {
    approved: 'tfe-pill--approved',
    modified: 'tfe-pill--pending',
    rejected: 'tfe-pill--rejected',
    pending: 'tfe-pill--info',
};

export default function RequestView({ budget, variant = 'travel', loan = null }) {
    // Sprint 14 — finance-partner variant renders a completely different
    // panel (approve/reject/disburse a loan), reusing PartnerLayout so
    // header/sidebar stay consistent.
    if (variant === 'finance' && loan) {
        return (
            <PartnerLayout title="Loan application">
                <LoanReviewPanel loan={loan} />
            </PartnerLayout>
        );
    }

    const fileInputRef = useRef(null);
    const [attachedFile, setAttachedFile] = useState(null);

    const initialBreakdown = budget.partner_breakdown || budget.original_breakdown || {};
    const breakdownArray = Object.entries(initialBreakdown).map(([category, cost]) => ({
        category,
        cost: parseFloat(cost) || 0,
    }));

    const { data, setData, processing } = useForm({
        partner_cost: budget.partner_cost || budget.original_cost,
        partner_breakdown: initialBreakdown,
        partner_notes: budget.partner_notes || '',
        status: budget.partner_status || 'pending',
        document: null,
    });

    const [breakdown, setBreakdown] = useState(breakdownArray);

    const calculateTotal = (items) => items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);

    const updateBreakdownItem = (index, newCost) => {
        const updatedBreakdown = [...breakdown];
        updatedBreakdown[index].cost = parseFloat(newCost) || 0;
        setBreakdown(updatedBreakdown);

        const breakdownObj = {};
        updatedBreakdown.forEach((item) => {
            breakdownObj[item.category] = item.cost;
        });

        setData({
            ...data,
            partner_breakdown: breakdownObj,
            partner_cost: calculateTotal(updatedBreakdown),
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachedFile(file);
            setData('document', file);
        }
    };

    const handleSubmit = (status) => {
        setData('status', status);

        router.post(route('partner.requests.update', budget.id), {
            ...data,
            status,
            _method: 'PUT',
        }, {
            forceFormData: true,
        });
    };

    const categoryIcons = {
        flights: { icon: 'fa-plane', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
        hotel: { icon: 'fa-hotel', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
        accommodation: { icon: 'fa-bed', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
        tickets: { icon: 'fa-ticket-alt', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        transport: { icon: 'fa-car', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
        meals: { icon: 'fa-utensils', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
        misc: { icon: 'fa-ellipsis-h', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
        default: { icon: 'fa-tag', color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)' },
    };

    const getCategoryStyle = (category) => categoryIcons[category.toLowerCase()] || categoryIcons.default;

    const costDiffClass = (diff) =>
        diff < 0 ? 'cost-diff-negative' : diff > 0 ? 'cost-diff-positive' : 'cost-diff-zero';

    const status = budget.partner_status || 'pending';

    return (
        <PartnerLayout title={`Request ${budget.reference_id}`}>
            <DashboardHero
                role="partner"
                title={budget.reference_id}
                subtitle="Review and adjust the travel package details."
                breadcrumbs={[
                    { label: 'Partner', icon: 'fas fa-home', href: route('partner.dashboard') },
                    { label: 'Requests', href: route('partner.requests') },
                    { label: budget.reference_id },
                ]}
            >
                <span className={`tfe-pill tfe-pill--standalone ${STATUS_PILL[status]}`}>
                    {status === 'pending' ? 'Needs Review' : status}
                </span>
            </DashboardHero>

            {/* Summary Cards — Sprint 36 tile primitive */}
            <div className="tfe-stat-grid">
                {[
                    { icon: 'fa-futbol', value: budget.match_ids?.length || 0, label: 'Matches',       variant: 'blue' },
                    { icon: 'fa-bed',    value: budget.nights || 0,           label: 'Nights',        variant: 'violet' },
                    { icon: 'fa-star',   value: budget.accommodation_level,   label: 'Accommodation', variant: 'teal', capitalize: true },
                    { icon: 'fa-plane',  value: budget.flight_class,          label: 'Flight Class',  variant: 'amber', capitalize: true },
                ].map((t, i) => (
                    <div key={i} className={`tfe-tile tfe-tile--${t.variant}`}>
                        <div className="tfe-tile__head">
                            <div className="tfe-tile__icon"><i className={`fas ${t.icon}`} /></div>
                        </div>
                        <div
                            className="tfe-tile__value"
                            style={t.capitalize ? { textTransform: 'capitalize' } : undefined}
                        >
                            {t.value}
                        </div>
                        <div className="tfe-tile__label">{t.label}</div>
                    </div>
                ))}
            </div>

            {/* Cost Breakdown */}
            <section className="tfe-slab mt-4">
                <div className="tfe-slab__header">
                    <h3 className="tfe-slab__title"><i className="fas fa-calculator me-2" /> Cost Breakdown</h3>
                    <span className="tfe-slab__title-sub">
                        Original Estimate: {formatMoney(budget.original_cost)}
                    </span>
                </div>
                <div className="tfe-slab__body tfe-slab__body--flush">
                    <div className="table-responsive">
                        <table className="tfe-table cost-breakdown-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Original Cost</th>
                                    <th>Your Quote</th>
                                    <th>Difference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {breakdown.map((item, index) => {
                                    const style = getCategoryStyle(item.category);
                                    const originalCost = budget.original_breakdown?.[item.category] || 0;
                                    const difference = item.cost - originalCost;

                                    return (
                                        <tr key={index}>
                                            <td>
                                                <div className="category-name">
                                                    <div className="category-icon" style={{ background: style.bg, color: style.color }}>
                                                        <i className={`fas ${style.icon}`}></i>
                                                    </div>
                                                    <span className="category-label">{item.category.replace(/_/g, ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="dash-text-muted">{formatMoney(originalCost)}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="tfe-input tfe-input--sm cost-input"
                                                    value={item.cost}
                                                    onChange={(e) => updateBreakdownItem(index, e.target.value)}
                                                />
                                            </td>
                                            <td className={costDiffClass(difference)}>
                                                {difference === 0 ? '—' : (difference > 0 ? '+' : '') + formatMoney(difference)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="cost-total-row">
                        <span className="total-label">
                            <i className="fas fa-coins"></i>
                            Total Partner Quote
                        </span>
                        <span className="total-value">{formatMoney(calculateTotal(breakdown))}</span>
                    </div>
                </div>
            </section>

            {/* Notes & Documents */}
            <div className="dash-form-grid mt-4">
                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title"><i className="fas fa-sticky-note me-2" /> Notes &amp; Comments</h3>
                    </div>
                    <div className="tfe-slab__body">
                        <textarea
                            className="tfe-textarea"
                            rows={5}
                            placeholder="Add notes for the fan about pricing, inclusions, special offers, or any important details…"
                            value={data.partner_notes}
                            onChange={(e) => setData('partner_notes', e.target.value)}
                        ></textarea>
                    </div>
                </section>

                <section className="tfe-slab">
                    <div className="tfe-slab__header">
                        <h3 className="tfe-slab__title"><i className="fas fa-paperclip me-2" /> Attach Document</h3>
                    </div>
                    <div className="tfe-slab__body">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden-file-input"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <div
                            className="document-upload-zone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {attachedFile ? (
                                <>
                                    <i className="fas fa-file-alt accent-success"></i>
                                    <p className="dash-text-primary dash-fw-medium">{attachedFile.name}</p>
                                    <p className="dash-text-muted dash-text-sm">Click to change file</p>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-cloud-upload-alt"></i>
                                    <p>Drag and drop or click to upload</p>
                                    <p className="dash-text-sm">PDF, DOC, DOCX, JPG, PNG</p>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Action Buttons */}
            <div className="tfe-form-actions mt-4">
                <button
                    className="tfe-btn tfe-btn--filled"
                    disabled={processing}
                    onClick={() => handleSubmit('approved')}
                >
                    <i className="fas fa-check-circle me-2"></i>
                    Approve Quote
                </button>
                <button
                    className="tfe-btn"
                    disabled={processing}
                    onClick={() => handleSubmit('modified')}
                >
                    <i className="fas fa-save me-2"></i>
                    Save Changes
                </button>
                <button
                    className="tfe-btn"
                    disabled={processing}
                    onClick={() => handleSubmit('rejected')}
                >
                    <i className="fas fa-times-circle me-2"></i>
                    Reject Request
                </button>
            </div>
        </PartnerLayout>
    );
}
