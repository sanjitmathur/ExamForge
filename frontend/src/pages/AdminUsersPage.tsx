import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import type { User } from '../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFullName, setCreateFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSchool, setCreateSchool] = useState('');
  const [createRole, setCreateRole] = useState('user');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await adminAPI.listUsers();
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!newPassword.trim()) return;
    setResetLoading(true);
    setFeedback(null);
    try {
      await adminAPI.resetPassword(userId, newPassword);
      setFeedback({ type: 'success', message: 'Password reset successfully' });
      setResetUserId(null);
      setNewPassword('');
    } catch {
      setFeedback({ type: 'error', message: 'Failed to reset password' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setFeedback(null);
    try {
      await adminAPI.createUser({
        email: createEmail,
        full_name: createFullName,
        password: createPassword,
        school_name: createSchool || undefined,
        role: createRole,
      });
      setFeedback({ type: 'success', message: 'User created successfully' });
      setShowCreateForm(false);
      setCreateFullName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateSchool('');
      setCreateRole('user');
      await loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to create user' });
    } finally {
      setCreateLoading(false);
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

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>User Management</h1>
          <p>View and manage all registered users</p>
        </div>
        {!showCreateForm && (
          <button className="btn btn-primary" onClick={() => { setShowCreateForm(true); setFeedback(null); }}>
            + Add User
          </button>
        )}
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {feedback && (
        <div
          className={feedback.type === 'success' ? 'admin-feedback-success' : 'login-error'}
          style={{ marginBottom: '1rem' }}
        >
          {feedback.message}
        </div>
      )}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '1rem' }}>Create New User</h2>
          <form onSubmit={handleCreateUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={createFullName} onChange={e => setCreateFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} required minLength={6} />
              </div>
              <div className="form-group">
                <label>School Name <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
                <input type="text" value={createSchool} onChange={e => setCreateSchool(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: '200px' }}>
              <label>Role</label>
              <select value={createRole} onChange={e => setCreateRole(e.target.value)}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={createLoading}>
                {createLoading ? <span className="spinner" /> : 'Create User'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>School</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.school_name || '\u2014'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {resetUserId === u.id ? (
                      <div className="reset-password-inline">
                        <input
                          type="password"
                          placeholder="New password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          style={{ width: '140px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleResetPassword(u.id)}
                          disabled={resetLoading || !newPassword.trim()}
                        >
                          {resetLoading ? <span className="spinner" /> : 'Confirm'}
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setResetUserId(null); setNewPassword(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => { setResetUserId(u.id); setNewPassword(''); setFeedback(null); }}
                      >
                        Reset Password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
