import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { papersAPI, questionsAPI, generateAPI } from '../services/api';
import type { UploadedPaper, GeneratedPaperListItem, QuestionStats } from '../types';

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

export default function DashboardPage() {
  const [papers, setPapers] = useState<UploadedPaper[]>([]);
  const [generated, setGenerated] = useState<GeneratedPaperListItem[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);

  useEffect(() => {
    papersAPI.list().then(r => setPapers(r.data)).catch(() => {});
    generateAPI.list().then(r => setGenerated(r.data)).catch(() => {});
    questionsAPI.stats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const toPieData = (obj: Record<string, number>) =>
    Object.entries(obj).map(([name, value]) => ({ name, value }));

  const statCards = [
    { label: 'Papers Uploaded', value: papers.length, color: '#6366f1' },
    { label: 'Questions Extracted', value: stats?.total_questions ?? 0, color: '#06b6d4' },
    { label: 'Papers Generated', value: generated.length, color: '#10b981' },
    { label: 'Subjects Covered', value: stats ? Object.keys(stats.by_subject).length : 0, color: '#f59e0b' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your exam paper library</p>
      </div>

      <div className="stats-grid">
        {statCards.map(card => (
          <div key={card.label} className="stat-card" style={{ borderTop: `3px solid ${card.color}` }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      {stats && stats.total_questions > 0 && (
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 700 }}>Questions by Type</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={toPieData(stats.by_type)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} label strokeWidth={0}>
                  {toPieData(stats.by_type).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 700 }}>Questions by Difficulty</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={toPieData(stats.by_difficulty)} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Uploads</h3>
            <Link to="/upload" className="btn btn-outline btn-sm">Upload</Link>
          </div>
          {papers.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#128196;</p>
              <p>No papers yet</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>File</th><th>Subject</th><th>Status</th></tr></thead>
                <tbody>
                  {papers.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.original_filename}</td>
                      <td>{p.subject || '-'}</td>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Generated Papers</h3>
            <Link to="/generate" className="btn btn-outline btn-sm">Generate</Link>
          </div>
          {generated.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#9889;</p>
              <p>No papers generated yet</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Subject</th><th>Status</th></tr></thead>
                <tbody>
                  {generated.slice(0, 5).map(g => (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 500 }}><Link to={`/paper/${g.id}`}>{g.title}</Link></td>
                      <td>{g.subject || '-'}</td>
                      <td><span className={`badge badge-${g.status}`}>{g.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
