import React, { useState } from 'react';
import FanLayout from '@/Layouts/FanLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils';
import '../../../css/fan/fan-pages.css';
import '../../../css/fan/wallet.css';
import DashboardHero from '@/Components/Common/DashboardHero';
import SummaryTiles from '@/Components/Common/SummaryTiles';
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Common/DashboardModal';

export default function Payments({ auth, payments, paymentMethods, transactions, stats }) {
    const { data: payData, setData: setPayData, post: payPost, processing: payProcessing, reset: payReset } = useForm({
        amount: '',
        method: 'mpesa',
        description: ''
    });

    const { data: methodData, setData: setMethodData, post: methodPost, processing: methodProcessing, reset: methodReset } = useForm({
        type: 'paystack', // Default to paystack
        phone_number: '',
    });

    const [showPayModal, setShowPayModal] = useState(false);
    const [showMethodModal, setShowMethodModal] = useState(false);
    const [methodToDelete, setMethodToDelete] = useState(null);
    const [activeMethodTab, setActiveMethodTab] = useState('card');
    const [activePayTab, setActivePayTab] = useState('payment');

    const [paystackConfig, setPaystackConfig] = useState({
        reference: '',
        email: auth.user.email,
        amount: 0,
        publicKey: '',
    });

    const initializePayment = usePaystackPayment(paystackConfig);

    const onSuccessPaystack = (reference) => {
        const loadingToast = toast.loading('Verifying payment...');
        router.post(route('fan.payments.verify'), { reference: reference.reference }, {
             onSuccess: () => {
                 toast.dismiss(loadingToast);
                 toast.success("Payment verified successfully!");
                 setPaystackConfig(prev => ({ ...prev, reference: '' }));
             },
             onError: () => {
                 toast.dismiss(loadingToast);
                 toast.error("Verification failed.");
             }
        });
    };

    const onClosePaystack = () => {
        toast.info('Payment cancelled.');
        setPaystackConfig(prev => ({ ...prev, reference: '' }));
    }

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const amount = params.get('amount');
        const description = params.get('description');
        
        if (amount || description) {
            setPayData(prev => ({
                ...prev,
                amount: amount || '',
                description: description || ''
            }));
            setShowPayModal(true);
        }

        if (paystackConfig.reference && paystackConfig.publicKey) {
            initializePayment(onSuccessPaystack, onClosePaystack);
        }
    }, [paystackConfig]);

    const handlePayment = (e) => {
        e.preventDefault();
        
        const loadingToast = toast.loading('Initiating payment...');

        axios.post(route('fan.payments.initiate'), payData)
            .then(response => {
                toast.dismiss(loadingToast);
                const { reference, public_key } = response.data;
                
                setShowPayModal(false);
                payReset();
                
                // Trigger Paystack Popup
                setPaystackConfig({
                    reference,
                    email: auth.user.email,
                    amount: payData.amount * 100, // Convert to kobo/cents
                    publicKey: public_key,
                    currency: 'KES',
                });
            })
            .catch(error => {
                 toast.dismiss(loadingToast);
                 console.error(error);
                 toast.error(error.response?.data?.message || 'Payment initiation failed');
            });
    };

    const handleAddMethod = (e) => {
        e.preventDefault();
        // Simulate success for demo or actual post
        methodPost(route('fan.payments.method.add'), {
            onSuccess: () => {
                methodReset();
                setShowMethodModal(false);
            }
        });
    };

    const handleDeleteMethod = () => {
        if (methodToDelete) {
            router.delete(route('fan.payments.method.remove', methodToDelete), {
                onSuccess: () => setMethodToDelete(null)
            });
        }
    };

    const methodTabs = [
        { id: 'card', label: 'Credit / Debit Card', icon: 'fas fa-credit-card' },
        { id: 'mpesa', label: 'M-Pesa', icon: 'fas fa-mobile-alt' }
    ];

    const payTabs = [
        { id: 'payment', label: 'Make Payment', icon: 'fas fa-money-bill-wave' }
    ];

    return (
        <FanLayout title="Payments">
            <Head title="Payments" />

            <div>
                <DashboardHero role="fan" 
                    title="My Wallet"
                    subtitle="Manage your payment methods and transaction history"
                    breadcrumbs={[{ label: 'Payments' }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                    actions={
                        <div className="d-flex gap-2">
                            <button type="button" className="tfe-btn" onClick={() => setShowMethodModal(true)}>
                                <i className="fas fa-plus me-2"></i> Add Method
                            </button>
                            <button type="button" className="tfe-btn tfe-btn--filled" onClick={() => setShowPayModal(true)}>
                                <i className="fas fa-paper-plane me-2"></i> Send / Pay
                            </button>
                        </div>
                    }
                />

                <SummaryTiles
                    className="mt-4"
                    items={[
                        { label: 'Total spent', value: formatMoney(stats.total_paid), icon: 'fa-arrow-up',   accent: 'red',   subtext: 'Across all transactions' },
                        { label: 'Pending',     value: formatMoney(stats.pending),    icon: 'fa-hourglass-half', accent: 'amber', subtext: 'Awaiting confirmation' },
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                    {/* Left Column: Wallet Card & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Interactive Wallet Card */}
                        <div className="wallet-card-container">
                            <div className="wallet-card">
                                <div className="wallet-card-chip"></div>
                                <div className="wallet-card-number">
                                    •••• •••• •••• {paymentMethods?.find(m => m.type === 'card')?.last4 || '8888'}
                                </div>
                                <div className="wallet-card-footer">
                                    <div className="wallet-card-holder">
                                        <div>Card Holder</div>
                                        <div className="name">{auth.user.name}</div>
                                    </div>
                                    <div className="wallet-card-logo">Paystack</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Transactions & Methods */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Payment Methods */}
                        <div className="content-card">
                            <div className="card-header flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-wallet"></i>
                                    <h3>Payment Methods</h3>
                                </div>
                            </div>
                            <div className="p-0">
                                {paymentMethods?.length > 0 ? paymentMethods.map(method => (
                                    <div key={method.id} className="payment-method-item mx-4 my-2">
                                        <div className="payment-method-icon">
                                            <i className={`fas fa-${method.type === 'mpesa' ? 'mobile-alt' : 'credit-card'}`}></i>
                                        </div>
                                        <div className="payment-method-info">
                                            <div className="payment-method-title">{method.display_name}</div>
                                            <div className="payment-method-subtitle uppercase">{method.type} {method.is_default && '• Default'}</div>
                                        </div>
                                        <button type="button" className="tfe-btn tfe-btn--icon tfe-btn--sm" onClick={() => setMethodToDelete(method.id)} aria-label="Remove method">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="tfe-empty tfe-empty--inline">
                                        <div className="tfe-empty__icon"><i className="fas fa-wallet"></i></div>
                                        <div className="tfe-empty__body">No payment methods added yet.</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="content-card">
                            <div className="card-header">
                                <i className="fas fa-history"></i>
                                <h3>Transaction History</h3>
                            </div>
                            <div className="p-4 pt-0">
                                {transactions?.length > 0 ? transactions.map(txn => (
                                    <div key={txn.id} className="transaction-item">
                                        <div className="flex items-center flex-1">
                                            <div className={`transaction-icon ${txn.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                <i className={`fas fa-${txn.status === 'completed' ? 'check' : 'clock'}`}></i>
                                            </div>
                                            <div className="transaction-info">
                                                <div className="text-white font-medium">{txn.description || txn.reference}</div>
                                                <div className="text-gray-500 text-xs">
                                                    {txn.created_at ? new Date(txn.created_at).toLocaleDateString() : new Date().toLocaleDateString()} • {txn.method.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="transaction-amount text-white">{formatMoney(txn.amount, txn.currency)}</div>
                                            <div className={`transaction-status status-${txn.status}`}>
                                                {txn.status}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="tfe-empty tfe-empty--inline">
                                        <div className="tfe-empty__icon"><i className="fas fa-receipt"></i></div>
                                        <div className="tfe-empty__body">No recent transactions.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Payment Method Modal */}
            <DashboardModal
                open={showMethodModal}
                onOpenChange={setShowMethodModal}
                title="Add Payment Method"
                label="Wallet Action"
                activeTab={activeMethodTab}
                onTabChange={setActiveMethodTab}
                tabs={methodTabs}
            >
                {activeMethodTab === 'card' && (
                    <div className="d-flex flex-column h-100">
                        <div className="wallet-guide">
                            <div className="wallet-guide__title">
                                <i className="fas fa-layer-group fa-lg"></i>
                                <span>Paystack Integration Guide</span>
                            </div>
                            <div className="text-white-50 small mb-3">
                                To implement Paystack (Card & Mobile Money), follow these steps:
                            </div>
                            <div className="wallet-guide__step">
                                <div className="wallet-guide__num">1</div>
                                <div>Install <code>react-paystack</code> package or use Inline JS script.</div>
                            </div>
                            <div className="wallet-guide__step">
                                <div className="wallet-guide__num">2</div>
                                <div>Backend: Verify transaction via <code>https://api.paystack.co/transaction/verify/:reference</code>.</div>
                            </div>
                            <div className="wallet-guide__step">
                                <div className="wallet-guide__num">3</div>
                                <div>Frontend: Use <code>usePaystackPayment</code> hook to trigger the popup for Cards/M-Pesa.</div>
                            </div>
                        </div>

                        <form onSubmit={handleAddMethod} className="tfe-form-field mt-3">
                            <div className="wallet-note">
                                <i className="fas fa-info-circle me-2"></i>
                                In production, clicking "Add Card" would open the secured Paystack Popup to tokenize the card.
                            </div>

                            <div>
                                <label className="tfe-form-label">Card Holder Email</label>
                                <input type="email" className="tfe-input" placeholder="user@example.com" defaultValue={auth.user.email} />
                            </div>

                            <div className="dash-modal-footer">
                                <button type="button" className="tfe-btn" onClick={() => setShowMethodModal(false)}>Cancel</button>
                                <button type="submit" className="tfe-btn tfe-btn--filled" disabled={methodProcessing}>Initialize Paystack</button>
                            </div>
                        </form>
                    </div>
                )}

                {activeMethodTab === 'mpesa' && (
                    <form onSubmit={handleAddMethod} className="d-flex flex-column h-100">
                        <div className="tfe-form-field">
                            <div className="wallet-note wallet-note--success">
                                <div className="wallet-note__glyph">M</div>
                                <div>
                                    <div className="text-white fw-bold">M-Pesa Integration</div>
                                    <div className="text-white-50 small">Fast and secure mobile payments</div>
                                </div>
                            </div>
                            <div>
                                <label className="tfe-form-label">Phone Number</label>
                                <input
                                    type="text"
                                    className="tfe-input"
                                    placeholder="2547..."
                                    value={methodData.phone_number}
                                    onChange={e => setMethodData('phone_number', e.target.value)}
                                />
                                <div className="tfe-form-help">Enter your M-Pesa registered number starting with 254</div>
                            </div>
                        </div>
                        <div className="dash-modal-footer">
                            <button type="button" className="tfe-btn" onClick={() => setShowMethodModal(false)}>Cancel</button>
                            <button type="submit" className="tfe-btn tfe-btn--filled" disabled={methodProcessing}>Save M-Pesa</button>
                        </div>
                    </form>
                )}
            </DashboardModal>

            {/* Make Payment Modal */}
            <DashboardModal
                open={showPayModal}
                onOpenChange={setShowPayModal}
                title="Initiate Payment"
                label="Transaction"
                activeTab={activePayTab}
                onTabChange={setActivePayTab}
                tabs={payTabs}
            >
                <form onSubmit={handlePayment}>
                    <div className="tfe-form-field">
                        <div>
                            <label className="tfe-form-label">Amount (KES)</label>
                            <input
                                type="number"
                                className="tfe-input"
                                placeholder="0.00"
                                value={payData.amount}
                                onChange={e => setPayData('amount', e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="tfe-form-label">Payment Method</label>
                            <select className="tfe-select" value={payData.method} onChange={e => setPayData('method', e.target.value)}>
                                <option value="mpesa">M-Pesa</option>
                                <option value="card" disabled={!paymentMethods.some(m => m.type === 'card')}>Credit/Debit Card</option>
                            </select>
                        </div>
                        <div>
                            <label className="tfe-form-label">Description (Optional)</label>
                            <input
                                type="text"
                                className="tfe-input"
                                placeholder="e.g. Ticket Purchase"
                                value={payData.description}
                                onChange={e => setPayData('description', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="dash-modal-footer">
                        <button type="button" className="tfe-btn" onClick={() => setShowPayModal(false)}>Cancel</button>
                        <button type="submit" className="tfe-btn tfe-btn--filled">Process Payment</button>
                    </div>
                </form>
            </DashboardModal>

            <ConfirmationDialog
                open={!!methodToDelete}
                onOpenChange={(open) => !open && setMethodToDelete(null)}
                title="Remove Payment Method?"
                description="Are you sure you want to remove this payment method? You will need to add it again for future purchases."
                onConfirm={handleDeleteMethod}
                confirmText="Remove"
                variant="destructive"
            />
        </FanLayout>
    );
}
