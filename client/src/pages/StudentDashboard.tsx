import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import api from '../api';
import Chatbot from '../components/Chatbot';
import NotificationsModal from '../components/NotificationsModal';
import PaymentModal from '../components/PaymentModal';

export default function StudentDashboard() {
    const { user, setUser, showToast, theme, toggleTheme } = useContext(AppContext);
    const nav = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [allCourses, setAllCourses] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [allotments, setAllotments] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [view, setView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Onboarding
    const [digiStep, setDigiStep] = useState(0);
    const [digiSession, setDigiSession] = useState<any>(null);
    const [mobile, setMobile] = useState('');
    const [pin, setPin] = useState('');
    const [otp, setOtp] = useState('');
    const [manualDocs, setManualDocs] = useState<Record<string, boolean>>({});
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [paymentAllotment, setPaymentAllotment] = useState<any>(null);
    const [printAllotment, setPrintAllotment] = useState<any>(null);
    const [printApplication, setPrintApplication] = useState<boolean>(false);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if ((printAllotment || printApplication) && profile) {
            const timer = setTimeout(() => window.print(), 500); // Wait for React to paint
            const afterPrint = () => { setPrintAllotment(null); setPrintApplication(false); };
            window.addEventListener('afterprint', afterPrint);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('afterprint', afterPrint);
            };
        }
    }, [printAllotment, printApplication, profile]);

    const loadData = async () => {
        try {
            const { data } = await api.get('/student/onboarding-status');
            setProfile(data);
            if (data.onboardingStep === 'COMPLETE') {
                const [appRes, allRes, payRes] = await Promise.all([
                    api.get('/student/applications').catch(() => ({ data: [] })),
                    api.get('/student/allotments').catch(() => ({ data: [] })),
                    api.get('/student/payments').catch(() => ({ data: [] }))
                ]);
                setApplications(appRes.data);
                setAllotments(allRes.data);
                setPayments(payRes.data);
            } else if (data.onboardingStep === 'DOCS_SUBMITTED') {
                loadCourses(data.admissionType);
            }
        } catch { showToast('Failed to load profile', 'error'); }
    };

    const setAdmissionType = async (type: string) => {
        setLoading(true);
        try {
            const { data } = await api.post('/student/set-admission-type', { admissionType: type });
            showToast('Admission type saved', 'success');
            setProfile((p: any) => ({ ...p, admissionType: type, onboardingStep: data.onboardingStep }));
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
        finally { setLoading(false); }
    };

    const initiateDigiLocker = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/digilocker/initiate', { mobile });
            setDigiSession(data);
            setDigiStep(2);
            showToast(`Name matched: ${data.maskedName}. Enter PIN.`, 'info');
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
        finally { setLoading(false); }
    };

    const verifyPin = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/digilocker/verify-pin', { sessionId: digiSession.sessionId, pin });
            if (data.needOTP) { setDigiStep(3); showToast('PIN failed, enter OTP (mock: 123456)', 'warning'); }
            else { setDigiStep(4); showToast('DigiLocker verified!', 'success'); await loadData(); }
        } catch (err: any) { showToast(err.response?.data?.error || 'PIN failed', 'error'); }
        finally { setLoading(false); }
    };

    const verifyOtp = async () => {
        setLoading(true);
        try {
            await api.post('/digilocker/verify-otp', { sessionId: digiSession.sessionId, otp });
            setDigiStep(4); showToast('DigiLocker verified!', 'success'); await loadData();
        } catch (err: any) { showToast(err.response?.data?.error || 'OTP failed', 'error'); }
        finally { setLoading(false); }
    };

    const submitDocuments = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/student/submit-documents', { manualDocs });
            showToast('Documents confirmed', 'success');
            setProfile((p: any) => ({ ...p, onboardingStep: data.onboardingStep }));
            loadCourses(profile.admissionType);
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
        finally { setLoading(false); }
    };

    const loadCourses = async (type: string) => {
        try {
            const { data } = await api.get(`/student/courses?admissionType=${type}`);
            setAllCourses(data);
        } catch { showToast('Failed to load courses', 'error'); }
    };

    const toggleCourseSelection = (courseId: string) => {
        if (selectedCourses.includes(courseId)) {
            setSelectedCourses(selectedCourses.filter(id => id !== courseId));
        } else {
            if (selectedCourses.length >= 5) return showToast('Maximum 5 courses allowed', 'warning');
            setSelectedCourses([...selectedCourses, courseId]);
        }
    };

    const submitApplication = async () => {
        if (selectedCourses.length < 3) return showToast('Select at least 3 courses', 'warning');
        setLoading(true);
        try {
            await api.post('/student/apply', { courseIds: selectedCourses, admissionType: profile.admissionType });
            showToast('Application submitted successfully!', 'success');
            await loadData();
        } catch (err: any) { showToast(err.response?.data?.error || 'Application failed', 'error'); }
        finally { setLoading(false); }
    };

    const respondToAllotment = async (id: string, action: string) => {
        try {
            await api.post(`/student/allotment/${id}/respond`, { action });
            showToast(`Seat ${action.toLowerCase()}!`, 'success'); loadData();
        } catch (err: any) { showToast(err.response?.data?.error || 'Action failed', 'error'); }
    };

    const initiatePayment = (allotment: any) => {
        setPaymentAllotment(allotment);
    };

    const handlePrintApplication = (allotment: any) => {
        setPrintAllotment(allotment);
    };

    const logout = () => { setUser(null); nav('/'); };

    const menu = [
        { icon: '📊', label: 'Dashboard', key: 'dashboard' },
        { icon: '📋', label: 'Application Form', key: 'form' },
        { icon: '📝', label: 'My Applications', key: 'applications' },
        { icon: '🎯', label: 'Allotments', key: 'allotments' },
        { icon: '💳', label: 'Payments', key: 'payments' },
    ];

    if (!profile) return <div className="loading-page"><div className="spinner"></div><p>Loading your profile...</p></div>;

    // Mock document list
    const mockDocuments = [
        { key: 'aadhaar', label: 'Aadhaar Card', icon: '🪪', status: profile.aadhaarEncrypted ? 'Verified' : 'Required' },
        { key: 'ssc', label: 'SSC Marks Memo', icon: '📜', status: profile.sscDocStatus },
        { key: 'inter', label: 'Intermediate Marks Memo', icon: '📜', status: profile.interDocStatus },
        ...(profile.admissionType === 'PG' ? [{ key: 'ug', label: 'UG Degree Certificate', icon: '🎓', status: profile.ugDocStatus }] : []),
        { key: 'caste', label: 'Caste Certificate', icon: '🏷️', status: profile.category !== 'GENERAL' ? (profile.casteDocStatus || 'Required') : 'N/A' },
        { key: 'income', label: 'Income Certificate', icon: '💰', status: profile.incomeDocStatus || 'Required' },
        { key: 'photo', label: 'Passport Size Photo', icon: '📸', status: 'Mock Uploaded' },
        { key: 'passbook', label: "Mother's Bank Passbook", icon: '🏦', status: 'Mock Uploaded' },
    ];

    // PROGRESS BAR
    const steps = ['REGISTERED', 'TYPE_SELECTED', 'DIGILOCKER_DONE', 'DOCS_SUBMITTED', 'COMPLETE'];
    const stepLabels = ['Register', 'Admission Type', 'DigiLocker', 'Documents', 'Apply'];
    const stepIcons = ['📝', '🎯', '🔐', '📄', '🚀'];
    const currentStepIndex = steps.indexOf(profile.onboardingStep);
    const progressPercent = Math.round((currentStepIndex / (steps.length - 1)) * 100);

    const ProgressBar = () => (
        <div className="card mb-xl" style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(20px)' }}>
            <div className="flex-between mb-md">
                <h3 style={{ margin: 0 }}>📈 Application Progress</h3>
                <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>{progressPercent}% Complete</span>
            </div>
            {/* Progress bar */}
            <div style={{ background: 'var(--bg-darker)', borderRadius: '12px', height: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', borderRadius: '12px', transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                {stepLabels.map((label, i) => (
                    <div key={i} style={{ textAlign: 'center', flex: 1, opacity: i <= currentStepIndex ? 1 : 0.4 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px',
                            background: i < currentStepIndex ? 'var(--success)' : i === currentStepIndex ? 'var(--primary)' : 'var(--bg-darker)',
                            color: i <= currentStepIndex ? 'white' : 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold',
                            border: i === currentStepIndex ? '2px solid var(--primary-light)' : 'none', boxShadow: i === currentStepIndex ? '0 0 12px var(--primary)' : 'none'
                        }}>
                            {i < currentStepIndex ? '✓' : stepIcons[i]}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: i <= currentStepIndex ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    // WIZARD (not complete)
    if (profile.onboardingStep !== 'COMPLETE') {
        const step = profile.onboardingStep;
        return (
            <div className="app-layout">
                <nav className="navbar">
                    <div className="navbar-brand"><div className="logo">🎓</div><span>NAP Student</span></div>
                    <div className="navbar-right">
                        <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ padding: '6px', marginRight: '8px' }}>{theme === 'light' ? '🌙' : '☀️'}</button>
                        <span className="role-badge student">Student</span>
                        <div className="navbar-user"><div className="user-avatar">{user?.name?.[0]}</div><span style={{ fontSize: '0.85rem' }}>{user?.name}</span></div>
                        <button className="btn btn-secondary btn-sm" onClick={logout} style={{ padding: '6px', marginLeft: '8px' }} title="Logout">🚪</button>
                    </div>
                </nav>
                <main className="main-content" style={{ marginLeft: 0, maxWidth: '900px', margin: '0 auto', paddingTop: '100px' }}>
                    <ProgressBar />

                    {/* Step 1: Admission Type */}
                    {step === 'REGISTERED' && (
                        <div className="animate-fade">
                            <h2 className="section-title text-center mb-lg">Select Admission Type</h2>
                            <div className="grid-3">
                                {['UG', 'PG'].map(type => (
                                    <div key={type} className="card text-center" style={{ cursor: 'pointer' }} onClick={() => setAdmissionType(type)}>
                                        <div className="stat-icon purple" style={{ margin: '0 auto 16px' }}>{type === 'UG' ? '🎓' : '🏆'}</div>
                                        <h3>{type === 'UG' ? 'Undergraduate' : 'Postgraduate'}</h3>
                                        <p className="mt-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {type === 'UG' ? 'B.Sc, B.Com, BBA & More' : 'M.Sc, MBA & More'}
                                        </p>
                                    </div>
                                ))}
                                <div className="card text-center" style={{ opacity: 0.5, cursor: 'not-allowed', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 8, right: 8 }}><span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Coming Soon</span></div>
                                    <div className="stat-icon purple" style={{ margin: '0 auto 16px' }}>⚙️</div>
                                    <h3>Engineering</h3>
                                    <p className="mt-sm" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>B.Tech & M.Tech</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: DigiLocker */}
                    {step === 'TYPE_SELECTED' && (
                        <div className="animate-fade card text-center">
                            <div className="stat-icon green" style={{ margin: '0 auto 16px' }}>🔐</div>
                            <h2 className="mb-md">DigiLocker Verification</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                Securely fetch your academic records for {profile.admissionType} admissions.
                            </p>
                            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                                {digiStep === 0 && (<>
                                    <div className="form-group text-left">
                                        <label className="form-label">Aadhaar-linked Mobile Number</label>
                                        <input className="form-input" placeholder="10-digit mobile" value={mobile} onChange={e => setMobile(e.target.value)} maxLength={10} />
                                    </div>
                                    <button className="btn btn-primary btn-block btn-lg" onClick={initiateDigiLocker} disabled={mobile.length !== 10 || loading}>
                                        {loading ? '⏳ Connecting...' : 'Connect DigiLocker'}
                                    </button>
                                    <p className="mt-md" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        🧪 Test mobiles: 9876543210 – 9876543214 | PIN: 1234 | OTP: 123456
                                    </p>
                                </>)}
                                {digiStep === 2 && (<>
                                    <div className="form-group text-left">
                                        <label className="form-label">Enter 4-digit PIN for {digiSession?.maskedName}</label>
                                        <input className="form-input" type="password" value={pin} onChange={e => setPin(e.target.value)} maxLength={4} style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '10px' }} />
                                    </div>
                                    <button className="btn btn-primary btn-block btn-lg" onClick={verifyPin} disabled={pin.length !== 4 || loading}>
                                        {loading ? '⏳ Verifying...' : 'Verify PIN'}
                                    </button>
                                </>)}
                                {digiStep === 3 && (<>
                                    <div className="form-group text-left">
                                        <label className="form-label">Enter OTP (Mock: 123456)</label>
                                        <input className="form-input" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }} />
                                    </div>
                                    <button className="btn btn-primary btn-block btn-lg" onClick={verifyOtp} disabled={otp.length !== 6 || loading}>
                                        {loading ? '⏳ Verifying...' : 'Verify OTP'}
                                    </button>
                                </>)}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Documents */}
                    {step === 'DIGILOCKER_DONE' && (
                        <div className="animate-fade card">
                            <h2 className="mb-sm text-center">📄 Document Review & Upload</h2>
                            <p className="text-center mb-lg" style={{ color: 'var(--text-secondary)' }}>
                                Documents fetched via DigiLocker are marked ✅. Upload any missing documents below.
                            </p>

                            {/* Auto-filled Application Preview */}
                            <div style={{ background: 'var(--bg-glass)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid var(--border)' }}>
                                <h4 style={{ marginBottom: '16px', color: 'var(--primary-light)' }}>👤 Auto-filled from DigiLocker</h4>
                                <div className="grid-2" style={{ gap: '10px', fontSize: '0.88rem' }}>
                                    <div><strong>Name:</strong> {profile.user?.name || '—'}</div>
                                    <div><strong>Gender:</strong> {profile.gender || '—'}</div>
                                    <div><strong>DOB:</strong> {profile.dateOfBirth || '—'}</div>
                                    <div><strong>Category:</strong> <span className="badge badge-info">{profile.category}</span></div>
                                    <div><strong>Father:</strong> {profile.fatherName || '—'}</div>
                                    <div><strong>Mother:</strong> {profile.motherName || '—'}</div>
                                    <div><strong>Parent Mobile:</strong> {profile.parentMobile || '—'}</div>
                                    <div><strong>Income:</strong> ₹{profile.annualIncome?.toLocaleString() || '—'}</div>
                                    <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {profile.address || '—'}</div>
                                </div>
                            </div>

                            {/* Academic Summary */}
                            <div style={{ background: 'var(--bg-glass)', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', border: '1px solid var(--border)' }}>
                                <h4 style={{ marginBottom: '16px', color: 'var(--primary-light)' }}>📊 Academic Records</h4>
                                <div className="table-container">
                                    <table>
                                        <thead><tr><th>Exam</th><th>Board</th><th>Hall Ticket</th><th>Year</th><th>Marks</th><th>%</th><th>Grade</th></tr></thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>SSC</strong></td>
                                                <td>{profile.sscBoard || '—'}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{profile.sscHallTicket || '—'}</td>
                                                <td>{profile.sscYearOfPassing || '—'}</td>
                                                <td>{profile.sscMarks}/{profile.sscTotal}</td>
                                                <td><strong>{profile.sscPercentage}%</strong></td>
                                                <td><span className="badge badge-success">{profile.sscGrade || '—'}</span></td>
                                            </tr>
                                            {(profile.admissionType === 'UG' || profile.admissionType === 'PG') && (
                                                <tr>
                                                    <td><strong>Inter</strong></td>
                                                    <td>{profile.interBoard || '—'}</td>
                                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{profile.interHallTicket || '—'}</td>
                                                    <td>{profile.interYearOfPassing || '—'}</td>
                                                    <td>{profile.interMarks}/{profile.interTotal}</td>
                                                    <td><strong>{profile.interPercentage}%</strong></td>
                                                    <td><span className="badge badge-info">{profile.interGroup || '—'}</span></td>
                                                </tr>
                                            )}
                                            {profile.admissionType === 'PG' && profile.ugMarks && (
                                                <tr>
                                                    <td><strong>UG</strong></td>
                                                    <td>—</td><td>—</td><td>—</td>
                                                    <td>{profile.ugMarks}/{profile.ugTotal}</td>
                                                    <td><strong>{profile.ugPercentage}%</strong></td>
                                                    <td>—</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Document Checklist with Upload */}
                            <h4 style={{ marginBottom: '12px' }}>📎 Required Documents</h4>
                            <div className="grid-2 mb-lg" style={{ gap: '12px' }}>
                                {mockDocuments.map(doc => {
                                    const isFetched = doc.status === 'AUTO_FETCHED' || doc.status === 'Mock Uploaded' || doc.status === 'Verified';
                                    const isNA = doc.status === 'N/A';
                                    return (
                                        <div key={doc.key} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
                                            background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)',
                                            border: `1px solid ${isFetched ? 'var(--success)' : isNA ? 'var(--border)' : 'var(--warning)'}`,
                                            opacity: isNA ? 0.5 : 1
                                        }}>
                                            <span style={{ fontSize: '1.5rem' }}>{doc.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{doc.label}</div>
                                                <span className={`badge ${isFetched ? 'badge-success' : isNA ? 'badge-default' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                                                    {isFetched ? '✅ Auto-fetched' : isNA ? 'Not Applicable' : '⚠️ Upload Required'}
                                                </span>
                                            </div>
                                            {!isFetched && !isNA && (
                                                <label style={{ cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={manualDocs[doc.key] || false}
                                                        onChange={e => setManualDocs({ ...manualDocs, [doc.key]: e.target.checked })} />
                                                    <span style={{ marginLeft: '4px', fontSize: '0.78rem' }}>Upload</span>
                                                </label>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex" style={{ justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary btn-lg" onClick={submitDocuments} disabled={loading}>
                                    {loading ? '⏳ Processing...' : 'Confirm Documents & Continue →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Course Selection */}
                    {step === 'DOCS_SUBMITTED' && (
                        <div className="animate-fade">
                            <div className="flex-between mb-lg">
                                <div>
                                    <h2>Select Courses for {profile.admissionType}</h2>
                                    <p style={{ color: 'var(--text-secondary)' }}>Select <strong>minimum 3</strong>, up to <strong>5 preferences</strong> across any college.</p>
                                </div>
                                <div className="text-right">
                                    <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '8px 16px' }}>
                                        Selected: {selectedCourses.length} / 5 {selectedCourses.length < 3 && <span style={{ color: '#ff9800' }}>(min 3)</span>}
                                    </span>
                                </div>
                            </div>

                            <div className="grid-2 mb-xl">
                                {allCourses.map((c: any) => {
                                    const isSelected = selectedCourses.includes(c.id);
                                    const prefIndex = selectedCourses.indexOf(c.id) + 1;
                                    return (
                                        <div key={c.id} className="card" style={{ cursor: 'pointer', border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)', position: 'relative' }}
                                            onClick={() => toggleCourseSelection(c.id)}>
                                            {isSelected && (
                                                <div style={{ position: 'absolute', top: -10, right: -10, background: 'var(--primary)', color: 'white', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {prefIndex}
                                                </div>
                                            )}
                                            <div className="flex-between">
                                                <h3 style={{ color: isSelected ? 'var(--primary-light)' : '' }}>{c.name}</h3>
                                                <span className="badge badge-default">{c.admissionMode}</span>
                                            </div>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '8px 0' }}>{c.college?.name} • {c.code}</p>
                                            <div className="course-meta">
                                                <span className="badge badge-info">Seats: {c.totalSeats}</span>
                                                <span className="badge badge-warning">Min: {c.eligibilityPercentage}%</span>
                                                <span className="badge badge-default">Fee: ₹{c.totalFee?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex text-center mb-xl" style={{ justifyContent: 'center' }}>
                                <button className="btn btn-primary btn-lg" style={{ padding: '16px 48px', fontSize: '1.2rem' }} onClick={submitApplication}
                                    disabled={selectedCourses.length < 3 || loading}>
                                    {loading ? '⏳ Submitting...' : `Submit Application (${selectedCourses.length} selected) 🚀`}
                                </button>
                            </div>
                        </div>
                    )}
                </main>
                <Chatbot />
            </div>
        );
    }

    // POST-ONBOARDING DASHBOARD
    return (
        <div className="app-layout">
            <nav className="navbar">
                <div className="navbar-brand">
                    <button className="btn btn-secondary btn-sm menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                    <div className="logo">🎓</div><span>NAP Student</span>
                </div>
                <div className="navbar-right">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowNotifications(!showNotifications)} style={{ padding: '6px', marginRight: '8px', position: 'relative' }}>
                        🔔
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ padding: '6px', marginRight: '8px' }}>{theme === 'light' ? '🌙' : '☀️'}</button>
                    <span className="role-badge student">Student</span>
                    <div className="navbar-user"><div className="user-avatar">{user?.name?.[0]}</div><span style={{ fontSize: '0.85rem' }}>{user?.name}</span></div>
                </div>
            </nav>

            {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-section">Main Menu</div>
                <ul className="sidebar-nav">
                    {menu.map(m => (
                        <li key={m.key} className="sidebar-item">
                            <button className={`sidebar-link ${view === m.key ? 'active' : ''}`} onClick={() => { setView(m.key); setSidebarOpen(false); }}>
                                <span className="icon">{m.icon}</span>{m.label}
                            </button>
                        </li>
                    ))}
                </ul>
                <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-secondary btn-block" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            <main className="main-content" style={{ paddingTop: '80px' }}>
                {view === 'dashboard' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>Welcome, {user?.name} 👋</h1><p>Your admission status overview</p></div>
                        <ProgressBar />
                        <div className="stats-grid">
                            <div className="stat-card"><div className="stat-icon purple">📝</div><div className="stat-value">{applications.length}</div><div className="stat-label">Applications</div></div>
                            <div className="stat-card"><div className="stat-icon green">🎯</div><div className="stat-value">{allotments.length}</div><div className="stat-label">Allotments</div></div>
                            <div className="stat-card"><div className="stat-icon cyan">💳</div><div className="stat-value">{payments.filter((p: any) => p.status === 'SUCCESS').length}</div><div className="stat-label">Payments</div></div>
                            <div className="stat-card"><div className="stat-icon amber">✅</div><div className="stat-value">Complete</div><div className="stat-label">Profile Status</div></div>
                        </div>

                        {/* Mini Analytics */}
                        <div className="card mt-xl">
                            <h3 className="mb-md">📊 Application Summary</h3>
                            <div className="grid-3" style={{ gap: '12px' }}>
                                {applications.map((a: any, i: number) => (
                                    <div key={a.id} style={{ padding: '14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                        <div className="flex-between mb-sm">
                                            <span className="badge badge-primary">Pref {i + 1}</span>
                                            <span className={`badge ${a.status === 'ELIGIBLE' ? 'badge-info' : a.status === 'ACCEPTED' ? 'badge-success' : a.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span>
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.course?.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{a.course?.college?.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'form' && (
                    <div className="animate-fade">
                        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{ margin: 0 }}>📋 Application Form</h1>
                                <p style={{ margin: '4px 0 0 0' }}>Auto-filled from DigiLocker verification</p>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setPrintApplication(true)}>
                                🖨️ Print Form
                            </button>
                        </div>

                        {/* Identity Section */}
                        <div className="card mb-lg">
                            <h3 className="mb-md" style={{ color: 'var(--primary-light)' }}>🧑 Basic Identity</h3>
                            <div className="grid-2" style={{ gap: '12px', fontSize: '0.9rem' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Full Name:</span> <strong>{profile.user?.name}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong>{profile.gender || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span> <strong>{profile.dateOfBirth || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong>{profile.user?.email}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Mobile:</span> <strong>{profile.user?.phone || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <span className="badge badge-info">{profile.category}</span></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Aadhaar:</span> <span className="badge badge-success">✅ Verified</span></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Minority:</span> {profile.minority ? 'Yes' : 'No'} | <span style={{ color: 'var(--text-muted)' }}>PH:</span> {profile.physicallyHandicapped ? 'Yes' : 'No'} | <span style={{ color: 'var(--text-muted)' }}>Sports:</span> {profile.sportsQuota ? 'Yes' : 'No'}</div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="card mb-lg">
                            <h3 className="mb-md" style={{ color: 'var(--primary-light)' }}>🏠 Address Details</h3>
                            <div className="grid-2" style={{ gap: '12px', fontSize: '0.9rem' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>House No:</span> <strong>{profile.houseNo || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Street:</span> <strong>{profile.street || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Village/Town:</span> <strong>{profile.village || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Mandal:</span> <strong>{profile.mandal || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>District:</span> <strong>{profile.district || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>State:</span> <strong>{profile.state || 'Andhra Pradesh'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Pincode:</span> <strong>{profile.pincode || '—'}</strong></div>
                            </div>
                        </div>

                        {/* Parent */}
                        <div className="card mb-lg">
                            <h3 className="mb-md" style={{ color: 'var(--primary-light)' }}>👨‍👩‍👧 Parent / Guardian</h3>
                            <div className="grid-2" style={{ gap: '12px', fontSize: '0.9rem' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Father Name:</span> <strong>{profile.fatherName || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Mother Name:</span> <strong>{profile.motherName || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Guardian:</span> <strong>{profile.guardianName || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Parent Mobile:</span> <strong>{profile.parentMobile || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Occupation:</span> <strong>{profile.parentOccupation || '—'}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Annual Income:</span> <strong>₹{profile.annualIncome?.toLocaleString() || '—'}</strong></div>
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="card mb-lg">
                            <h3 className="mb-md" style={{ color: 'var(--primary-light)' }}>🎓 Academic Records</h3>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Exam</th><th>Board</th><th>Hall Ticket</th><th>Group</th><th>Year</th><th>Marks</th><th>%</th><th>Grade</th><th>Source</th></tr></thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>SSC</strong></td><td>{profile.sscBoard || '—'}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{profile.sscHallTicket || '—'}</td>
                                            <td>—</td><td>{profile.sscYearOfPassing || '—'}</td>
                                            <td>{profile.sscMarks}/{profile.sscTotal}</td><td><strong>{profile.sscPercentage}%</strong></td>
                                            <td>{profile.sscGrade || '—'}</td>
                                            <td><span className="badge badge-success" style={{ fontSize: '0.7rem' }}>DigiLocker</span></td>
                                        </tr>
                                        {profile.interMarks && (
                                            <tr>
                                                <td><strong>Inter</strong></td><td>{profile.interBoard || '—'}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{profile.interHallTicket || '—'}</td>
                                                <td><span className="badge badge-info">{profile.interGroup || '—'}</span></td>
                                                <td>{profile.interYearOfPassing || '—'}</td>
                                                <td>{profile.interMarks}/{profile.interTotal}</td><td><strong>{profile.interPercentage}%</strong></td>
                                                <td>—</td>
                                                <td><span className="badge badge-success" style={{ fontSize: '0.7rem' }}>DigiLocker</span></td>
                                            </tr>
                                        )}
                                        {profile.ugMarks && (
                                            <tr>
                                                <td><strong>UG Degree</strong></td><td>—</td><td>—</td><td>—</td><td>—</td>
                                                <td>{profile.ugMarks}/{profile.ugTotal}</td><td><strong>{profile.ugPercentage}%</strong></td>
                                                <td>—</td>
                                                <td><span className="badge badge-success" style={{ fontSize: '0.7rem' }}>DigiLocker</span></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="card mb-lg">
                            <h3 className="mb-md" style={{ color: 'var(--primary-light)' }}>📎 Uploaded Documents</h3>
                            <div className="grid-2" style={{ gap: '12px' }}>
                                {mockDocuments.map(doc => {
                                    const ok = doc.status === 'AUTO_FETCHED' || doc.status === 'Mock Uploaded' || doc.status === 'Verified' || doc.status === 'MANUAL';
                                    return (
                                        <div key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: `1px solid ${ok ? 'var(--success)' : 'var(--border)'}` }}>
                                            <span style={{ fontSize: '1.3rem' }}>{doc.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.label}</div>
                                            </div>
                                            <span className={`badge ${ok ? 'badge-success' : 'badge-default'}`} style={{ fontSize: '0.72rem' }}>
                                                {ok ? '✅' : doc.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'applications' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>📝 My Applications</h1></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Pref</th><th>Course</th><th>College</th><th>Marks</th><th>Status</th></tr></thead>
                                <tbody>
                                    {applications.map((a: any) => (
                                        <tr key={a.id}>
                                            <td>{a.preference}</td>
                                            <td><strong>{a.course?.name}</strong></td>
                                            <td>{a.course?.college?.name}</td>
                                            <td>{a.appliedMarks}%</td>
                                            <td><span className={`badge ${a.status === 'ELIGIBLE' ? 'badge-info' : a.status === 'ACCEPTED' ? 'badge-success' : a.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'allotments' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>🎯 Seat Allotments</h1></div>
                        {allotments.length === 0 ? (
                            <div className="empty-state"><div className="icon">🎯</div><p>No allotments yet. Wait for faculty to publish rounds.</p></div>
                        ) : (
                            <div className="grid-2">
                                {allotments.map((a: any) => (
                                    <div key={a.id} className="card">
                                        <h3>{a.course?.name}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{a.course?.college?.name}</p>
                                        <div className="tag-row mt-md">
                                            <span className="badge badge-info">Round {a.round?.roundNumber}</span>
                                            <span className={`badge ${a.status === 'ACCEPTED' ? 'badge-success' : a.status === 'FROZEN' ? 'badge-warning' : 'badge-default'}`}>{a.status}</span>
                                        </div>
                                        {a.status === 'ALLOTTED' && (
                                            <div className="flex gap-sm mt-lg">
                                                <button className="btn btn-success btn-sm" onClick={() => respondToAllotment(a.id, 'ACCEPTED')}>✓ Accept</button>
                                                <button className="btn btn-warning btn-sm" onClick={() => respondToAllotment(a.id, 'FROZEN')}>❄ Freeze</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => respondToAllotment(a.id, 'CANCELLED')}>✕ Reject</button>
                                            </div>
                                        )}
                                        {(a.status === 'ACCEPTED' || a.status === 'FROZEN') && (
                                            <div className="mt-lg pt-md" style={{ borderTop: '1px solid var(--border)' }}>
                                                <div className="flex-between mb-sm"><span>Fee:</span><strong>₹{a.course?.totalFee?.toLocaleString()}</strong></div>
                                                <div className="flex gap-sm mt-sm">
                                                    <button className="btn btn-primary btn-block" onClick={() => initiatePayment(a)} disabled={loading}>💳 Pay Fees</button>
                                                    <button className="btn btn-secondary" onClick={() => handlePrintApplication(a)}>🖨️ Print Form</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {view === 'payments' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>💳 Payment History</h1></div>
                        {payments.length === 0 ? (
                            <div className="empty-state"><div className="icon">💳</div><p>No payments made.</p></div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Transaction ID</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Receipt</th></tr></thead>
                                    <tbody>
                                        {payments.map((p: any) => (
                                            <tr key={p.id}>
                                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.transactionId}</td>
                                                <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                                                <td>{p.method}</td>
                                                <td><span className={`badge ${p.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>{p.status}</span></td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {p.status === 'SUCCESS' && p.receiptUrl && (
                                                        <a href={`${api.defaults.baseURL}${p.receiptUrl}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                                                            View Receipt
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Chatbot />
            {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
            {paymentAllotment && (
                <PaymentModal
                    allotment={paymentAllotment}
                    onClose={() => setPaymentAllotment(null)}
                />
            )}

            {/* Hidden Print Container */}
            {printAllotment && profile && (
                <div className="print-only print-application-form">
                    <div style={{ position: 'relative' }}>
                        <div className="photo-box">
                            {/* Mock passport size photo placeholder */}
                            <div style={{ textAlign: 'center', color: '#888' }}>
                                <div style={{ fontSize: '24pt', marginBottom: '10px' }}>📸</div>
                                <div style={{ fontSize: '8pt' }}>Passport<br />Size Photo</div>
                            </div>
                        </div>

                        <div className="print-header">
                            <h1>Government of Andhra Pradesh</h1>
                            <h2>National Admission Portal</h2>
                            <p style={{ margin: '5px 0' }}>Confirmed Seat Allotment & Application Form ({profile.admissionType})</p>
                        </div>

                        <div className="print-section">
                            <div className="print-section-title">Allotment Details</div>
                            <div className="print-grid-2">
                                <span className="print-label">Application Status:</span> <strong className="print-value">CONFIRMED (ACCEPTED)</strong>
                                <span className="print-label">Allotment Round:</span> <span className="print-value">{printAllotment.round?.roundNumber || '1'}</span>
                                <span className="print-label">College Name:</span> <strong className="print-value">{printAllotment.course?.college?.name} ({printAllotment.course?.college?.code})</strong>
                                <span className="print-label">Course Allotted:</span> <strong className="print-value">{printAllotment.course?.name} ({printAllotment.course?.code})</strong>
                                <span className="print-label">Seat Category:</span> <span className="print-value">{profile.category}</span>
                            </div>
                        </div>

                        <div className="print-section">
                            <div className="print-section-title">Student Details</div>
                            <div className="print-grid-2">
                                <span className="print-label">Full Name:</span> <span className="print-value">{profile.user?.name}</span>
                                <span className="print-label">Date of Birth:</span> <span className="print-value">{profile.dateOfBirth || '—'}</span>
                                <span className="print-label">Gender:</span> <span className="print-value">{profile.gender || '—'}</span>
                                <span className="print-label">Email Address:</span> <span className="print-value">{profile.user?.email}</span>
                                <span className="print-label">Mobile Number:</span> <span className="print-value">{profile.user?.phone || '—'}</span>
                            </div>
                        </div>

                        <div className="print-section">
                            <div className="print-section-title">Parent / Guardian & Address</div>
                            <div className="print-grid-2">
                                <span className="print-label">Father's Name:</span> <span className="print-value">{profile.fatherName || '—'}</span>
                                <span className="print-label">Mother's Name:</span> <span className="print-value">{profile.motherName || '—'}</span>
                                <span className="print-label">Parent Mobile:</span> <span className="print-value">{profile.parentMobile || '—'}</span>
                                <span className="print-label">Full Address:</span> <span className="print-value">{profile.address || '—'}</span>
                            </div>
                        </div>

                        <div className="print-section">
                            <div className="print-section-title">Academic Records</div>
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th>Examination</th>
                                        <th>Hall Ticket</th>
                                        <th>Year</th>
                                        <th>Marks Obtained</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>SSC / 10th Class</td>
                                        <td>{profile.sscHallTicket || '—'}</td>
                                        <td>{profile.sscYearOfPassing || '—'}</td>
                                        <td>{profile.sscMarks}/{profile.sscTotal}</td>
                                        <td>{profile.sscPercentage}%</td>
                                    </tr>
                                    {(profile.admissionType === 'UG' || profile.admissionType === 'PG') && profile.interPercentage && (
                                        <tr>
                                            <td>Intermediate</td>
                                            <td>{profile.interHallTicket || '—'}</td>
                                            <td>{profile.interYearOfPassing || '—'}</td>
                                            <td>{profile.interMarks}/{profile.interTotal}</td>
                                            <td>{profile.interPercentage}%</td>
                                        </tr>
                                    )}
                                    {profile.admissionType === 'PG' && profile.ugPercentage && (
                                        <tr>
                                            <td>UG Degree</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td>{profile.ugMarks}/{profile.ugTotal}</td>
                                            <td>{profile.ugPercentage}%</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderBottom: '1px solid black', width: '200px', height: '40px' }}></div>
                                <div style={{ marginTop: '5px' }}>Student Signature</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderBottom: '1px solid black', width: '200px', height: '40px' }}></div>
                                <div style={{ marginTop: '5px' }}>College Principal Seal</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Container for General Application */}
            {printApplication && profile && (
                <div className="print-only print-application-form">
                    <div style={{ position: 'relative' }}>
                        <div className="photo-box">
                            {/* Mock passport size photo placeholder */}
                            <div style={{ textAlign: 'center', color: '#888' }}>
                                <div style={{ fontSize: '24pt', marginBottom: '10px' }}>📸</div>
                                <div style={{ fontSize: '8pt' }}>Passport<br />Size Photo</div>
                            </div>
                        </div>

                        <div className="print-header">
                            <h1>Government of Andhra Pradesh</h1>
                            <h2>National Admission Portal</h2>
                            <p style={{ margin: '5px 0' }}>Student Application Form ({profile.admissionType})</p>
                        </div>

                        <div className="print-section">
                            <div className="print-section-title">Student Details</div>
                            <div className="print-grid-2">
                                <span className="print-label">Full Name:</span> <span className="print-value">{profile.user?.name}</span>
                                <span className="print-label">Date of Birth:</span> <span className="print-value">{profile.dateOfBirth || '—'}</span>
                                <span className="print-label">Gender:</span> <span className="print-value">{profile.gender || '—'}</span>
                                <span className="print-label">Email Address:</span> <span className="print-value">{profile.user?.email}</span>
                                <span className="print-label">Mobile Number:</span> <span className="print-value">{profile.user?.phone || '—'}</span>
                                <span className="print-label">Category:</span> <span className="print-value">{profile.category}</span>
                            </div>
                        </div>

                        <div className="print-section">
                            <div className="print-section-title">Parent / Guardian & Address</div>
                            <div className="print-grid-2">
                                <span className="print-label">Father's Name:</span> <span className="print-value">{profile.fatherName || '—'}</span>
                                <span className="print-label">Mother's Name:</span> <span className="print-value">{profile.motherName || '—'}</span>
                                <span className="print-label">Parent Mobile:</span> <span className="print-value">{profile.parentMobile || '—'}</span>
                                <span className="print-label">Full Address:</span> <span className="print-value">{profile.address || '—'}</span>
                            </div>
                        </div>

                        <div className="print-section">
                            <div className="print-section-title">Academic Records</div>
                            <table className="print-table">
                                <thead>
                                    <tr>
                                        <th>Examination</th>
                                        <th>Hall Ticket</th>
                                        <th>Year</th>
                                        <th>Marks Obtained</th>
                                        <th>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>SSC / 10th Class</td>
                                        <td>{profile.sscHallTicket || '—'}</td>
                                        <td>{profile.sscYearOfPassing || '—'}</td>
                                        <td>{profile.sscMarks}/{profile.sscTotal}</td>
                                        <td>{profile.sscPercentage}%</td>
                                    </tr>
                                    {(profile.admissionType === 'UG' || profile.admissionType === 'PG') && profile.interPercentage && (
                                        <tr>
                                            <td>Intermediate</td>
                                            <td>{profile.interHallTicket || '—'}</td>
                                            <td>{profile.interYearOfPassing || '—'}</td>
                                            <td>{profile.interMarks}/{profile.interTotal}</td>
                                            <td>{profile.interPercentage}%</td>
                                        </tr>
                                    )}
                                    {profile.admissionType === 'PG' && profile.ugPercentage && (
                                        <tr>
                                            <td>UG Degree</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td>{profile.ugMarks}/{profile.ugTotal}</td>
                                            <td>{profile.ugPercentage}%</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ borderBottom: '1px solid black', width: '200px', height: '40px' }}></div>
                                <div style={{ marginTop: '5px' }}>Student Signature</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
