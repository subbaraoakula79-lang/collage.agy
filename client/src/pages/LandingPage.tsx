import { useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { AppContext } from '../App';

export default function LandingPage() {
    const nav = useNavigate();
    const { theme, toggleTheme } = useContext(AppContext);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else {
                    entry.target.classList.remove('is-visible');
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll('.scroll-animate');
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-page">
            {/* Background Decorations */}
            <div className="bg-decorations">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Navbar */}
            <nav className="navbar" style={{ background: 'transparent', borderBottom: 'none' }}>
                <div className="navbar-brand">
                    <div className="logo">🎓</div>
                    <span>NAP</span>
                </div>
                <div className="navbar-right">
                    <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ padding: '6px' }}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => nav('/login')}>Login</button>
                    <button className="btn btn-primary btn-sm" onClick={() => nav('/register')}>Register</button>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero">
                <div className="hero-content">

                    <h1>
                        <span className="typewriter-text line-1">Your Future Starts</span><br />
                        <span className="typewriter-text line-2">with <span className="gradient-text">Smart Admissions</span></span>
                    </h1>
                    <p className="scroll-animate hero-text-animate">
                        India's most advanced admission platform. Apply for UG & PG courses
                        across Andhra Pradesh with AI-powered guidance, transparent seat allocation,
                        and zero application fees.
                    </p>
                    <div className="hero-actions scroll-animate hero-actions-animate">
                        <button className="btn btn-primary btn-lg" onClick={() => nav('/register')}>
                            🚀 Apply Now
                        </button>
                        <button className="btn btn-secondary btn-lg" onClick={() => nav('/login')}>
                            Sign In
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <div className="stats-banner scroll-animate stats-banner-animate">
                <div className="stat">
                    <div className="stat-number">10L+</div>
                    <div className="stat-desc">Students Supported</div>
                </div>
                <div className="stat">
                    <div className="stat-number">500+</div>
                    <div className="stat-desc">Colleges</div>
                </div>
                <div className="stat">
                    <div className="stat-number">₹0</div>
                    <div className="stat-desc">Application Fee</div>
                </div>
                <div className="stat">
                    <div className="stat-number">4</div>
                    <div className="stat-desc">Admission Types</div>
                </div>
            </div>

            {/* Features */}
            <section className="features-section">
                <h2 className="section-title scroll-animate">Why Choose <span className="gradient-text">NAP?</span></h2>
                <p className="section-subtitle scroll-animate">Everything you need for a seamless admission experience</p>

                <div className="features-grid scroll-animate features-grid-animate">
                    <div className="feature-card">
                        <span className="feature-icon">🔐</span>
                        <h3>DigiLocker Integration</h3>
                        <p>Auto-fetch your SSC, Intermediate & UG certificates directly. No manual uploads needed.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🤖</span>
                        <h3>AI Counselor</h3>
                        <p>Get instant answers about eligibility, courses, reservations & scholarships from our AI chatbot.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">⚖️</span>
                        <h3>Fair Reservation System</h3>
                        <p>Transparent merit + caste-based reservation. General, OBC, SC, ST & EWS categories supported.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🔄</span>
                        <h3>Multi-Round Allotment</h3>
                        <p>Up to 3 rounds. Accept, Freeze or Wait for upgrades. You stay in control of your preferences.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">💳</span>
                        <h3>Secure Payments</h3>
                        <p>Pay college fees via UPI, Cards, or Net Banking. Installment options available. Zero application fees.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">📱</span>
                        <h3>Works Everywhere</h3>
                        <p>Fully responsive. Apply from your phone, tablet or laptop with equal ease.</p>
                    </div>
                </div>
            </section>

            {/* Admission Types */}
            <section className="features-section">
                <h2 className="section-title scroll-animate">Admission Types</h2>
                <p className="section-subtitle scroll-animate">Choose your pathway</p>

                <div className="admission-types scroll-animate admission-types-animate">
                    <div className="admission-card" onClick={() => nav('/register')}>
                        <div className="type-icon">🎓</div>
                        <h3>Undergraduate (UG)</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>B.Sc, B.Com, BBA & More</p>
                        <div className="badge badge-success mt-md">Open</div>
                    </div>
                    <div className="admission-card" onClick={() => nav('/register')}>
                        <div className="type-icon">🏆</div>
                        <h3>Postgraduate (PG)</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>M.Sc, MBA & More</p>
                        <div className="badge badge-success mt-md">Open</div>
                    </div>
                    <div className="admission-card disabled">
                        <div className="coming-soon-tag">Coming Soon</div>
                        <div className="type-icon">⚙️</div>
                        <h3>Engineering</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>B.Tech & M.Tech</p>
                        <div className="badge badge-warning mt-md">Coming Soon</div>
                    </div>
                    <div className="admission-card disabled">
                        <div className="coming-soon-tag">Coming Soon</div>
                        <div className="type-icon">🔧</div>
                        <h3>Diploma</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Polytechnic & ITI</p>
                        <div className="badge badge-warning mt-md">Coming Soon</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: 'var(--bg-card)', padding: 'var(--space-2xl) var(--space-xl)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                <div className="logo mb-md" style={{ margin: '0 auto', width: 48, height: 48, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎓</div>
                <p>© {new Date().getFullYear()} National Admission Portal — Government of Andhra Pradesh</p>
                <p style={{ marginTop: '8px' }}>Made with ❤️ for Indian Students</p>
            </footer>
        </div>
    );
}
