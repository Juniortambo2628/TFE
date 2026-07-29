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

    const statusColors = {
        approved: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
        modified: { bg: 'rgba(217, 119, 6, 0.2)', color: '#d97706' },
        pending: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
        rejected: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
    };

    const sc = statusColors[budget.partner_status] || statusColors.pending;

    return (
        <PartnerLayout title={`Request ${budget.reference_id}`}>
            <div className="partner-layout">
                {/* Hero Section */}
                <div className="dashboard-header-card mb-4" style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                    border: `1px solid ${sc.color}`,
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: `0 4px 24px ${sc.bg}`
                }}>
                    <div className="dash-flex-between dash-flex-wrap dash-gap-lg">
                        <div>
                            <Link href={route('partner.dashboard')} className="dash-text-muted dash-text-base" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <i className="fas fa-arrow-left"></i> Back to Dashboard
                            </Link>
                            <h1 className="dash-text-primary" style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                                {budget.reference_id}
                            </h1>
                            <p className="dash-text-muted dash-text-base dash-no-margin">
                                Review and adjust the travel package details
                            </p>
                        </div>
                        <div className="dash-text-right">
                            <div style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                background: sc.bg,
                                color: sc.color
                            }}>
                                {budget.partner_status === 'pending' ? 'Needs Review' : budget.partner_status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="partner-summary-cards">
                    <div className="partner-stat-card" style={{ '--card-accent': '#3b82f6' }}>
                        <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                            <i className="fas fa-futbol"></i>
                        </div>
                        <div className="stat-value">{budget.match_ids?.length || 0}</div>
                        <div className="stat-label">Matches</div>
                    </div>
                    <div className="partner-stat-card" style={{ '--card-accent': '#8b5cf6' }}>
                        <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                            <i className="fas fa-bed"></i>
                        </div>
                        <div className="stat-value">{budget.nights || 0}</div>
                        <div className="stat-label">Nights</div>
                    </div>
                    <div className="partner-stat-card" style={{ '--card-accent': '#10b981' }}>
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <i className="fas fa-star"></i>
                        </div>
                        <div className="stat-value capitalize">{budget.accommodation_level}</div>
                        <div className="stat-label">Accommodation</div>
                    </div>
                    <div className="partner-stat-card" style={{ '--card-accent': '#f59e0b' }}>
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
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
                                                <span style={{ textTransform: 'capitalize' }}>{item.category.replace(/_/g, ' ')}</span>
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
                                        <td style={{
                                            color: difference < 0 ? '#10b981' : difference > 0 ? '#ef4444' : '#888',
                                            fontWeight: '500'
                                        }}>
                                            {difference === 0 ? '—' : (difference > 0 ? '+' : '') + formatMoney(difference)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="cost-total-row">
                        <span className="total-label">
                            <i className="fas fa-coins" style={{ marginRight: '0.5rem' }}></i>
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
                            style={{ display: 'none' }}
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
                        style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            cursor: processing ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        <i className="fas fa-times-circle"></i>
                        Reject Request
                    </button>
                </div>
            </div>
        </PartnerLayout>
    );
}
