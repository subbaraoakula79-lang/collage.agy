import { useState } from 'react';
import api from '../api';

interface PaymentModalProps {
    allotment: any;
    onSuccess: (data: any) => void;
    onClose: () => void;
}

export default function PaymentModal({ allotment, onSuccess, onClose }: PaymentModalProps) {
    const [step, setStep] = useState(1); // 1: Select, 2: Process, 3: Success
    const [method, setMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const [receiptInfo, setReceiptInfo] = useState<any>(null);

    const handlePayment = async (selectedMethod: string) => {
        setMethod(selectedMethod);
        setStep(2);
        setLoading(true);

        try {
            // Step 1: Initiate
            const { data: initData } = await api.post('/payment/initiate', {
                allotmentId: allotment.id,
                method: selectedMethod
            });

            // Mock delay for "Security verification..."
            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Verify
            const { data: verifyData } = await api.post('/payment/verify', {
                paymentId: initData.payment.id
            });

            setReceiptInfo(verifyData);
            setStep(3);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Payment failed');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-fade" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                {step === 1 && (
                    <>
                        <h2 className="mb-md">💳 Secure Payment</h2>
                        <p className="mb-lg" style={{ color: 'var(--text-secondary)' }}>
                            Fee for <strong>{allotment.course?.name}</strong>: <br />
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>₹{allotment.course?.totalFee?.toLocaleString()}</span>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn btn-secondary btn-block flex-between" onClick={() => handlePayment('PHONEPE')}>
                                <span>📱 PhonePe</span> ➔
                            </button>
                            <button className="btn btn-secondary btn-block flex-between" onClick={() => handlePayment('GPAY')}>
                                <span>📱 Google Pay</span> ➔
                            </button>
                            <button className="btn btn-secondary btn-block flex-between" onClick={() => handlePayment('UPI')}>
                                <span>🆔 UPI ID</span> ➔
                            </button>
                            <button className="btn btn-secondary btn-block flex-between" onClick={() => handlePayment('NET_BANKING')}>
                                <span>🏦 Net Banking</span> ➔
                            </button>
                        </div>

                        <button className="btn btn-text btn-block mt-md" onClick={onClose}>Cancel</button>
                    </>
                )}

                {step === 2 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div className="spinner mb-lg" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
                        <h3>Security Verification...</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Connecting securely to {method === 'NET_BANKING' ? 'your bank' : 'UPI gateway'}...</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '20px', color: 'var(--text-muted)' }}>🔒 SSL 256-bit Encrypted</p>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                        <h2 className="mb-sm">Payment Successful!</h2>
                        <p className="mb-lg" style={{ color: 'var(--text-secondary)' }}>
                            Your seat in {allotment.course?.name} is confirmed.
                        </p>
                        <div className="card mb-lg" style={{ background: 'var(--bg-glass)', border: '1px solid var(--success)' }}>
                            <div className="flex-between mb-sm"><span style={{ color: 'var(--text-muted)' }}>Receipt No:</span> <strong>{receiptInfo?.receipt}</strong></div>
                            <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span> <strong>{receiptInfo?.transactionId}</strong></div>
                        </div>
                        <button className="btn btn-primary btn-block" onClick={() => { onSuccess(receiptInfo); onClose(); }}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}
