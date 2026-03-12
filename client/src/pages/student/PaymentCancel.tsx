import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
    const navigate = useNavigate();

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
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
                <h2 className="mb-md">Payment Cancelled</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    You canceled the checkout process. No charges have been made.
                </p>
                <div className="mt-lg">
                    <button className="btn btn-primary btn-block" onClick={() => navigate('/student')}>
                        Return to Dashboard
                    </button>
                    <button className="btn btn-secondary btn-block mt-sm" onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
