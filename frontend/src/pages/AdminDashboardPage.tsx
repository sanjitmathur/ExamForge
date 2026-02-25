import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, FileUp, HelpCircle, Zap } from 'lucide-react';
import { adminAPI } from '../services/api';
import type { AdminStats } from '../types';

const STAT_ICONS = [
  <Users size={20} strokeWidth={1.8} />,
  <ShieldCheck size={20} strokeWidth={1.8} />,
  <FileUp size={20} strokeWidth={1.8} />,
  <HelpCircle size={20} strokeWidth={1.8} />,
  <Zap size={20} strokeWidth={1.8} />,
];

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
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
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
    { label: 'Total Users', value: stats.total_users },
    { label: 'Admins', value: stats.total_admins },
    { label: 'Papers Uploaded', value: stats.total_papers_uploaded },
    { label: 'Questions', value: stats.total_questions },
    { label: 'Papers Generated', value: stats.total_papers_generated },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Platform Overview</h1>
        <p>Admin dashboard with platform-wide statistics</p>
      </div>

      <div className="dash-stats-grid">
        {statCards.map((card, i) => (
          <div key={card.label} className="dash-stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="dash-stat-icon">{STAT_ICONS[i]}</div>
            <div className="dash-stat-info">
              <div className="dash-stat-value">{card.value}</div>
              <div className="dash-stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Users</h2>
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
                  <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.school_name || '\u2014'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {stats.recent_users.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2.5rem' }}>
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
