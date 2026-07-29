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
import ConfirmationDialog from '@/Components/ConfirmationDialog';
import DashboardModal from '@/Components/Fan/DashboardModal';

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
        <FanLayout user={auth.user} header="Payments">
            <Head title="Payments" />

            <div>
                <DashboardHero role="fan" 
                    title="My Wallet"
                    subtitle="Manage your payment methods and transaction history"
                    breadcrumbs={[{ label: 'Payments' }]}
                    bgImage="/assets/img/fan/backgrounds/gaming_hero.png"
                    actions={
                        <div className="flex gap-3">
                            <button className="btn-fan-custom" onClick={() => setShowMethodModal(true)}>
                                <i className="fas fa-plus me-2"></i> Add Method
                            </button>
                            <button className="btn-fan-custom bg-white/10" onClick={() => setShowPayModal(true)}>
                                <i className="fas fa-paper-plane me-2"></i> Send / Pay
                            </button>
                        </div>
                    }
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

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Spent</div>
                                <div className="text-xl font-bold text-white">{formatMoney(stats.total_paid)}</div>
                            </div>
                            <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pending</div>
                                <div className="text-xl font-bold text-amber-500">{formatMoney(stats.pending)}</div>
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
                                        <button className="text-red-500/50 hover:text-red-500 transition-colors p-2" onClick={() => setMethodToDelete(method.id)}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-white/30">
                                        <i className="fas fa-wallet fa-2x mb-3 opacity-50"></i>
                                        <p>No payment methods added yet.</p>
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
                                    <div className="text-center py-8 text-white/30">
                                        <p>No recent transactions.</p>
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
                    <div className="flex flex-col h-full">
                        {/* Paystack Integration Guide */}
                        <div className="stripe-guide-box" style={{ background: 'rgba(5, 75, 150, 0.1)', borderColor: 'rgba(5, 75, 150, 0.2)' }}>
                            <div className="stripe-guide-title" style={{ color: '#00c3f7' }}>
                                <i className="fas fa-layer-group fa-lg"></i>
                                <span>Paystack Integration Guide</span>
                            </div>
                            <div className="text-xs text-gray-400 mb-3">
                                To implement Paystack (Card & Mobile Money), follow these steps:
                            </div>
                            <div className="stripe-step">
                                <div className="stripe-step-num" style={{ background: '#00c3f7' }}>1</div>
                                <div>Install <code>react-paystack</code> package or use Inline JS script.</div>
                            </div>
                            <div className="stripe-step">
                                <div className="stripe-step-num" style={{ background: '#00c3f7' }}>2</div>
                                <div>Backend: Verify transaction via <code>https://api.paystack.co/transaction/verify/:reference</code>.</div>
                            </div>
                            <div className="stripe-step">
                                <div className="stripe-step-num" style={{ background: '#00c3f7' }}>3</div>
                                <div>Frontend: Use <code>usePaystackPayment</code> hook to trigger the popup for Cards/M-Pesa.</div>
                            </div>
                        </div>

                        <form onSubmit={handleAddMethod} className="space-y-4">
                            <div className="alert alert-info bg-blue-500/10 border-blue-500/20 text-blue-400 text-sm">
                                <i className="fas fa-info-circle me-2"></i>
                                In production, clicking "Add Card" would open the secured Paystack Popup to tokenize the card.
                            </div>
                            
                            <div>
                                <label className="form-label">Card Holder Email</label>
                                <input type="email" className="form-control" placeholder="user@example.com" defaultValue={auth.user.email} />
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setShowMethodModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit-modal" style={{ background: '#00c3f7', color: '#000' }} disabled={methodProcessing}>Initialize Paystack</button>
                            </div>
                        </form>
                    </div>
                )}

                {activeMethodTab === 'mpesa' && (
                    <form onSubmit={handleAddMethod} className="flex flex-col h-full">
                        <div className="space-y-4 mb-4">
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3">
                                <div className="bg-green-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">M</div>
                                <div>
                                    <div className="text-white font-bold">M-Pesa Integration</div>
                                    <div className="text-white-50 text-xs">Fast and secure mobile payments</div>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Phone Number</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="2547..." 
                                    value={methodData.phone_number} 
                                    onChange={e => setMethodData('phone_number', e.target.value)} 
                                />
                                <div className="form-hint">Enter your M-Pesa registered number starting with 254</div>
                            </div>
                        </div>
                         <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={() => setShowMethodModal(false)}>Cancel</button>
                            <button type="submit" className="btn-submit-modal" style={{ background: '#00c851' }} disabled={methodProcessing}>Save M-Pesa</button>
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
                    <div className="space-y-4 mb-4">
                        <div>
                            <label className="form-label">Amount (KES)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-500">KES</span>
                                <input 
                                    type="number" 
                                    className="form-control pl-16 text-lg font-bold text-right" 
                                    placeholder="0.00" 
                                    value={payData.amount} 
                                    onChange={e => setPayData('amount', e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Payment Method</label>
                            <select className="form-select" value={payData.method} onChange={e => setPayData('method', e.target.value)}>
                                <option value="mpesa">M-Pesa</option>
                                <option value="card" disabled={!paymentMethods.some(m => m.type === 'card')}>Credit/Debit Card</option>
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Description (Optional)</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="e.g. Ticket Purchase" 
                                value={payData.description} 
                                onChange={e => setPayData('description', e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setShowPayModal(false)}>Cancel</button>
                        <button type="submit" className="btn-submit-modal">Process Payment</button>
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
