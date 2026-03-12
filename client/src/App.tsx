import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef, createContext } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentSuccess from './pages/student/PaymentSuccess';
import PaymentCancel from './pages/student/PaymentCancel';
import Toast from './components/Toast';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified?: boolean;
}

interface ToastMsg {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
    user: User | null;
    setUser: (u: User | null) => void;
    showToast: (message: string, type?: ToastMsg['type']) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const AppContext = createContext<AppContextType>({
    user: null,
    setUser: () => { },
    showToast: () => { },
    theme: 'dark',
    toggleTheme: () => { }
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) return <Navigate to="/login" replace />;

    const user = JSON.parse(stored);
    if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

export default function App() {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });
    const [toasts, setToasts] = useState<ToastMsg[]>([]);
    const toastIdRef = useRef(0);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const showToast = (message: string, type: ToastMsg['type'] = 'info') => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const handleSetUser = (u: User | null) => {
        setUser(u);
        if (u) localStorage.setItem('user', JSON.stringify(u));
        else { localStorage.removeItem('user'); localStorage.removeItem('token'); }
    };

    return (
        <AppContext.Provider value={{ user, setUser: handleSetUser, showToast, theme, toggleTheme }}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    <Route path="/student/*" element={
                        <ProtectedRoute roles={['STUDENT']}>
                            <Routes>
                                <Route path="/" element={<StudentDashboard />} />
                                <Route path="/payment-success" element={<PaymentSuccess />} />
                                <Route path="/payment-cancel" element={<PaymentCancel />} />
                            </Routes>
                        </ProtectedRoute>
                    } />

                    <Route path="/faculty/*" element={
                        <ProtectedRoute roles={['FACULTY']}>
                            <FacultyDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin/*" element={
                        <ProtectedRoute roles={['ADMIN']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/payment-success" element={<ProtectedRoute roles={['STUDENT']}><PaymentSuccess /></ProtectedRoute>} />
                    <Route path="/payment-cancel" element={<ProtectedRoute roles={['STUDENT']}><PaymentCancel /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>

            <div className="toast-container">
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
                ))}
            </div>
        </AppContext.Provider>
    );
}
