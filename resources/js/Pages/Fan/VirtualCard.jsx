import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import FanLayout from '@/Layouts/FanLayout';
import DashboardHero from '@/Components/Common/DashboardHero';
import VirtualCardFace from '@/Components/Fan/VirtualCardFace';
import { formatMoney, formatDateTime, statusLabel } from '@/lib/utils';
import '../../../css/fan/fan-pages.css';
import '../../../css/virtual-card.css';

const AT = (s) => formatDateTime(s);

/**
 * A wallet's amount for its tile. The tile already shows the currency code
 * in its chip, so a currency with no symbol of its own ("KES 20,000.00")
 * drops the repeated code and the figure fits two tiles across a phone.
 * Symbols (€, £, $, FCFA) stay: they are part of how the amount reads.
 */
function walletAmount(amount, code) {
    return formatMoney(amount, code).replace(new RegExp(`^${code}\\s*`), '');
}

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
                <VirtualCardFace
                    issuer={partner?.display_name || 'Ecobank Fan Finance'}
                    logoUrl={partner?.logo_url}
                    placeholder
                />
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
                <VirtualCardFace
                    issuer={partner?.display_name || 'Ecobank Fan Finance'}
                    logoUrl={partner?.logo_url}
                    holder={card.holder_name}
                    expiry={card.expiry}
                    last4={card.last4}
                    network={card.network || 'visa'}
                />

                <div className="vcard-actions">
                    <span className={`tfe-pill ${card.status === 'active' ? 'tfe-pill--approved' : 'tfe-pill--pending'}`}>
                        {statusLabel(card.status)}
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
                    {/* Own tiles, not .tfe-tile: a stat tile's 2rem figure is
                        made for "12" or "$4k", and "NGN 150,000.00" ran out
                        of a half-width phone tile. The amount here scales
                        with its tile (container units). */}
                    <div className="vcard-wallets">
                        {currencies.map((code) => (
                            <div key={code} className={'vcard-wallet' + (code === primary ? ' is-primary' : '')}>
                                <div className="vcard-wallet__head">
                                    <span className="vcard-wallet__code">{code}</span>
                                    {code === primary && <span className="vcard-wallet__primary">Primary</span>}
                                </div>
                                <p className="vcard-wallet__amount">{walletAmount(card.balances[code], code)}</p>
                                <p className="vcard-wallet__label">{code} wallet</p>
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
