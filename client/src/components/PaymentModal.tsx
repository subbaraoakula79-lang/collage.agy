import { useState } from 'react';
import api from '../api';
import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

interface PaymentModalProps {
    allotment: any;
    onClose: () => void;
}

export default function PaymentModal({ allotment, onClose }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Step 1: Initiate Payment on our backend
            const { data: initData } = await api.post('/payment/initiate', {
                allotmentId: allotment.id,
                method: 'CARD'
            });

            // Step 2: Redirect to Stripe Checkout
            const stripe = await stripePromise;
            if (stripe && initData.sessionId) {
                // @ts-ignore
                const result = await stripe.redirectToCheckout({
                    sessionId: initData.sessionId
                });
                if (result?.error) {
                    alert(result.error.message);
                }
            } else if (initData.checkoutUrl) {
                // Fallback direct URL redirect
                window.location.href = initData.checkoutUrl;
            } else {
                alert('Failed to initialize Stripe checkout');
            }

        } catch (err: any) {
            alert(err.response?.data?.error || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-fade" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <h2 className="mb-md">💳 Secure Payment</h2>
                <p className="mb-lg" style={{ color: 'var(--text-secondary)' }}>
                    Fee for <strong>{allotment.course?.name}</strong>: <br />
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>₹{allotment.course?.totalFee?.toLocaleString()}</span>
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="btn btn-primary btn-block flex-between" onClick={handlePayment} disabled={loading}>
                        <span>{loading ? '⏳ Preparing Checkout...' : '💳 Pay with Stripe'}</span> ➔
                    </button>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔒 SSL 256-bit Encrypted. Powered by Stripe.</p>
                </div>

                <button className="btn btn-text btn-block mt-md" onClick={onClose} disabled={loading}>Cancel</button>
            </div>
        </div>
    );
}
