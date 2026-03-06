import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../App';
import api from '../api';

export default function RegisterPage() {
    const { setUser, showToast } = useContext(AppContext);
    const nav = useNavigate();
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'STUDENT' });
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [savedOtp, setSavedOtp] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', form);
            if (data.otp) setSavedOtp(data.otp);
            showToast('Registration successful! Enter the OTP.', 'success');
            setStep('otp');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/verify-otp', { email: form.email, otp });
            localStorage.setItem('token', data.token);
            setUser(data.user);
            showToast('Account verified! Welcome!', 'success');

            if (data.user.role === 'STUDENT') nav('/student');
            else if (data.user.role === 'FACULTY') nav('/faculty');
            else if (data.user.role === 'ADMIN') nav('/admin');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'OTP verification failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="text-center mb-lg">
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚀</div>
                    <h1>{step === 'form' ? 'Create Account' : 'Verify OTP'}</h1>
                    <p className="subtitle">
                        {step === 'form' ? 'Join the National Admission Portal' : `OTP sent to ${form.email}`}
                    </p>
                </div>

                {step === 'form' ? (
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-input" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" placeholder="10-digit mobile" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={10} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Register As</label>
                            <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="STUDENT">Student</option>
                                <option value="FACULTY">College Admin</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                            {loading ? '⏳ Creating...' : '🎓 Register'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        {savedOtp && (
                            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem', color: '#34d399', textAlign: 'center' }}>
                                🧪 Mock OTP: <strong>{savedOtp}</strong>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Enter 6-digit OTP</label>
                            <input className="form-input" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6} />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || otp.length < 6}>
                            {loading ? '⏳ Verifying...' : '✓ Verify & Continue'}
                        </button>
                    </form>
                )}

                <div className="auth-links">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
