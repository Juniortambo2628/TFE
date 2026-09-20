import { Head, Link, usePage } from '@inertiajs/react';
import { Toaster } from 'sonner';
import '../../css/auth.css';

/*
 * AuthLayout — the shared split-screen shell for every public auth page.
 *
 * Left: a full-bleed football hero with a gradient scrim, brand mark and
 * a rotating tagline. Right: a glass card holding the form (children).
 * Collapses to a single stacked column below 900px.
 *
 * Reuses the `.tfe-input` / `.tfe-btn` primitives inside the card, so a
 * page only supplies its fields — no per-page auth chrome.
 */
export default function AuthLayout({
    title,
    subtitle,
    head,
    children,
    wide = false,
    heroImage,
    heroHeadline = 'Your matchday, planned end to end.',
    heroTagline = 'Fixtures, hotels, flights and tickets — one plan for the whole tournament.',
    chips = [
        { icon: 'fas fa-futbol', label: 'Every fixture' },
        { icon: 'fas fa-plane', label: 'Flights & hotels' },
        { icon: 'fas fa-ticket', label: 'Match tickets' },
    ],
    backHref,
    backLabel = 'Home',
    backIcon = 'fas fa-home',
}) {
    const { assetUrl } = usePage().props;
    const logo = `${assetUrl}assets/img/logo/TFE-logo.png`;
    const hero = heroImage || `${assetUrl}assets/img/fan-auth.jpg`;

    return (
        <div className={`tfe-auth${wide ? ' tfe-auth--wide' : ''}`}>
            <Head title={head || title} />
            <Toaster position="top-center" richColors theme="dark" />

            {backHref && (
                <Link href={backHref} className="tfe-auth__back" aria-label={backLabel}>
                    <i className={backIcon} aria-hidden="true"></i>
                    <span>{backLabel}</span>
                </Link>
            )}

            <div className="tfe-auth__grid">
            {/* Left media panel */}
            <aside className="tfe-auth__media" aria-hidden="true">
                <img src={hero} alt="" className="tfe-auth__media-img" loading="eager" fetchpriority="high" />
                <div className="tfe-auth__media-inner">
                    <Link href={route('index')} className="tfe-auth__brand">
                        <img src={logo} alt="The Football Experience" />
                        <span>The Football Experience</span>
                    </Link>

                    <div className="tfe-auth__tagline">
                        <h1>{heroHeadline}</h1>
                        <p>{heroTagline}</p>
                        {chips.length > 0 && (
                            <div className="tfe-auth__chips">
                                {chips.map((chip) => (
                                    <span key={chip.label} className="tfe-auth__chip">
                                        <i className={chip.icon} aria-hidden="true"></i>
                                        {chip.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Right form panel */}
            <main className="tfe-auth__panel">
                <div className="tfe-auth__card">
                    <Link href={route('index')} className="tfe-auth__card-brand">
                        <img src={logo} alt="The Football Experience" />
                        <span style={{ fontWeight: 800 }}>The Football Experience</span>
                    </Link>

                    {title && <h2 className="tfe-auth__title">{title}</h2>}
                    {subtitle && <p className="tfe-auth__subtitle">{subtitle}</p>}

                    {children}
                </div>
            </main>
            </div>
        </div>
    );
}
