import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import { formatMoney } from '@/lib/utils';
import '../../../css/fan/fan-pages.css';
import '../../../css/virtual-card.css';

const AT = (s) => new Date(s).toLocaleString();

export default function VirtualCard({ auth, card, partner, currencies = [] }) {
    const accent = partner?.theme_accent || '#0072CE';

    return (
        <FanLayout user={auth.user}>
            <Head title="Virtual card" />
            <DashboardHero
                role="fan"
                title="Multicurrency virtual card"
                subtitle={`Powered by ${partner?.display_name || 'Ecobank Fan Finance'} — spend anywhere in seven currencies.`}
                breadcrumbs={[{ label: 'Home', href: route('fan.dashboard') }, { label: 'Virtual card' }]}
            />

            {!card ? <Activate partner={partner} accent={accent} /> : <ActiveCard card={card} partner={partner} accent={accent} />}
        </FanLayout>
    );
}

function Activate({ partner, accent }) {
    const [busy, setBusy] = useState(false);

    const submit = () => {
        setBusy(true);
        router.post(route('fan.virtual-card.activate'), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Virtual card activated'),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="vcard-activate" style={{ '--vcard-accent': accent }}>
            <div className="vcard-activate__mock">
                <div className="vcard-face vcard-face--placeholder">
                    <div className="vcard-face__band">
                        {partner?.logo_url ? (
                            <img src={partner.logo_url} alt={partner.display_name} className="vcard-face__logo" />
                        ) : (
                            <span className="vcard-face__brand">{partner?.display_name || 'Ecobank Fan Finance'}</span>
                        )}
                        <span className="vcard-face__watermark">DEMO</span>
                    </div>
                    <div className="vcard-face__pan">•••• •••• •••• ••••</div>
                    <div className="vcard-face__row">
                        <div><span>Cardholder</span><strong>YOUR NAME</strong></div>
                        <div><span>Expires</span><strong>MM/YY</strong></div>
                        <div className="vcard-face__network">VISA</div>
                    </div>
                </div>
            </div>

            <div className="vcard-activate__pitch">
                <h2>One card, seven currencies.</h2>
                <p>Activate your Ecobank multicurrency virtual card to pay in USD, EUR, GBP, KES, ZAR, NGN or XOF wherever cards are accepted — online, in-app, or at the stadium.</p>
                <ul className="vcard-activate__perks">
                    <li><i className="fas fa-globe-africa"></i> No FX markup between wallet currencies</li>
                    <li><i className="fas fa-bolt"></i> Instant issuance — no plastic to wait for</li>
                    <li><i className="fas fa-shield-alt"></i> Freeze / unfreeze anytime, one-tap</li>
                    <li><i className="fas fa-piggy-bank"></i> Top-up from your Ecobank Fan Finance wallet</li>
                </ul>
                <button className="tfe-btn tfe-btn--filled tfe-btn--lg" onClick={submit} disabled={busy}>
                    <i className="fas fa-plus-circle"></i> Activate my card
                </button>
                <p className="vcard-activate__disclaimer">Demo card — no real PAN is issued and no real funds are held.</p>
            </div>
        </div>
    );
}

function ActiveCard({ card, partner, accent }) {
    const currencies = Object.keys(card.balances || {});
    const primary = currencies[0] || 'USD';

    return (
        <div className="vcard-page" style={{ '--vcard-accent': accent }}>
            <section className="vcard-page__top">
                <div className="vcard-face">
                    <div className="vcard-face__band">
                        {partner?.logo_url ? (
                            <img src={partner.logo_url} alt={partner.display_name} className="vcard-face__logo" />
                        ) : (
                            <span className="vcard-face__brand">{partner?.display_name || 'Ecobank Fan Finance'}</span>
                        )}
                        <span className="vcard-face__watermark">DEMO</span>
                    </div>
                    <div className="vcard-face__pan">{card.masked_pan}</div>
                    <div className="vcard-face__row">
                        <div><span>Cardholder</span><strong>{card.holder_name}</strong></div>
                        <div><span>Expires</span><strong>{card.expiry}</strong></div>
                        <div className="vcard-face__network">{card.network?.toUpperCase() || 'VISA'}</div>
                    </div>
                </div>

                <div className="vcard-actions">
                    <span className={`tfe-pill ${card.status === 'active' ? 'tfe-pill--approved' : 'tfe-pill--pending'}`}>
                        {card.status}
                    </span>
                    <div className="vcard-actions__hint">Total available (primary wallet)</div>
                    <div className="vcard-actions__amount">{formatMoney(card.balances[primary], primary)}</div>
                    <div className="vcard-actions__row">
                        <button className="tfe-btn tfe-btn--sm" disabled><i className="fas fa-plus"></i> Top up</button>
                        <button className="tfe-btn tfe-btn--sm" disabled><i className="fas fa-snowflake"></i> Freeze</button>
                        <Link href={`/partners/${partner?.slug || 'ecobank-fan-finance'}`} className="tfe-btn tfe-btn--sm">
                            <i className="fas fa-external-link-alt"></i> Manage
                        </Link>
                    </div>
                </div>
            </section>

            <section className="tfe-slab" style={{ marginTop: 20 }}>
                <div className="tfe-slab__header">
                    <div>
                        <h2 className="tfe-slab__title">Wallet balances</h2>
                        <p className="tfe-slab__title-sub">Every currency your card can spend in.</p>
                    </div>
                </div>
                <div className="tfe-slab__body">
                    <div className="tfe-stat-grid">
                        {currencies.map((code, i) => (
                            <div key={code} className={`tfe-tile tfe-tile--${['blue','cyan','teal','graph','violet','amber','rose'][i % 7]}`}>
                                <div className="tfe-tile__head">
                                    <div className="tfe-tile__icon"><i className="fas fa-wallet"></i></div>
                                </div>
                                <p className="tfe-tile__value">{formatMoney(card.balances[code], code)}</p>
                                <p className="tfe-tile__label">{code} wallet</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="tfe-slab" style={{ marginTop: 20 }}>
                <div className="tfe-slab__header">
                    <div>
                        <h2 className="tfe-slab__title">Recent transactions</h2>
                        <p className="tfe-slab__title-sub">Ledger of every wallet movement.</p>
                    </div>
                </div>
                <div className="tfe-slab__body tfe-slab__body--flush">
                    <div className="table-responsive">
                        <table className="tfe-table tfe-table--compact">
                            <thead>
                                <tr><th>Merchant</th><th>Category</th><th>Reference</th><th>Amount</th><th>Posted</th></tr>
                            </thead>
                            <tbody>
                                {(card.transactions || []).length === 0 ? (
                                    <tr><td colSpan="5"><div className="tfe-empty tfe-empty--inline"><p className="tfe-empty__body">No transactions yet.</p></div></td></tr>
                                ) : card.transactions.map((t) => (
                                    <tr key={t.id}>
                                        <td>{t.merchant}</td>
                                        <td style={{ textTransform: 'capitalize' }}>{(t.category || '—').replace('_', ' ')}</td>
                                        <td><code>{t.reference}</code></td>
                                        <td style={{ color: t.kind === 'credit' ? '#4ade80' : '#fca5a5', fontWeight: 700 }}>
                                            {t.kind === 'credit' ? '+' : '−'} {formatMoney(t.amount, t.currency)}
                                        </td>
                                        <td style={{ fontSize: '0.75rem' }}>{AT(t.posted_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
