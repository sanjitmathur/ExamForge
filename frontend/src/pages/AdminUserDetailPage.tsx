import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import type { UserDetail } from '../types';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Password
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'uploaded' | 'generated'>('uploaded');

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminAPI.getUserDetail(parseInt(id));
      setUser(res.data);
    } catch {
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!user) return;
    setEditFullName(user.full_name);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditSchool(user.school_name || '');
    setEditRole(user.role);
    setEditing(true);
    setFeedback(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEditLoading(true);
    setFeedback(null);
    try {
      await adminAPI.updateUser(user.id, {
        full_name: editFullName,
        username: editUsername,
        email: editEmail,
        school_name: editSchool,
        role: editRole,
      });
      setFeedback({ type: 'success', message: 'User info updated successfully' });
      setEditing(false);
      await loadUser();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to update user' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !newPassword.trim()) return;
    setResetLoading(true);
    setFeedback(null);
    try {
      await adminAPI.resetPassword(user.id, newPassword);
      setFeedback({ type: 'success', message: 'Password reset successfully' });
      setNewPassword('');
      await loadUser();
    } catch {
      setFeedback({ type: 'error', message: 'Failed to reset password' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    setFeedback(null);
    try {
      await adminAPI.deleteUser(user.id);
      navigate('/admin/users');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to delete user' });
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="spinner" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page">
        <div className="login-error">{error || 'User not found'}</div>
        <button className="btn btn-outline" onClick={() => navigate('/admin/users')} style={{ marginTop: '1rem' }}>
          &larr; Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="back-link" onClick={() => navigate('/admin/users')}>
          &larr; Back to Users
        </button>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0 }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.full_name}
              <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                {user.role}
              </span>
            </h1>
            <p>Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!editing && (
              <button className="btn btn-outline btn-sm" onClick={startEditing}>Edit Info</button>
            )}
            <button
              className="btn btn-sm"
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'rgba(239,68,68,0.06)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              Delete User
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={feedback.type === 'success' ? 'admin-feedback-success' : 'login-error'}
          style={{ marginBottom: '1rem' }}
        >
          {feedback.message}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="delete-confirm-box">
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-700)', margin: '0 0 0.75rem 0' }}>
              Are you sure you want to delete <strong>{user.full_name}</strong> ({user.email})? This will permanently remove all their data including uploaded papers, questions, and generated papers. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-danger" onClick={handleDeleteUser}>Delete User</button>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Papers Uploaded</div>
          <div className="stat-value">{user.papers_uploaded}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Questions Extracted</div>
          <div className="stat-value">{user.questions_extracted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Papers Generated</div>
          <div className="stat-value">{user.papers_generated}</div>
        </div>
      </div>

      {/* Personal Info + Password — side by side */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Personal Info */}
        <div className="card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Personal Information
            {editing && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} style={{ fontSize: '0.9rem', padding: '2px 8px' }}>&times;</button>
            )}
          </h2>
          {editing ? (
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>School Name</label>
                <input type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} />
              </div>
              <div className="form-group" style={{ maxWidth: '180px' }}>
                <label>Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={editLoading}>
                  {editLoading ? <span className="spinner" /> : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="user-info-grid">
              <div className="user-info-row">
                <span className="user-info-label">Full Name</span>
                <span className="user-info-value">{user.full_name}</span>
              </div>
              <div className="user-info-row">
                <span className="user-info-label">Username</span>
                <span className="user-info-value">{user.username}</span>
              </div>
              <div className="user-info-row">
                <span className="user-info-label">Email</span>
                <span className="user-info-value">{user.email}</span>
              </div>
              <div className="user-info-row">
                <span className="user-info-label">School</span>
                <span className="user-info-value">{user.school_name || '—'}</span>
              </div>
              <div className="user-info-row">
                <span className="user-info-label">Role</span>
                <span className="user-info-value">
                  <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>{user.role}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Password Card */}
        <div className="card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Password Management
          </h2>
          <div className="user-info-row" style={{ marginBottom: '1.25rem' }}>
            <span className="user-info-label">Current Password</span>
            <span className="user-info-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user.plain_password ? (
                <>
                  <code className="password-display">
                    {showPassword ? user.plain_password : '\u2022'.repeat(Math.min(user.plain_password.length, 12))}
                  </code>
                  <button
                    className="password-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem', fontStyle: 'italic' }}>Set a new password below to view it here</span>
              )}
            </span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px', letterSpacing: '0.01em', textTransform: 'uppercase' }}>
              Set New Password
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleResetPassword}
                disabled={resetLoading || !newPassword.trim()}
              >
                {resetLoading ? <span className="spinner" /> : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Papers tabs */}
      <div className="card">
        <div className="user-detail-tabs">
          <button
            className={`user-detail-tab ${activeTab === 'uploaded' ? 'active' : ''}`}
            onClick={() => setActiveTab('uploaded')}
          >
            Uploaded Papers ({user.uploaded_papers.length})
          </button>
          <button
            className={`user-detail-tab ${activeTab === 'generated' ? 'active' : ''}`}
            onClick={() => setActiveTab('generated')}
          >
            Generated Papers ({user.generated_papers.length})
          </button>
        </div>

        {activeTab === 'uploaded' && (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            {user.uploaded_papers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Board</th>
                    <th>Grade</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Questions</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {user.uploaded_papers.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.original_filename}</td>
                      <td>{p.board || '—'}</td>
                      <td>{p.grade_level || '—'}</td>
                      <td>{p.subject || '—'}</td>
                      <td>
                        <span className={`badge badge-${p.status}`}>{p.status}</span>
                      </td>
                      <td>{p.question_count}</td>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No uploaded papers yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generated' && (
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            {user.generated_papers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Board</th>
                    <th>Grade</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {user.generated_papers.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.title}</td>
                      <td>{p.board || '—'}</td>
                      <td>{p.grade_level || '—'}</td>
                      <td>{p.subject || '—'}</td>
                      <td>
                        <span className={`badge badge-${p.status}`}>{p.status}</span>
                      </td>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No generated papers yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
