import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import type { AdminStats } from '../types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch {
      setError('Failed to load admin stats');
    } finally {
      setLoading(false);
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

  if (error || !stats) {
    return (
      <div className="page">
        <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.total_users, accent: 'var(--primary)' },
    { label: 'Admins', value: stats.total_admins, accent: 'var(--admin-accent, #8b5cf6)' },
    { label: 'Papers Uploaded', value: stats.total_papers_uploaded, accent: 'var(--success)' },
    { label: 'Questions', value: stats.total_questions, accent: 'var(--warning)' },
    { label: 'Papers Generated', value: stats.total_papers_generated, accent: 'var(--info, #0ea5e9)' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Platform Overview</h1>
        <p>Admin dashboard with platform-wide statistics</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="stat-card stat-card-accent"
            style={{ borderLeftColor: card.accent }}
          >
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--gray-800)' }}>Recent Users</h2>
          <Link to="/admin/users" className="btn btn-outline btn-sm">View All</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>School</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_users.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.school_name || '\u2014'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {stats.recent_users.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                    No users yet
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
