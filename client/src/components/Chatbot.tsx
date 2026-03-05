import { useState, useRef, useEffect } from 'react';
import api from '../api';

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && messages.length === 0) loadHistory();
    }, [open, messages.length]);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadHistory = async () => {
        try {
            const { data } = await api.get('/chatbot/history');
            setMessages(data);
        } catch { }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', message: userMsg }]);
        setLoading(true);
        try {
            const { data } = await api.post('/chatbot/message', { message: userMsg });
            setMessages(prev => [...prev, { role: 'assistant', message: data.response, provider: data.provider }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', message: 'Sorry, I couldn\'t process that. Please try again.' }]);
        } finally { setLoading(false); }
    };

    return (
        <>
            <button className="chatbot-toggle" onClick={() => setOpen(!open)} title="AI Assistant">
                {open ? '✕' : '🤖'}
            </button>

            {open && (
                <div className="chatbot-panel">
                    <div className="chatbot-header">
                        <div>
                            <strong style={{ fontSize: '0.95rem' }}>🤖 AI Counselor</strong>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Ask about admissions, eligibility & more</p>
                        </div>
                        <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <p>👋 Hi! I can help with:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
                                    {['Eligibility', 'Reservation', 'Courses', 'Payments', 'Scholarships'].map(t => (
                                        <button key={t} className="btn btn-secondary btn-sm" onClick={() => { setInput(`Tell me about ${t.toLowerCase()}`); }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((m: any, i: number) => (
                            <div key={i} className={`chat-msg ${m.role}`}>
                                {m.message}
                                {m.provider && <span className="provider-tag">via {m.provider}</span>}
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-msg assistant" style={{ opacity: 0.6 }}>
                                <span style={{ animation: 'pulse 1s infinite' }}>Thinking...</span>
                            </div>
                        )}
                        <div ref={messagesEnd} />
                    </div>

                    <div className="chatbot-input">
                        <input placeholder="Ask anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                        <button onClick={sendMessage} disabled={!input.trim() || loading}>→</button>
                    </div>
                </div>
            )}
        </>
    );
}
