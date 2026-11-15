import { Link, usePage } from '@inertiajs/react';
import { useTournament } from '@/Context/TournamentContext';
import assetPath from '@/lib/assets';
import '../../css/footer.css';

/**
 * The site footer: every public page, and (Nov 2026) the end of every
 * dashboard page too (BaseLayout). Signed in, its last row offers the
 * dashboard and Log out instead of Sign In / Sign Up.
 */
export default function Footer() {
    const { tournament } = useTournament();
    const { assetUrl, auth } = usePage().props;
    const user = auth?.user;
    const dashboardRoute = user?.is_admin ? 'admin.dashboard' : user?.is_partner ? 'partner.dashboard'
        : user?.account_type === 'institution' ? 'institution.dashboard' : 'fan.dashboard';
    const journeyLabel = tournament ? (tournament.short_name || tournament.name) : 'tournament';
    const wordmark = 'The Football Experience';
    const okjLogo = assetPath(`${assetUrl || ''}assets/partner-logos/OKJTechLogo-White_Transparent.png`);
    const year = new Date().getFullYear();

    const socials = [
        { icon: 'fab fa-instagram', label: 'Instagram', href: 'https://instagram.com' },
        { icon: 'fab fa-twitter', label: 'Twitter / X', href: 'https://twitter.com' },
        { icon: 'fab fa-youtube', label: 'YouTube', href: 'https://youtube.com' },
        { icon: 'fab fa-tiktok', label: 'TikTok', href: 'https://tiktok.com' },
    ];

    return (
        <footer className="tfe-footer">
            <div className="container">
                <div className="tfe-footer__top">
                    <div className="tfe-footer__cta">
                        <h2>Let's build your <span>matchday.</span></h2>
                        <p>
                            Plan every fixture, stay, flight and ticket in one place — and go to the {journeyLabel}
                            {' '}with the fans who live for the game.
                        </p>
                        <a href="mailto:info@wctfe.com" className="tfe-footer__getintouch">
                            Get in touch
                            <i className="fas fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>

                    <div className="tfe-footer__cols">
                        <div className="tfe-footer__col">
                            <h4>Contact</h4>
                            <ul>
                                <li><a href="mailto:info@wctfe.com"><i className="fas fa-envelope"></i> info@wctfe.com</a></li>
                                <li><a href="tel:+254799711789"><i className="fas fa-phone"></i> +254 799 711 789</a></li>
                                <li><span className="tfe-footer__static"><i className="fas fa-location-dot"></i> Nairobi · Kenya</span></li>
                            </ul>
                        </div>

                        <div className="tfe-footer__col">
                            <h4>Explore</h4>
                            <ul>
                                {/* Each its own page: the old /#about anchors pointed
                                    at landing sections that moved to these. */}
                                <li><Link href={route('about')}>About</Link></li>
                                <li><Link href={route('features')}>Features</Link></li>
                                <li><Link href={route('services')}>Services</Link></li>
                                <li><Link href={route('partners.index')}>Partners</Link></li>
                                <li><Link href={route('news')}>News</Link></li>
                                <li><Link href={route('learn.index')}>Learn</Link></li>
                            </ul>
                        </div>

                        <div className="tfe-footer__col">
                            <h4>Social</h4>
                            <ul>
                                {socials.map((s) => (
                                    <li key={s.label}>
                                        <a href={s.href} target="_blank" rel="noopener noreferrer">
                                            <i className={s.icon}></i> {s.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="tfe-footer__divider"></div>

                <div className="tfe-footer__meta">
                    <span>© The Football Experience {year}</span>
                    <span className="tfe-footer__engineered">
                        engineered by
                        <a href="https://okjtech.co.ke" target="_blank" rel="noopener noreferrer">
                            <img src={okjLogo} alt="OKJ Technologies" className="tfe-footer__okj" />
                        </a>
                    </span>
                    {user ? (
                        <span>
                            <Link href={route(dashboardRoute)} className="text-white-50 text-decoration-none">Dashboard</Link>
                            {'  ·  '}
                            <Link href={route('logout')} method="post" as="button" className="tfe-footer__linkbtn text-white-50 text-decoration-none">Log out</Link>
                        </span>
                    ) : (
                        <span>
                            <Link href={route('login')} className="text-white-50 text-decoration-none">Sign In</Link>
                            {'  ·  '}
                            <Link href={route('register')} className="text-white-50 text-decoration-none">Sign Up</Link>
                        </span>
                    )}
                </div>
            </div>

            <div className="tfe-footer__wordmark" aria-hidden="true">
                <span>{wordmark}</span>
            </div>
        </footer>
    );
}
