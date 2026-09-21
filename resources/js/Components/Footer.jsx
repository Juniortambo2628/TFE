import { Link } from '@inertiajs/react';
import { useTournament } from '@/Context/TournamentContext';
import '../../css/footer.css';

export default function Footer() {
    const { tournament } = useTournament();
    const journeyLabel = tournament ? (tournament.short_name || tournament.name) : 'tournament';
    const wordmark = tournament ? (tournament.short_name || tournament.name) : 'The Football Experience';
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
                                <li><a href="/#about">About</a></li>
                                <li><a href="/#features">Features</a></li>
                                <li><a href="/#services">Services</a></li>
                                <li><Link href={route('partners.index')}>Partners</Link></li>
                                <li><a href="/#news">News</a></li>
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
                    <span className="tfe-footer__love"><i className="fas fa-heart"></i> Made for the fans</span>
                    <span>
                        <Link href={route('login')} className="text-white-50 text-decoration-none">Sign In</Link>
                        {'  ·  '}
                        <Link href={route('register')} className="text-white-50 text-decoration-none">Sign Up</Link>
                    </span>
                </div>
            </div>

            <div className="tfe-footer__wordmark" aria-hidden="true">
                <span>{wordmark}</span>
            </div>
        </footer>
    );
}
