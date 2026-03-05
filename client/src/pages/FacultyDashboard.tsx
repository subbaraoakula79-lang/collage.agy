import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import api from '../api';

export default function FacultyDashboard() {
    const { user, setUser, showToast, theme, toggleTheme } = useContext(AppContext);
    const nav = useNavigate();
    const [view, setView] = useState('dashboard');
    const [courses, setCourses] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);
    const [courseForm, setCourseForm] = useState({
        name: '', code: '', admissionType: 'UG', admissionMode: 'MERIT', totalSeats: 60,
        eligibilityPercentage: 60, tuitionFee: 25000, labFee: 5000, libraryFee: 2000, otherFee: 3000,
        installmentEnabled: false, scholarshipEnabled: false, unfilledSeatRule: 'CONVERT_TO_GENERAL'
    });
    const [reservationForm, setReservationForm] = useState([
        { category: 'GENERAL', percentage: 40 }, { category: 'OBC', percentage: 27 },
        { category: 'SC', percentage: 15 }, { category: 'ST', percentage: 8 }, { category: 'EWS', percentage: 10 }
    ]);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [seatMatrix, setSeatMatrix] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [appDetail, setAppDetail] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [allColleges, setAllColleges] = useState<any[]>([]);
    const [linkForm, setLinkForm] = useState({ collegeId: '', accessCode: '' });
    const [linking, setLinking] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [pRes, anRes] = await Promise.all([
                api.get('/faculty/profile'),
                api.get('/faculty/analytics').catch(() => ({ data: null }))
            ]);
            setProfile(pRes.data);
            if (anRes.data) setAnalytics(anRes.data);

            if (pRes.data?.collegeId) {
                const cRes = await api.get('/faculty/courses');
                setCourses(cRes.data);
            } else {
                const collegesRes = await api.get('/faculty/all-colleges');
                setAllColleges(collegesRes.data);
            }
        } catch (err: any) {
            console.error('Failed to load faculty data:', err);
            showToast('Failed to load data', 'error');
        }
    };

    const saveCourse = async () => {
        setLoading(true);
        try {
            if (editingCourse) {
                await api.put(`/faculty/courses/${editingCourse.id}`, courseForm);
                showToast('Course updated!', 'success');
            } else {
                await api.post('/faculty/courses', courseForm);
                showToast('Course created!', 'success');
            }
            setShowForm(false);
            setEditingCourse(null);
            loadData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed', 'error');
        } finally { setLoading(false); }
    };

    const deleteCourse = async (id: string) => {
        if (!confirm('Delete this course?')) return;
        try {
            await api.delete(`/faculty/courses/${id}`);
            showToast('Course deleted', 'success');
            loadData();
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
    };

    const saveReservation = async (courseId: string) => {
        setLoading(true);
        try {
            await api.post(`/faculty/courses/${courseId}/reservation`, { reservations: reservationForm });
            showToast('Reservation matrix saved!', 'success');
            loadData();
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error'); }
        finally { setLoading(false); }
    };



    const loadSeatMatrix = async (courseId: string) => {
        try {
            const { data } = await api.get(`/faculty/courses/${courseId}/seat-matrix`);
            setSeatMatrix(data);
        } catch { }
    };

    const loadApplications = async (courseId: string) => {
        try {
            const { data } = await api.get(`/faculty/courses/${courseId}/applications`);
            setApplications(data);
        } catch { }
    };

    const updateApplicationStatus = async (appId: string, status: string) => {
        if (!selectedCourse) return;
        try {
            await api.put(`/faculty/courses/${selectedCourse.id}/applications/${appId}`, { status });
            showToast(`Application marked as ${status}`, 'success');
            loadApplications(selectedCourse.id);
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed to update', 'error'); }
    };

    const linkCollege = async () => {
        if (!linkForm.collegeId || !linkForm.accessCode) return showToast('Please select college and enter access code', 'warning');
        setLinking(true);
        try {
            await api.post('/faculty/link-college', linkForm);
            showToast('College linked successfully!', 'success');
            loadData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Linking failed', 'error');
        } finally { setLinking(false); }
    };

    const viewApplication = async (appId: string) => {
        try {
            const { data } = await api.get(`/faculty/applications/${appId}/detail`);
            setAppDetail(data);
        } catch { showToast('Failed to load application', 'error'); }
    };

    const openEdit = (course: any) => {
        setEditingCourse(course);
        setCourseForm({
            name: course.name, code: course.code, admissionType: course.admissionType,
            admissionMode: course.admissionMode, totalSeats: course.totalSeats,
            eligibilityPercentage: course.eligibilityPercentage,
            tuitionFee: course.tuitionFee, labFee: course.labFee, libraryFee: course.libraryFee, otherFee: course.otherFee,
            installmentEnabled: course.installmentEnabled, scholarshipEnabled: course.scholarshipEnabled,
            unfilledSeatRule: course.unfilledSeatRule
        });
        setShowForm(true);
    };

    const logout = () => { setUser(null); nav('/'); };

    const menu = [
        { icon: '📊', label: 'Dashboard', key: 'dashboard' },
        { icon: '📚', label: 'Courses', key: 'courses' },
        { icon: '⚖️', label: 'Reservation', key: 'reservation' },
        { icon: '🎯', label: 'Seat Matrix', key: 'seatmatrix' },
        { icon: '📈', label: 'Analytics', key: 'analytics' },
    ];

    return (
        <div className="app-layout">
            <nav className="navbar">
                <div className="navbar-brand"><div className="logo">🏫</div><span>NAP College Admin</span></div>
                <div className="navbar-right">
                    <button className="btn btn-secondary btn-sm" onClick={toggleTheme} style={{ padding: '6px', marginRight: '8px' }}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    <span className="role-badge faculty">College Admin</span>
                    <div className="navbar-user"><div className="user-avatar">{user?.name?.[0]}</div><span style={{ fontSize: '0.85rem' }}>{user?.name}</span></div>
                </div>
            </nav>

            <aside className="sidebar">
                <div className="sidebar-section">College Admin Panel</div>
                <ul className="sidebar-nav">
                    {profile?.collegeId && menu.map(m => (
                        <li key={m.key} className="sidebar-item">
                            <button className={`sidebar-link ${view === m.key ? 'active' : ''}`} onClick={() => setView(m.key)}>
                                <span className="icon">{m.icon}</span>{m.label}
                            </button>
                        </li>
                    ))}
                    {!profile?.collegeId && (
                        <li className="sidebar-item">
                            <button className="sidebar-link active">
                                <span className="icon">🔒</span>Link College First
                            </button>
                        </li>
                    )}
                </ul>
                <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-secondary btn-block" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            <main className="main-content" style={{ paddingTop: '80px' }}>
                {/* Linking View */}
                {!profile?.collegeId && (
                    <div className="animate-fade" style={{ maxWidth: '500px', margin: '60px auto' }}>
                        <div className="card">
                            <h2 className="mb-md">🏢 Link to Your College</h2>
                            <p className="text-secondary mb-lg">Please select your college and enter the 5-digit access code provided by the main administrator.</p>

                            <div className="form-group mb-lg">
                                <label className="form-label">Select College</label>
                                <select className="form-select" value={linkForm.collegeId} onChange={e => setLinkForm({ ...linkForm, collegeId: e.target.value })}>
                                    <option value="">-- Choose College --</option>
                                    {allColleges.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group mb-xl">
                                <label className="form-label">College Access Code</label>
                                <input
                                    className="form-input"
                                    placeholder="Enter 5-digit code"
                                    maxLength={5}
                                    value={linkForm.accessCode}
                                    onChange={e => setLinkForm({ ...linkForm, accessCode: e.target.value })}
                                />
                            </div>

                            <button className="btn btn-primary btn-block" onClick={linkCollege} disabled={linking}>
                                {linking ? 'Linking...' : 'Verify & Link College'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard */}
                {profile?.collegeId && view === 'dashboard' && (
                    <div className="animate-fade">
                        <div className="page-header">
                            <h1>College Admin Dashboard</h1>
                            <p>{profile?.college?.name || 'No college linked'} • {profile?.department}</p>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card"><div className="stat-icon purple">📚</div><div className="stat-value">{courses.length}</div><div className="stat-label">Courses</div></div>
                            <div className="stat-card"><div className="stat-icon green">💺</div><div className="stat-value">{courses.reduce((s: number, c: any) => s + c.totalSeats, 0)}</div><div className="stat-label">Total Seats</div></div>
                            <div className="stat-card"><div className="stat-icon cyan">📝</div><div className="stat-value">{courses.reduce((s: number, c: any) => s + (c._count?.applications || 0), 0)}</div><div className="stat-label">Applications</div></div>
                            <div className="stat-card"><div className="stat-icon amber">🎯</div><div className="stat-value">{courses.reduce((s: number, c: any) => s + (c._count?.allotments || 0), 0)}</div><div className="stat-label">Allotments</div></div>
                        </div>
                    </div>
                )}

                {/* Courses CRUD */}
                {profile?.collegeId && view === 'courses' && (
                    <div className="animate-fade">
                        <div className="flex-between mb-lg">
                            <div className="page-header" style={{ marginBottom: 0 }}><h1>📚 Course Management</h1></div>
                            <button className="btn btn-primary" onClick={() => { setEditingCourse(null); setCourseForm({ name: '', code: '', admissionType: 'UG', admissionMode: 'MERIT', totalSeats: 60, eligibilityPercentage: 60, tuitionFee: 25000, labFee: 5000, libraryFee: 2000, otherFee: 3000, installmentEnabled: false, scholarshipEnabled: false, unfilledSeatRule: 'CONVERT_TO_GENERAL' }); setShowForm(true); }}>
                                + Add Course
                            </button>
                        </div>

                        {showForm && (
                            <div className="card mb-lg">
                                <h3 className="card-title mb-lg">{editingCourse ? 'Edit Course' : 'New Course'}</h3>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Code</label><input className="form-input" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Admission Type</label><select className="form-select" value={courseForm.admissionType} onChange={e => setCourseForm({ ...courseForm, admissionType: e.target.value })}><option value="UG">UG</option><option value="PG">PG</option><option value="ENGINEERING">Engineering</option></select></div>
                                    <div className="form-group"><label className="form-label">Mode</label><select className="form-select" value={courseForm.admissionMode} onChange={e => setCourseForm({ ...courseForm, admissionMode: e.target.value })}><option value="MERIT">Merit</option><option value="DIRECT">Direct</option></select></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Total Seats</label><input type="number" className="form-input" value={courseForm.totalSeats} onChange={e => setCourseForm({ ...courseForm, totalSeats: +e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Min Eligibility %</label><input type="number" className="form-input" value={courseForm.eligibilityPercentage} onChange={e => setCourseForm({ ...courseForm, eligibilityPercentage: +e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Tuition Fee (₹)</label><input type="number" className="form-input" value={courseForm.tuitionFee} onChange={e => setCourseForm({ ...courseForm, tuitionFee: +e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Lab Fee (₹)</label><input type="number" className="form-input" value={courseForm.labFee} onChange={e => setCourseForm({ ...courseForm, labFee: +e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Library Fee (₹)</label><input type="number" className="form-input" value={courseForm.libraryFee} onChange={e => setCourseForm({ ...courseForm, libraryFee: +e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Other Fee (₹)</label><input type="number" className="form-input" value={courseForm.otherFee} onChange={e => setCourseForm({ ...courseForm, otherFee: +e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Unfilled Seats</label><select className="form-select" value={courseForm.unfilledSeatRule} onChange={e => setCourseForm({ ...courseForm, unfilledSeatRule: e.target.value })}><option value="CONVERT_TO_GENERAL">Convert to General</option><option value="CARRY_FORWARD">Carry Forward</option></select></div>
                                    <div className="form-group" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', paddingBottom: '16px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={courseForm.installmentEnabled} onChange={e => setCourseForm({ ...courseForm, installmentEnabled: e.target.checked })} /> Installment
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={courseForm.scholarshipEnabled} onChange={e => setCourseForm({ ...courseForm, scholarshipEnabled: e.target.checked })} /> Scholarship
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    <button className="btn btn-primary" onClick={saveCourse} disabled={loading}>{loading ? '⏳' : editingCourse ? 'Update' : 'Create'}</button>
                                    <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                </div>
                            </div>
                        )}

                        <div className="grid-2">
                            {courses.map((c: any) => (
                                <div key={c.id} className="course-card">
                                    <div className="flex-between"><h3>{c.name}</h3><span className="badge badge-primary">{c.admissionType}</span></div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.code} • {c.admissionMode}</p>
                                    <div className="course-meta">
                                        <span className="badge badge-info">Seats: {c.totalSeats}</span>
                                        <span className="badge badge-warning">Min: {c.eligibilityPercentage}%</span>
                                        <span className="badge badge-default">{c._count?.applications || 0} apps</span>
                                    </div>
                                    <div className="course-fee">₹{c.totalFee?.toLocaleString()}</div>
                                    <div className="flex gap-sm mt-lg">
                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏ Edit</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteCourse(c.id)}>🗑 Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reservation */}
                {view === 'reservation' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>⚖️ Reservation Matrix</h1><p>Set category-wise seat reservation for each course</p></div>
                        {courses.map((c: any) => (
                            <div key={c.id} className="card mb-lg">
                                <div className="flex-between mb-lg">
                                    <div><h3>{c.name}</h3><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Seats: {c.totalSeats}</p></div>
                                    <span className="badge badge-primary">{c.admissionType}</span>
                                </div>
                                {c.reservations?.length > 0 ? (
                                    <div className="table-container mb-md">
                                        <table>
                                            <thead><tr><th>Category</th><th>%</th><th>Seats</th></tr></thead>
                                            <tbody>
                                                {c.reservations.map((r: any) => (
                                                    <tr key={r.id}><td>{r.category}</td><td>{r.percentage}%</td><td>{r.seats}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>No reservation set. Configure below:</p>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px' }}>
                                    {reservationForm.map((r, i) => (
                                        <div key={r.category}>
                                            <label className="form-label" style={{ fontSize: '0.75rem' }}>{r.category}</label>
                                            <input type="number" className="form-input" style={{ padding: '8px' }} value={r.percentage} onChange={e => {
                                                const updated = [...reservationForm];
                                                updated[i].percentage = +e.target.value;
                                                setReservationForm(updated);
                                            }} />
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.8rem', color: reservationForm.reduce((s, r) => s + r.percentage, 0) === 100 ? 'var(--success)' : 'var(--danger)' }}>
                                    Total: {reservationForm.reduce((s, r) => s + r.percentage, 0)}% {reservationForm.reduce((s, r) => s + r.percentage, 0) === 100 ? '✓' : '(must be 100%)'}
                                </p>
                                <button className="btn btn-primary btn-sm mt-md" onClick={() => saveReservation(c.id)} disabled={reservationForm.reduce((s, r) => s + r.percentage, 0) !== 100 || loading}>
                                    Save Reservation
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Seat Matrix */}
                {profile?.collegeId && view === 'seatmatrix' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>🎯 Seat Matrix</h1></div>
                        <div className="form-group"><label className="form-label">Select Course</label><select className="form-select" onChange={e => { const c = courses.find((x: any) => x.id === e.target.value); setSelectedCourse(c); if (c) { loadSeatMatrix(c.id); loadApplications(c.id); } }}>
                            <option value="">-- Select --</option>
                            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select></div>
                        {selectedCourse && seatMatrix.length > 0 && (
                            <div className="card">
                                <h3 className="mb-lg">{selectedCourse.name} — Seat Distribution</h3>
                                <div className="table-container mb-lg">
                                    <table><thead><tr><th>Category</th><th>Total</th><th>Filled</th><th>Available</th><th>Fill %</th></tr></thead>
                                        <tbody>{seatMatrix.map((s: any) => (
                                            <tr key={s.category}><td><strong>{s.category}</strong></td><td>{s.totalSeats}</td><td>{s.filledSeats}</td><td>{s.availableSeats}</td>
                                                <td><div className="progress-bar"><div className="progress-fill" style={{ width: `${s.totalSeats ? (s.filledSeats / s.totalSeats) * 100 : 0}%` }} /></div></td></tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                                {applications.length > 0 && (
                                    <>
                                        <h3 className="mb-md">Applications ({applications.length})</h3>
                                        <div className="table-container">
                                            <table><thead><tr><th>Name</th><th>Marks</th><th>Category</th><th>Gender</th><th>Status</th><th>Actions</th></tr></thead>
                                                <tbody>{applications.map((a: any) => (
                                                    <tr key={a.id}>
                                                        <td><strong>{a.student?.user?.name}</strong></td>
                                                        <td>{a.appliedMarks}%</td>
                                                        <td><span className="badge badge-default">{a.student?.category}</span></td>
                                                        <td>{a.student?.gender || '—'}</td>
                                                        <td><span className={`badge ${a.status === 'ALLOTTED' ? 'badge-success' : a.status === 'ELIGIBLE' ? 'badge-primary' : a.status === 'REJECTED' ? 'badge-danger' : 'badge-default'}`}>{a.status}</span></td>
                                                        <td>
                                                            <div className="flex gap-sm">
                                                                <button className="btn btn-info btn-sm" onClick={() => viewApplication(a.id)}>👁 View</button>
                                                                {(a.status === 'PENDING' || a.status === 'ELIGIBLE') && (
                                                                    <>
                                                                        <button className="btn btn-success btn-sm" onClick={() => updateApplicationStatus(a.id, 'ELIGIBLE')}>✓</button>
                                                                        <button className="btn btn-danger btn-sm" onClick={() => updateApplicationStatus(a.id, 'REJECTED')}>✕</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}</tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}



                {/* Analytics */}
                {profile?.collegeId && view === 'analytics' && (
                    <div className="animate-fade">
                        <div className="page-header"><h1>📈 Analytics</h1><p>Student application analytics for your college</p></div>
                        {analytics ? (
                            <>
                                <div className="grid-3 mb-xl">
                                    {analytics.categoryBreakdown?.map((c: any) => (
                                        <div key={c.category} className="stat-card">
                                            <div className="stat-icon purple">🏷️</div>
                                            <div className="stat-value">{c.count}</div>
                                            <div className="stat-label">{c.category}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="card mb-lg">
                                    <h3 className="mb-md">Application Status Distribution</h3>
                                    <div className="grid-3" style={{ gap: '12px' }}>
                                        {analytics.statusBreakdown?.map((s: any) => (
                                            <div key={s.status} style={{ padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{s.count}</div>
                                                <span className={`badge ${s.status === 'ELIGIBLE' ? 'badge-info' : s.status === 'REJECTED' ? 'badge-danger' : s.status === 'ALLOTTED' ? 'badge-success' : 'badge-default'}`}>{s.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="card">
                                    <h3 className="mb-md">Course Fill Rate</h3>
                                    <div className="table-container">
                                        <table>
                                            <thead><tr><th>Course</th><th>Code</th><th>Seats</th><th>Apps</th><th>Allotted</th><th>Fill %</th></tr></thead>
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
                        ) : <div className="empty-state"><div className="icon">📈</div><p>No analytics data available yet.</p></div>}
                    </div>
                )}
            </main>

            {/* Application Detail Modal */}
            {appDetail && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={() => setAppDetail(null)}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', maxWidth: '800px', width: '100%', maxHeight: '85vh', overflow: 'auto', padding: '32px' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex-between mb-lg">
                            <h2>📋 Student Application</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setAppDetail(null)}>✕ Close</button>
                        </div>

                        <div className="grid-2 mb-lg" style={{ gap: '10px', fontSize: '0.9rem' }}>
                            <div><strong>Name:</strong> {appDetail.student?.user?.name}</div>
                            <div><strong>Email:</strong> {appDetail.student?.user?.email}</div>
                            <div><strong>Phone:</strong> {appDetail.student?.user?.phone}</div>
                            <div><strong>Gender:</strong> {appDetail.student?.gender || '—'}</div>
                            <div><strong>DOB:</strong> {appDetail.student?.dateOfBirth || '—'}</div>
                            <div><strong>Category:</strong> <span className="badge badge-info">{appDetail.student?.category}</span></div>
                        </div>

                        <h4 className="mb-sm" style={{ color: 'var(--primary-light)' }}>👨‍👩‍👧 Parent Details</h4>
                        <div className="grid-2 mb-lg" style={{ gap: '10px', fontSize: '0.9rem' }}>
                            <div><strong>Father:</strong> {appDetail.student?.fatherName || '—'}</div>
                            <div><strong>Mother:</strong> {appDetail.student?.motherName || '—'}</div>
                            <div><strong>Occupation:</strong> {appDetail.student?.parentOccupation || '—'}</div>
                            <div><strong>Income:</strong> ₹{appDetail.student?.annualIncome?.toLocaleString() || '—'}</div>
                        </div>

                        <h4 className="mb-sm" style={{ color: 'var(--primary-light)' }}>🏠 Address</h4>
                        <p className="mb-lg" style={{ fontSize: '0.9rem' }}>{appDetail.student?.address || '—'}</p>

                        <h4 className="mb-sm" style={{ color: 'var(--primary-light)' }}>🎓 Academic Records</h4>
                        <div className="table-container mb-lg">
                            <table>
                                <thead><tr><th>Exam</th><th>Board</th><th>Hall Ticket</th><th>Marks</th><th>%</th></tr></thead>
                                <tbody>
                                    <tr><td>SSC</td><td>{appDetail.student?.sscBoard || '—'}</td><td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{appDetail.student?.sscHallTicket || '—'}</td><td>{appDetail.student?.sscMarks}/{appDetail.student?.sscTotal}</td><td><strong>{appDetail.student?.sscPercentage}%</strong></td></tr>
                                    {appDetail.student?.interMarks && <tr><td>Inter</td><td>{appDetail.student?.interBoard || '—'}</td><td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{appDetail.student?.interHallTicket || '—'}</td><td>{appDetail.student?.interMarks}/{appDetail.student?.interTotal}</td><td><strong>{appDetail.student?.interPercentage}%</strong></td></tr>}
                                    {appDetail.student?.ugMarks && <tr><td>UG</td><td>—</td><td>—</td><td>{appDetail.student?.ugMarks}/{appDetail.student?.ugTotal}</td><td><strong>{appDetail.student?.ugPercentage}%</strong></td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <h4 className="mb-sm" style={{ color: 'var(--primary-light)' }}>📎 Documents</h4>
                        <div className="grid-2 mb-lg" style={{ gap: '8px' }}>
                            {[
                                { label: 'Aadhaar Card', status: appDetail.student?.aadhaarEncrypted ? '✅' : '—' },
                                { label: 'SSC Memo', status: appDetail.student?.sscDocStatus },
                                { label: 'Inter Memo', status: appDetail.student?.interDocStatus },
                                { label: 'Income Cert', status: appDetail.student?.incomeDocStatus },
                                { label: 'Caste Cert', status: appDetail.student?.casteDocStatus },
                                { label: 'Passport Photo', status: 'Mock' },
                                { label: "Mother's Passbook", status: 'Mock' },
                            ].map(d => (
                                <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: '6px', fontSize: '0.85rem' }}>
                                    <span>{d.label}</span>
                                    <span className={`badge ${d.status === 'AUTO_FETCHED' || d.status === '✅' || d.status === 'Mock' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                        {d.status === 'AUTO_FETCHED' ? '✅ Fetched' : d.status === '✅' ? '✅ Verified' : d.status === 'Mock' ? '✅ Mock' : d.status || '—'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <div>
                                <strong>Applied For:</strong> {appDetail.course?.name} • {appDetail.course?.college?.name}<br />
                                <strong>Applied Marks:</strong> {appDetail.appliedMarks}% • <strong>Status:</strong>
                                <span className={`badge ${appDetail.status === 'ELIGIBLE' ? 'badge-info' : appDetail.status === 'REJECTED' ? 'badge-danger' : 'badge-success'}`} style={{ marginLeft: '8px' }}>{appDetail.status}</span>
                            </div>
                            <div className="flex gap-sm">
                                <button className="btn btn-success btn-sm" onClick={() => { updateApplicationStatus(appDetail.id, 'ELIGIBLE'); setAppDetail(null); }}>✓ Approve</button>
                                <button className="btn btn-danger btn-sm" onClick={() => { updateApplicationStatus(appDetail.id, 'REJECTED'); setAppDetail(null); }}>✕ Reject</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
