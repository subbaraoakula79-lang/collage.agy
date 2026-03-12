import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const paymentId = searchParams.get('payment_id');
    const [status, setStatus] = useState('Verifying payment...');

    useEffect(() => {
        if (!sessionId || !paymentId) {
            setStatus('Invalid session.');
            return;
        }

        const verifyPayment = async () => {
            try {
                await api.post('/payment/verify', {
                    paymentId,
                    sessionId
                });
                setStatus('Payment Verified Successfully! Redirecting to dashboard...');
                setTimeout(() => {
                    navigate('/student'); // Assuming redirect to student dashboard
                }, 3000);
            } catch (err: any) {
                setStatus(err.response?.data?.error || 'Verification failed. Contact support.');
            }
        };

        verifyPayment();
    }, [sessionId, paymentId, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center'
        }}>
            <div className="card animate-fade" style={{ maxWidth: '500px', width: '100%' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                <h2 className="mb-md">Payment Processing</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{status}</p>
                <button className="btn btn-primary mt-lg" onClick={() => navigate('/student')}>
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
}
