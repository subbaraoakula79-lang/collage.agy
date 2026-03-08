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
        <div className="chatbot-wrapper" style={{ zIndex: 10000 }}>
            <button className={`chatbot-toggle ${open ? 'active' : ''}`} onClick={() => setOpen(!open)} title="AI Counselor">
                {open ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8" />
                        <rect width="16" height="12" x="4" y="8" rx="2" />
                        <path d="M2 14h2" />
                        <path d="M20 14h2" />
                        <path d="M15 13v2" />
                        <path d="M9 13v2" />
                    </svg>

                )}
            </button>

            {open && (
                <div className="chatbot-panel animate-slide-up">
                    <div className="chatbot-header">
                        <div className="flex align-center gap-sm">
                            <div className="ai-status-dot"></div>
                            <div>
                                <strong style={{ fontSize: '0.95rem', color: 'white' }}>AI Counselor</strong>
                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>Nap support is online</p>
                            </div>
                        </div>
                        <button className="icon-btn" onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.5)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.length === 0 && (
                            <div className="chatbot-welcome">
                                <div className="welcome-icon">✨</div>
                                <h3>How can I help you today?</h3>
                                <p>I can assist with admissions, eligibility, and scholarship queries.</p>
                                <div className="welcome-chips">
                                    {['Eligibility', 'Reservation', 'Payments', 'Scholarships'].map(t => (
                                        <button key={t} className="chip" onClick={() => setInput(`Tell me about ${t.toLowerCase()}`)}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((m: any, i: number) => (
                            <div key={i} className={`chat-msg ${m.role} animate-fade-in`}>
                                <div className="msg-content">{m.message}</div>
                                {m.provider && <span className="provider-tag">{m.provider} AI</span>}
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-msg assistant typing">
                                <div className="typing-dots"><span></span><span></span><span></span></div>
                            </div>
                        )}
                        <div ref={messagesEnd} />
                    </div>

                    <div className="chatbot-input">
                        <input
                            placeholder="Type your question..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        />
                        <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
