import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../App';
import api from '../api';

export default function LoginPage() {
    const { setUser, showToast } = useContext(AppContext);
    const nav = useNavigate();
    const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);

            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            setUser(data.user);
            showToast(`Welcome back, ${data.user.name}!`, 'success');

            if (data.user.role === 'STUDENT') nav('/student');
            else if (data.user.role === 'FACULTY') nav('/faculty');
            else if (data.user.role === 'ADMIN') nav('/admin');
        } catch (err: any) {
            setPassword(''); // Only wipe password
            showToast(err.response?.data?.error || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (e: string, p: string) => {
        setEmail(e);
        setPassword(p);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="text-center mb-lg">
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎓</div>
                    <h1>Welcome Back</h1>
                    <p className="subtitle">Sign in to your admission portal</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value.toLowerCase())} required />
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Forgot Password?</Link>
                        </div>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: '46px' }}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>
                    <div className="remember-me-container">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                            />
                            <span>Remember me</span>
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? '⏳ Signing in...' : '🔐 Sign In'}
                    </button>
                </form>

                <div className="auth-links">
                    Don't have an account? <Link to="/register" style={{ fontWeight: '600', color: 'var(--primary-light)' }}>Register Free</Link>
                </div>

                <div className="quick-login-section">
                    <div className="quick-login-title">
                        <span>🧪 Quick Access (Development)</span>
                    </div>
                    <div className="quick-login-grid">
                        <button className="quick-login-btn" onClick={() => quickLogin('admin@nap.gov.in', 'Test@123')}>
                            <span className="quick-login-role">👨‍💼 Admin</span>
                            <span className="quick-login-email">admin@nap.gov.in</span>
                        </button>
                        <button className="quick-login-btn" onClick={() => quickLogin('faculty1@nap.gov.in', 'Test@123')}>
                            <span className="quick-login-role">🏫 Faculty</span>
                            <span className="quick-login-email">faculty1@nap...</span>
                        </button>
                        <button className="quick-login-btn" onClick={() => quickLogin('student1@nap.gov.in', 'Test@123')}>
                            <span className="quick-login-role">🎓 Student (UG)</span>
                            <span className="quick-login-email">student1@nap...</span>
                        </button>
                        <button className="quick-login-btn" onClick={() => quickLogin('student3@nap.gov.in', 'Test@123')}>
                            <span className="quick-login-role">🎓 Student (PG)</span>
                            <span className="quick-login-email">student3@nap...</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
