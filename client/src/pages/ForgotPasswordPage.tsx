import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../App';
import api from '../api';

export default function ForgotPasswordPage() {
    const { showToast } = useContext(AppContext);
    const nav = useNavigate();
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [savedOtp, setSavedOtp] = useState('');

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            if (data.otp) setSavedOtp(data.otp);
            showToast(data.message, 'success');
            setStep('reset');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to request reset code', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
            showToast(data.message, 'success');
            nav('/login');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Password reset failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="text-center mb-lg">
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔐</div>
                    <h1>{step === 'email' ? 'Reset Password' : 'Set New Password'}</h1>
                    <p className="subtitle">
                        {step === 'email' ? 'Enter your email to receive a reset code' : `We sent a code to ${email}`}
                    </p>
                </div>

                {step === 'email' ? (
                    <form onSubmit={handleRequestOtp}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value.toLowerCase())}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                            {loading ? '⏳ Processing...' : 'Get Reset Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        {savedOtp && (
                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem', color: '#34d399', textAlign: 'center' }}>
                                🧪 Reset OTP: <strong>{savedOtp}</strong>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Reset Code</label>
                            <input
                                className="form-input"
                                style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 600 }}
                                placeholder="000000"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Min. 6 characters"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || otp.length < 6}>
                            {loading ? '⏳ Resetting...' : '✓ Reset Password'}
                        </button>

                        <button type="button" className="btn btn-light btn-block" style={{ marginTop: '12px' }} onClick={() => setStep('email')}>
                            ← Back to Email
                        </button>
                    </form>
                )}

                <div className="auth-links">
                    Remembered your password? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
