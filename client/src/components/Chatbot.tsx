import { useState, useRef, useEffect } from 'react';
import api from '../api';

const LANGUAGES = [
    { code: 'english', label: 'English', emoji: '🇬🇧', desc: 'Chat in English' },
    { code: 'telugu', label: 'తెలుగు', emoji: '🇮🇳', desc: 'తెలుగులో చాట్ చేయండి' },
    { code: 'tenglish', label: 'Tenglish', emoji: '🔤', desc: 'Telugu in English script' },
    { code: 'hindi', label: 'हिन्दी', emoji: '🇮🇳', desc: 'हिंदी में चैट करें' },
];

export default function Chatbot() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState<string | null>(null);
    const messagesEnd = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open && language && messages.length === 0) loadHistory();
    }, [open, language, messages.length]);

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
        if (!input.trim() || !language) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', message: userMsg }]);
        setLoading(true);
        try {
            const { data } = await api.post('/chatbot/message', { message: userMsg, language });
            setMessages(prev => [...prev, { role: 'assistant', message: data.response, provider: data.provider }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', message: 'Sorry, I couldn\'t process that. Please try again.' }]);
        } finally { setLoading(false); }
    };

    const changeLanguage = () => {
        setLanguage(null);
    };

    const selectedLang = LANGUAGES.find(l => l.code === language);

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
                                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '1px' }}>
                                    {selectedLang ? `${selectedLang.emoji} ${selectedLang.label}` : 'Nap support is online'}
                                </p>
                            </div>
                        </div>
                        <div className="flex align-center gap-sm">
                            {language && (
                                <button className="icon-btn" onClick={changeLanguage} title="Change Language" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                                    🌐
                                </button>
                            )}
                            <button className="icon-btn" onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.5)' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </div>

                    {/* Language Selection Screen */}
                    {!language ? (
                        <div className="chatbot-messages" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🌐</div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Choose Your Language</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select a language to start chatting</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '300px' }}>
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                            padding: '16px 10px', border: '2px solid var(--border)', borderRadius: '14px',
                                            background: 'var(--bg-glass)', cursor: 'pointer', transition: 'all 0.2s ease',
                                            color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-glass, rgba(99,102,241,0.1))'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    >
                                        <span style={{ fontSize: '1.8rem' }}>{lang.emoji}</span>
                                        <span>{lang.label}</span>
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>{lang.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="chatbot-messages">
                                {messages.length === 0 && (
                                    <div className="chatbot-welcome">
                                        <div className="welcome-icon">✨</div>
                                        <h3>{language === 'telugu' ? 'నేను మీకు ఎలా సహాయం చేయగలను?' : language === 'hindi' ? 'मैं आपकी कैसे मदद कर सकता/सकती हूँ?' : language === 'tenglish' ? 'Meeku ela help cheyagalanu?' : 'How can I help you today?'}</h3>
                                        <p>{language === 'telugu' ? 'ప్రవేశాలు, అర్హత, స్కాలర్‌షిప్ ప్రశ్నలకు సహాయం చేస్తాను.' : language === 'hindi' ? 'मैं प्रवेश, पात्रता और छात्रवृत्ति से जुड़े प्रश्नों में सहायता कर सकता/सकती हूँ।' : language === 'tenglish' ? 'Admissions, eligibility, scholarship queries lo help chesta.' : 'I can assist with admissions, eligibility, and scholarship queries.'}</p>
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
                                    placeholder={language === 'telugu' ? 'మీ ప్రశ్న టైప్ చేయండి...' : language === 'hindi' ? 'अपना सवाल टाइप करें...' : language === 'tenglish' ? 'Mee question type cheyandi...' : 'Type your question...'}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                />
                                <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
