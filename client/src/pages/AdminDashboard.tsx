import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import api from '../api';
import Chatbot from '../components/Chatbot';

export default function AdminDashboard() {
    const { user, setUser, showToast, theme, toggleTheme } = useContext(AppContext);
    const nav = useNavigate();
    const [view, setView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState<any>({});
    const [users, setUsers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [allotments, setAllotments] = useState<any[]>([]);
    const [colleges, setColleges] = useState<any[]>([]);
    const [showCollegeForm, setShowCollegeForm] = useState(false);
    const [collegeForm, setCollegeForm] = useState({ name: '', code: '', accessCode: '86390', city: '', state: 'Andhra Pradesh' });
    const [analytics, setAnalytics] = useState<any>(null);
    const [roundData, setRoundData] = useState<any>({ rounds: [], courses: [] });
    const [admissionPhases, setAdmissionPhases] = useState<any[]>([]);
    const [roundSchedule, setRoundSchedule] = useState({ admissionType: '', startDate: '', endDate: '' });
    const [roundLoading, setRoundLoading] = useState(false);
    const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);

    useEffect(() => { loadDashboard(); }, []);

    const loadDashboard = async () => {
        try {
            const [sRes, uRes, cRes, pRes, aRes, alRes, colRes, anRes] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/admin/users'),
                api.get('/admin/courses'),
                api.get('/admin/payments'),
                api.get('/admin/audit-logs'),
                api.get('/admin/allotments'),
                api.get('/admin/colleges'),
                api.get('/admin/analytics').catch(() => ({ data: null }))
            ]);
            setStats(sRes.data);
            setUsers(uRes.data);
            setCourses(cRes.data);
            setPayments(pRes.data);
            setAuditLogs(aRes.data);
            setAllotments(alRes.data);
            setColleges(colRes.data);
            if (anRes.data) setAnalytics(anRes.data);
        } catch { showToast('Failed to load admin data', 'error'); }
    };

    const loadRounds = async () => {
        try {
            const [rRes, pRes] = await Promise.all([
                api.get('/admin/rounds'),
                api.get('/admin/rounds/phases')
            ]);
            setRoundData(rRes.data);
            setAdmissionPhases(pRes.data);
        } catch { }
    };

    useEffect(() => {
        if (view === 'rounds') loadRounds();
    }, [view]);

    const saveCollege = async () => {
        try {
            if (editingCollegeId) {
                await api.patch(`/admin/colleges/${editingCollegeId}`, collegeForm);
                showToast('College updated successfully!', 'success');
            } else {
                await api.post('/admin/colleges', collegeForm);
                showToast('College added successfully!', 'success');
            }
            setShowCollegeForm(false);
            setEditingCollegeId(null);
            setCollegeForm({ name: '', code: '', accessCode: '86390', city: '', state: 'Andhra Pradesh' });
            loadDashboard();
        } catch (err: any) { showToast(err.response?.data?.error || `Failed to ${editingCollegeId ? 'update' : 'add'} college`, 'error'); }
    };

    const handleEditCollege = (college: any) => {
        setEditingCollegeId(college.id);
        setCollegeForm({
            name: college.name,
            code: college.code,
            accessCode: college.accessCode,
            city: college.city,
            state: college.state
        });
        setShowCollegeForm(true);
    };

    const initiateRefund = async (paymentId: string) => {
        if (!confirm('Initiate refund for this payment?')) return;
        try {
            await api.post('/admin/refund', { paymentId, reason: 'Admin initiated refund' });
            showToast('Refund processed!', 'success');
            loadDashboard();
        } catch (err: any) { showToast(err.response?.data?.error || 'Refund failed', 'error'); }
    };

    const startRound = async (courseId: string) => {
        setRoundLoading(true);
        try {
            const { data } = await api.post(`/admin/rounds/${courseId}/start`);
            showToast(`Round started! ${data.allotments?.length || 0} seats allotted.`, 'success');
            loadRounds();
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
        finally { setRoundLoading(false); }
    };

    const completeRound = async (courseId: string) => {
        setRoundLoading(true);
        try {
            await api.post(`/admin/rounds/${courseId}/complete`);
            showToast('Round completed!', 'success');
            loadRounds();
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
        finally { setRoundLoading(false); }
    };

    const publishResults = async (courseId: string) => {
        setRoundLoading(true);
        try {
            await api.post(`/admin/rounds/${courseId}/publish`);
            showToast('Results published and notifications sent!', 'success');
            loadRounds();
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
        finally { setRoundLoading(false); }
    };

    const scheduleRound = async () => {
        if (!roundSchedule.admissionType || !roundSchedule.startDate || !roundSchedule.endDate) {
            return showToast('Please fill all schedule fields', 'warning');
        }
        try {
            const { data } = await api.post('/admin/rounds/schedule', roundSchedule);
            showToast(data.message, 'success');
            setRoundSchedule({ admissionType: '', startDate: '', endDate: '' });
            loadRounds();
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    };

    const logout = () => { setUser(null); nav('/'); };

    const menu = [
        { icon: '📊', label: 'Dashboard', key: 'dashboard' },
        { icon: '🏢', label: 'Colleges', key: 'colleges' },
        { icon: '👥', label: 'Users', key: 'users' },
        { icon: '📚', label: 'Courses', key: 'courses' },
        { icon: '🔄', label: 'Allotment Rounds', key: 'rounds' },
        { icon: '🎯', label: 'Allotments', key: 'allotments' },
        { icon: '💳', label: 'Payments', key: 'payments' },
        { icon: '📋', label: 'Audit Logs', key: 'audit' },
        { icon: '📈', label: 'Analytics', key: 'analytics' },
    ];

    return (
        <div className="app-layout">
            <nav className="navbar">
                <div className="navbar-brand">
                    <button className="btn btn-secondary btn-sm menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
                    <div className="logo">🎓</div><span>NAP Admin</span>
                </div>
                <div className="navbar-right">
                    <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ padding: '6px', marginRight: '8px' }}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <span className="role-badge admin">Admin</span>
                    <div className="navbar-user">
                        <div className="user-avatar">{user?.name?.[0]}</div>
                        <span style={{ fontSize: '0.85rem' }}>{user?.name}</span>
                    </div>
                </div>
            </nav>

            {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-section">Admin Panel</div>
                <ul className="sidebar-nav">
                    {menu.map(m => (
                        <li key={m.key} className="sidebar-item">
                            <button className={`sidebar-link ${view === m.key ? 'active' : ''}`} onClick={() => { setView(m.key); setSidebarOpen(false); }}>
                                <span className="icon">{m.icon}</span>{m.label}
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="sidebar-section">
                    <button className="sidebar-link" onClick={() => { logout(); setSidebarOpen(false); }}><span className="icon">🚪</span> Logout</button>
                </div>
            </aside>

            <main className="main-content" style={{ paddingTop: '80px' }}>
                {/* Dashboard */}
                {view === 'dashboard' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>Admin Dashboard</h1><p>System overview and analytics</p></div>
                        <div className="stats-grid">
                            <div className="stat-card"><div className="stat-icon purple">👥</div><div className="stat-value">{stats.totalStudents}</div><div className="stat-label">Students</div></div>
                            <div className="stat-card"><div className="stat-icon cyan">🏫</div><div className="stat-value">{stats.totalFaculty}</div><div className="stat-label">College Admins</div></div>
                            <div className="stat-card"><div className="stat-icon amber">📚</div><div className="stat-value">{stats.totalCourses}</div><div className="stat-label">Courses</div></div>
                            <div className="stat-card"><div className="stat-icon green">📝</div><div className="stat-value">{stats.totalApplications}</div><div className="stat-label">Applications</div></div>
                            <div className="stat-card"><div className="stat-icon red">🎯</div><div className="stat-value">{stats.totalAllotments}</div><div className="stat-label">Allotments</div></div>
                            <div className="stat-card">
                                <div className="stat-icon green">💰</div>
                                <div className="stat-value">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
                                <div className="stat-label">Revenue</div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="grid-2">
                            <div className="card">
                                <h3 className="card-title mb-md">Recent Payments</h3>
                                {payments.slice(0, 5).map((p: any) => (
                                    <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.student?.user?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.transactionId}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</div>
                                            <span className={`badge ${p.status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>{p.status}</span>
                                        </div>
                                    </div>
                                ))}
                                {payments.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No payments yet</p>}
                            </div>

                            <div className="card">
                                <h3 className="card-title mb-md">Recent Audit Logs</h3>
                                {auditLogs.slice(0, 5).map((log: any) => (
                                    <div key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{log.action}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {log.user?.name} • {log.entity} {log.entityId?.slice(0, 8)}
                                        </div>
                                    </div>
                                ))}
                                {auditLogs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No audit logs</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users */}
                {view === 'users' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>👥 User Management</h1><p>All registered users</p></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th></tr></thead>
                                <tbody>
                                    {users.map((u: any) => (
                                        <tr key={u.id}>
                                            <td><strong>{u.name}</strong></td>
                                            <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                                            <td><span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span></td>
                                            <td>{u.isVerified ? '✅' : '❌'}</td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Colleges */}
                {view === 'colleges' && (
                    <div className="animate-fade">
                        <div className="flex-between mb-lg">
                            <div className="page-header" style={{ marginBottom: 0 }}><h1>🏢 Manage Colleges</h1></div>
                            <button className="btn btn-primary" onClick={() => {
                                setShowCollegeForm(!showCollegeForm);
                                if (showCollegeForm) {
                                    setEditingCollegeId(null);
                                    setCollegeForm({ name: '', code: '', accessCode: '86390', city: '', state: 'Andhra Pradesh' });
                                }
                            }}>{showCollegeForm ? 'Cancel' : '+ Add College'}</button>
                        </div>

                        {showCollegeForm && (
                            <div className="card mb-lg">
                                <h3 className="card-title mb-lg">{editingCollegeId ? 'Edit College' : 'New College'}</h3>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={collegeForm.name} onChange={e => setCollegeForm({ ...collegeForm, name: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Code (Unique)</label><input className="form-input" value={collegeForm.code} onChange={e => setCollegeForm({ ...collegeForm, code: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">City</label><input className="form-input" value={collegeForm.city} onChange={e => setCollegeForm({ ...collegeForm, city: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">State</label><input className="form-input" value={collegeForm.state} onChange={e => setCollegeForm({ ...collegeForm, state: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">College Admin Access Code (5-Digit)</label><input className="form-input" maxLength={5} value={collegeForm.accessCode} onChange={e => setCollegeForm({ ...collegeForm, accessCode: e.target.value })} placeholder="e.g. 86390" /></div>
                                    <div className="form-group"></div>
                                </div>
                                <button className="btn btn-success" onClick={saveCollege}>Save College</button>
                            </div>
                        )}

                        <div className="table-container">
                            <table>
                                <thead><tr><th>Name</th><th>Code</th><th>Access Code</th><th>Location</th><th>Stats</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {colleges.map((c: any) => (
                                        <tr key={c.id}>
                                            <td><strong>{c.name}</strong></td>
                                            <td><code style={{ fontSize: '0.8rem' }}>{c.code}</code></td>
                                            <td><code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{c.accessCode}</code></td>
                                            <td>{c.city}, {c.state}</td>
                                            <td style={{ fontSize: '0.9rem' }}>{c._count?.courses || 0} Courses • {c._count?.faculty || 0} College Admins</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEditCollege(c)}>Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Courses */}
                {view === 'courses' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>📚 All Courses</h1></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Name</th><th>College</th><th>Type</th><th>Seats</th><th>Min %</th><th>Fee</th><th>Apps</th></tr></thead>
                                <tbody>
                                    {courses.map((c: any) => (
                                        <tr key={c.id}>
                                            <td><strong>{c.name}</strong></td>
                                            <td>{c.college?.name}</td>
                                            <td><span className="badge badge-primary">{c.admissionType}</span></td>
                                            <td>{c.totalSeats}</td>
                                            <td>{c.eligibilityPercentage}%</td>
                                            <td style={{ fontWeight: 700 }}>₹{c.totalFee?.toLocaleString()}</td>
                                            <td>{c._count?.applications || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Allotment Rounds */}
                {view === 'rounds' && (
                    <div className="animate-fade">
                        <div className="page-header">
                            <h1>🔄 Allotment Rounds Management</h1>
                            <p>Schedule and manage admission rounds across all colleges</p>
                        </div>

                        {/* Configured Admission Phases */}
                        <div className="card mb-lg">
                            <h3 className="card-title mb-md">📅 Current Phase Schedules</h3>
                            {admissionPhases.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No allotment dates configured.</p>
                            ) : (
                                <div className="table-container mb-md">
                                    <table>
                                        <thead><tr><th>Admission Type</th><th>Start Date</th><th>End Date</th></tr></thead>
                                        <tbody>
                                            {admissionPhases.map((p: any) => (
                                                <tr key={p.id}>
                                                    <td><span className="badge badge-primary">{p.admissionType}</span></td>
                                                    <td>{new Date(p.startDate).toLocaleDateString()}</td>
                                                    <td>{new Date(p.endDate).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <h4 className="mb-sm mt-md">Configure New Dates</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Admission Type</label>
                                    <select className="form-select" value={roundSchedule.admissionType} onChange={e => setRoundSchedule({ ...roundSchedule, admissionType: e.target.value })}>
                                        <option value="">-- Select Type --</option>
                                        <option value="UG">UG</option>
                                        <option value="PG">PG</option>
                                        <option value="ENGINEERING">ENGINEERING</option>
                                        <option value="DIPLOMA">DIPLOMA</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={roundSchedule.startDate} onChange={e => setRoundSchedule({ ...roundSchedule, startDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" className="form-input" value={roundSchedule.endDate} onChange={e => setRoundSchedule({ ...roundSchedule, endDate: e.target.value })} />
                                </div>
                            </div>
                            <button className="btn btn-primary mt-sm" onClick={scheduleRound}>📅 Save Schedule</button>
                        </div>

                        {/* Course-wise Round Controls */}
                        <h3 className="mb-md">Course-wise Round Controls</h3>
                        <div className="grid-2">
                            {roundData.courses?.map((c: any) => {
                                const latestRound = c.rounds?.[0];
                                return (
                                    <div key={c.id} className="card mb-md">
                                        <div className="flex-between mb-md">
                                            <div>
                                                <h3 style={{ marginBottom: '4px' }}>{c.name}</h3>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.college?.name}</p>
                                            </div>
                                            <span className="badge badge-primary">{c.admissionType}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', fontSize: '0.85rem' }}>
                                            <span className="badge badge-info">Seats: {c.totalSeats}</span>
                                            <span className="badge badge-default">Apps: {c._count?.applications || 0}</span>
                                            <span className="badge badge-success">Allotted: {c._count?.allotments || 0}</span>
                                            <span className={`badge ${c.reservations?.length > 0 ? 'badge-success' : 'badge-danger'}`}>
                                                Reservation: {c.reservations?.length > 0 ? '✅' : '❌ Not set'}
                                            </span>
                                        </div>
                                        {latestRound && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                                Latest: Round {latestRound.roundNumber} — <span className={`badge ${latestRound.status === 'IN_PROGRESS' ? 'badge-warning' : latestRound.status === 'COMPLETED' ? 'badge-info' : 'badge-default'}`}>{latestRound.status}</span>
                                                {latestRound.isPublished && <span className="badge badge-success" style={{ marginLeft: '6px' }}>📢 Published</span>}
                                            </p>
                                        )}
                                        <div className="flex gap-sm">
                                            {latestRound?.status === 'IN_PROGRESS' ? (
                                                <>
                                                    <button className="btn btn-warning btn-sm" onClick={() => completeRound(c.id)} disabled={roundLoading}>⏹ Complete</button>
                                                    <button className="btn btn-success btn-sm" onClick={() => publishResults(c.id)} disabled={roundLoading}>📢 Publish</button>
                                                </>
                                            ) : (
                                                <button className="btn btn-primary btn-sm" onClick={() => startRound(c.id)} disabled={roundLoading || !c.reservations?.length}>
                                                    {roundLoading ? '⏳' : '▶ Start Next Round'}
                                                </button>
                                            )}
                                            {latestRound?.status === 'COMPLETED' && !latestRound?.isPublished && (
                                                <button className="btn btn-success btn-sm" onClick={() => publishResults(c.id)} disabled={roundLoading}>📢 Publish Results</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Allotments */}
                {view === 'allotments' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>🎯 All Allotments</h1></div>
                        {allotments.length === 0 ? (
                            <div className="empty-state"><div className="icon">🎯</div><p>No allotments yet</p></div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Student</th><th>Course</th><th>Category</th><th>Round</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {allotments.map((a: any) => (
                                            <tr key={a.id}>
                                                <td>{a.student?.user?.name}</td>
                                                <td>{a.course?.name}</td>
                                                <td><span className="badge badge-default">{a.category}</span></td>
                                                <td>Round {a.round?.roundNumber}</td>
                                                <td><span className={`badge ${a.status === 'ACCEPTED' ? 'badge-success' : a.status === 'FROZEN' ? 'badge-warning' : 'badge-default'}`}>{a.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Payments */}
                {view === 'payments' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>💳 Payment Management</h1></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Student</th><th>Transaction</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {payments.map((p: any) => (
                                        <tr key={p.id}>
                                            <td>{p.student?.user?.name}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.transactionId}</td>
                                            <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                                            <td>{p.method}</td>
                                            <td><span className={`badge ${p.status === 'SUCCESS' ? 'badge-success' : p.status === 'REFUNDED' ? 'badge-info' : 'badge-danger'}`}>{p.status}</span></td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td>{p.status === 'SUCCESS' && <button className="btn btn-danger btn-sm" onClick={() => initiateRefund(p.id)}>Refund</button>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Audit Logs */}
                {view === 'audit' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>📋 Audit Logs</h1><p>All system actions logged</p></div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Action</th><th>User</th><th>Entity</th><th>Details</th><th>Time</th></tr></thead>
                                <tbody>
                                    {auditLogs.map((log: any) => (
                                        <tr key={log.id}>
                                            <td><span className="badge badge-info">{log.action}</span></td>
                                            <td>{log.user?.name || 'System'}</td>
                                            <td>{log.entity}</td>
                                            <td style={{ fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Analytics */}
                {view === 'analytics' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>📈 Student Analytics</h1><p>Comprehensive analytics across all colleges</p></div>
                        {analytics ? (
                            <>
                                <h3 className="mb-md">🏷️ Category Distribution</h3>
                                <div className="stats-grid mb-xl">
                                    {analytics.categoryBreakdown?.map((c: any) => (
                                        <div key={c.category} className="stat-card">
                                            <div className="stat-icon purple">🏷️</div>
                                            <div className="stat-value">{c.count}</div>
                                            <div className="stat-label">{c.category}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid-2 mb-xl" style={{ gap: '20px' }}>
                                    <div className="card">
                                        <h3 className="mb-md">👥 Gender Distribution</h3>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {analytics.genderBreakdown?.map((g: any) => (
                                                <div key={g.gender} style={{ flex: 1, textAlign: 'center', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{g.count}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{g.gender}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card">
                                        <h3 className="mb-md">📝 Application Status</h3>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            {analytics.statusBreakdown?.map((s: any) => (
                                                <div key={s.status} style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.count}</div>
                                                    <span className={`badge ${s.status === 'ELIGIBLE' ? 'badge-info' : s.status === 'REJECTED' ? 'badge-danger' : s.status === 'ALLOTTED' ? 'badge-success' : 'badge-default'}`}>{s.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {analytics.districtBreakdown?.length > 0 && (
                                    <div className="card mb-xl">
                                        <h3 className="mb-md">🗺️ District-wise Distribution</h3>
                                        <div className="grid-3" style={{ gap: '10px' }}>
                                            {analytics.districtBreakdown?.map((d: any) => (
                                                <div key={d.district} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{d.district}</span>
                                                    <span className="badge badge-primary">{d.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="card">
                                    <h3 className="mb-md">📊 Course Fill Rate</h3>
                                    <div className="table-container">
                                        <table>
                                            <thead><tr><th>Course</th><th>Code</th><th>Seats</th><th>Apps</th><th>Allotted</th><th>Fill Rate</th></tr></thead>
                                            <tbody>
                                                {analytics.courseFillRate?.map((c: any) => (
                                                    <tr key={c.code}>
                                                        <td><strong>{c.name}</strong></td><td>{c.code}</td><td>{c.totalSeats}</td><td>{c.applications}</td><td>{c.allotments}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ flex: 1, background: 'var(--bg-darker)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${c.fillRate}%`, height: '100%', background: c.fillRate > 70 ? 'var(--success)' : c.fillRate > 30 ? 'var(--warning)' : 'var(--danger)', borderRadius: '6px' }} />
                                                                </div>
                                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.fillRate}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : <div className="empty-state"><div className="icon">📈</div><p>No analytics data yet.</p></div>}
                    </div>
                )}
            </main>
            <Chatbot />
        </div>
    );
}
