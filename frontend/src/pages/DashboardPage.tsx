import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { papersAPI, questionsAPI, generateAPI } from '../services/api';
import type { UploadedPaper, GeneratedPaperListItem, QuestionStats } from '../types';

const COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your exam paper library</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Papers Uploaded</div>
          <div className="stat-value">{papers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Questions Extracted</div>
          <div className="stat-value">{stats?.total_questions ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Papers Generated</div>
          <div className="stat-value">{generated.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Subjects Covered</div>
          <div className="stat-value">{stats ? Object.keys(stats.by_subject).length : 0}</div>
        </div>
      </div>

      {stats && stats.total_questions > 0 && (
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Questions by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={toPieData(stats.by_type)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {toPieData(stats.by_type).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Questions by Difficulty</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={toPieData(stats.by_difficulty)}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Recent Uploads</h3>
            <Link to="/upload" className="btn btn-outline btn-sm">Upload</Link>
          </div>
          {papers.length === 0 ? (
            <div className="empty-state"><p>No papers yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>File</th><th>Subject</th><th>Status</th></tr></thead>
                <tbody>
                  {papers.slice(0, 5).map(p => (
                    <tr key={p.id}>
                      <td>{p.original_filename}</td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Recent Generated Papers</h3>
            <Link to="/generate" className="btn btn-outline btn-sm">Generate</Link>
          </div>
          {generated.length === 0 ? (
            <div className="empty-state"><p>No papers generated yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Subject</th><th>Status</th></tr></thead>
                <tbody>
                  {generated.slice(0, 5).map(g => (
                    <tr key={g.id}>
                      <td><Link to={`/paper/${g.id}`}>{g.title}</Link></td>
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
