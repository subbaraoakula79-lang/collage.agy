import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../App';
import api from '../api';

export default function LoginPage() {
    const { setUser, showToast } = useContext(AppContext);
    const nav = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
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

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? '⏳ Signing in...' : '🔐 Sign In'}
                    </button>
                </form>

                <div className="auth-links">
                    Don't have an account? <Link to="/register">Register Free</Link>
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        🧪 Test Credentials (Password: Test@123)
                    </p>
                    <div style={{ display: 'grid', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span onClick={() => { setEmail('admin@nap.gov.in'); setPassword('Test@123'); }} style={{ cursor: 'pointer' }}>👨‍💼 Admin: admin@nap.gov.in</span>
                        <span onClick={() => { setEmail('faculty1@nap.gov.in'); setPassword('Test@123'); }} style={{ cursor: 'pointer' }}>🏫 College Admin: faculty1@nap.gov.in</span>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span onClick={() => { setEmail('student1@nap.gov.in'); setPassword('Test@123'); }} style={{ cursor: 'pointer' }}>🎓 Student 1 (UG)</span>
                            <span onClick={() => { setEmail('student2@nap.gov.in'); setPassword('Test@123'); }} style={{ cursor: 'pointer' }}>🎓 Student 2 (UG)</span>
                            <span onClick={() => { setEmail('student3@nap.gov.in'); setPassword('Test@123'); }} style={{ cursor: 'pointer' }}>🎓 Student 3 (PG)</span>
                            <span onClick={() => { setEmail('student4@nap.gov.in'); setPassword('Test@123'); }} style={{ cursor: 'pointer' }}>🎓 Student 4 (PG)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
