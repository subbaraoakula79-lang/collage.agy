import { useState, useEffect } from 'react';
import api from '../api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsModal({ onClose }: { onClose: () => void }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        api.get('/student/notifications').then(res => setNotifications(res.data));
    }, []);

    const markAllAsRead = () => {
        api.post('/student/notifications/read').then(() => {
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-fade" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', marginLeft: 'auto', marginRight: '20px', marginTop: '70px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="flex-between mb-md">
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>🔔 Notifications</h2>
                    <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>Mark all read</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No notifications yet.</p>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} style={{
                                padding: '12px',
                                borderBottom: '1px solid var(--border)',
                                background: n.isRead ? 'transparent' : 'var(--bg-glass)',
                                opacity: n.isRead ? 0.7 : 1
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>
                                        {n.type === 'SUCCESS' ? '✅' : n.type === 'WARNING' ? '⚠️' : n.type === 'PAYMENT' ? '💳' : 'ℹ️'}
                                    </span>
                                    <strong style={{ fontSize: '0.9rem' }}>{n.title}</strong>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 4px 34px' }}>
                                    {n.message}
                                </p>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
