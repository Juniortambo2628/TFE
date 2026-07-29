import React, { useState, useRef } from 'react';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { useForm, Link, router } from '@inertiajs/react';
import { formatMoney } from '@/lib/utils';

export default function RequestView({ budget }) {
    const fileInputRef = useRef(null);
    const [attachedFile, setAttachedFile] = useState(null);

    const initialBreakdown = budget.partner_breakdown || budget.original_breakdown || {};
    const breakdownArray = Object.entries(initialBreakdown).map(([category, cost]) => ({
        category,
        cost: parseFloat(cost) || 0
    }));

    const { data, setData, post, processing, errors } = useForm({
        partner_cost: budget.partner_cost || budget.original_cost,
        partner_breakdown: initialBreakdown,
        partner_notes: budget.partner_notes || '',
        status: budget.partner_status || 'pending',
        document: null
    });

    const [breakdown, setBreakdown] = useState(breakdownArray);

    const calculateTotal = (items) => {
        return items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
    };

    const updateBreakdownItem = (index, newCost) => {
        const updatedBreakdown = [...breakdown];
        updatedBreakdown[index].cost = parseFloat(newCost) || 0;
        setBreakdown(updatedBreakdown);

        const breakdownObj = {};
        updatedBreakdown.forEach(item => {
            breakdownObj[item.category] = item.cost;
        });

        setData({
            ...data,
            partner_breakdown: breakdownObj,
            partner_cost: calculateTotal(updatedBreakdown)
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
            status: status,
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
        default: { icon: 'fa-tag', color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)' }
    };

    const getCategoryStyle = (category) => {
        const cat = category.toLowerCase();
        return categoryIcons[cat] || categoryIcons.default;
    };

    const statusPillClass = (status) =>
        `partner-status-pill partner-status-pill-${status || 'pending'}`;

    const costDiffClass = (diff) =>
        diff < 0 ? 'cost-diff-negative' : diff > 0 ? 'cost-diff-positive' : 'cost-diff-zero';

    return (
        <PartnerLayout title={`Request ${budget.reference_id}`}>
            <div className="partner-layout">
                {/* Hero Section */}
                <div className="partner-hero-dynamic mb-4" style={{
                    '--hero-border': budget.partner_status === 'approved' ? '#10b981' :
                                     budget.partner_status === 'rejected' ? '#ef4444' :
                                     budget.partner_status === 'modified' ? '#d97706' : '#3b82f6',
                    '--hero-shadow': budget.partner_status === 'approved' ? 'rgba(16,185,129,0.15)' :
                                    budget.partner_status === 'rejected' ? 'rgba(239,68,68,0.15)' :
                                    budget.partner_status === 'modified' ? 'rgba(217,119,6,0.15)' : 'rgba(59,130,246,0.15)',
                }}>
                    <div className="dash-flex-between dash-flex-wrap dash-gap-lg">
                        <div>
                            <Link href={route('partner.dashboard')} className="dash-text-muted dash-text-base partner-back-link">
                                <i className="fas fa-arrow-left"></i> Back to Dashboard
                            </Link>
                            <h1 className="dash-text-primary partner-request-title">
                                {budget.reference_id}
                            </h1>
                            <p className="dash-text-muted dash-text-base dash-no-margin">
                                Review and adjust the travel package details
                            </p>
                        </div>
                        <div className="dash-text-right">
                            <div className={statusPillClass(budget.partner_status)}>
                                {budget.partner_status === 'pending' ? 'Needs Review' : budget.partner_status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="partner-summary-cards">
                    <div className="partner-stat-card" data-accent="blue">
                        <div className="stat-icon">
                            <i className="fas fa-futbol"></i>
                        </div>
                        <div className="stat-value">{budget.match_ids?.length || 0}</div>
                        <div className="stat-label">Matches</div>
                    </div>
                    <div className="partner-stat-card" data-accent="purple">
                        <div className="stat-icon">
                            <i className="fas fa-bed"></i>
                        </div>
                        <div className="stat-value">{budget.nights || 0}</div>
                        <div className="stat-label">Nights</div>
                    </div>
                    <div className="partner-stat-card" data-accent="green">
                        <div className="stat-icon">
                            <i className="fas fa-star"></i>
                        </div>
                        <div className="stat-value capitalize">{budget.accommodation_level}</div>
                        <div className="stat-label">Accommodation</div>
                    </div>
                    <div className="partner-stat-card" data-accent="yellow">
                        <div className="stat-icon">
                            <i className="fas fa-plane"></i>
                        </div>
                        <div className="stat-value capitalize">{budget.flight_class}</div>
                        <div className="stat-label">Flight Class</div>
                    </div>
                </div>

                {/* Cost Breakdown Card */}
                <div className="partner-content-card">
                    <div className="card-header">
                        <h3><i className="fas fa-calculator"></i> Cost Breakdown</h3>
                        <span className="dash-text-muted dash-text-base">
                            Original Estimate: {formatMoney(budget.original_cost)}
                        </span>
                    </div>

                    <table className="cost-breakdown-table">
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
                                                className="cost-input"
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

                    <div className="cost-total-row">
                        <span className="total-label">
                            <i className="fas fa-coins"></i>
                            Total Partner Quote
                        </span>
                        <span className="total-value">{formatMoney(calculateTotal(breakdown))}</span>
                    </div>
                </div>

                {/* Notes & Documents */}
                <div className="dash-form-grid">
                    <div className="partner-content-card partner-notes-section">
                        <div className="card-header">
                            <h3><i className="fas fa-sticky-note"></i> Notes & Comments</h3>
                        </div>
                        <textarea
                            placeholder="Add notes for the fan about pricing, inclusions, special offers, or any important details..."
                            value={data.partner_notes}
                            onChange={(e) => setData('partner_notes', e.target.value)}
                        ></textarea>
                    </div>

                    <div className="partner-content-card">
                        <div className="card-header">
                            <h3><i className="fas fa-paperclip"></i> Attach Document</h3>
                        </div>
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
                </div>

                {/* Action Buttons */}
                <div className="partner-action-buttons">
                    <button
                        className="partner-btn partner-btn-approve"
                        disabled={processing}
                        onClick={() => handleSubmit('approved')}
                    >
                        <i className="fas fa-check-circle"></i>
                        Approve Quote
                    </button>
                    <button
                        className="partner-btn partner-btn-save"
                        disabled={processing}
                        onClick={() => handleSubmit('modified')}
                    >
                        <i className="fas fa-save"></i>
                        Save Changes
                    </button>
                    <button
                        className="partner-btn partner-btn-reject"
                        disabled={processing}
                        onClick={() => handleSubmit('rejected')}
                    >
                        <i className="fas fa-times-circle"></i>
                        Reject Request
                    </button>
                </div>
            </div>
        </PartnerLayout>
    );
}
