import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileUp, HelpCircle, Zap, BookOpen, Upload, Rocket } from 'lucide-react';
import { papersAPI, questionsAPI, generateAPI } from '../services/api';
import type { UploadedPaper, GeneratedPaperListItem, QuestionStats } from '../types';

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const STAT_ICONS = [
  <FileUp size={20} strokeWidth={1.8} />,
  <HelpCircle size={20} strokeWidth={1.8} />,
  <Zap size={20} strokeWidth={1.8} />,
  <BookOpen size={20} strokeWidth={1.8} />,
];

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
    { label: 'Papers Uploaded', value: papers.length },
    { label: 'Questions Extracted', value: stats?.total_questions ?? 0 },
    { label: 'Papers Generated', value: generated.length },
    { label: 'Subjects Covered', value: stats ? Object.keys(stats.by_subject).length : 0 },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your exam paper library</p>
      </div>

      {/* Stat Cards */}
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

      {/* Charts */}
      {stats && stats.total_questions > 0 && (
        <div className="grid-2 dash-charts">
          <div className="dash-glass-card">
            <h3 className="dash-card-title">Questions by Type</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={toPieData(stats.by_type)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} label strokeWidth={0}>
                  {toPieData(stats.by_type).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)', fontSize: '0.8rem', color: 'var(--gray-800)' }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-glass-card">
            <h3 className="dash-card-title">Questions by Difficulty</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={toPieData(stats.by_difficulty)} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)', fontSize: '0.8rem', color: 'var(--gray-800)' }} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tables */}
      <div className="grid-2">
        <div className="dash-glass-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Recent Uploads</h3>
            <Link to="/upload" className="dash-action-btn"><Upload size={14} strokeWidth={2} /> Upload</Link>
          </div>
          {papers.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><FileUp size={28} strokeWidth={1.5} /></div>
              <p>No papers uploaded yet</p>
              <Link to="/upload" className="dash-empty-link">Upload your first paper &rarr;</Link>
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

        <div className="dash-glass-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Recent Generated Papers</h3>
            <Link to="/generate" className="dash-action-btn"><Rocket size={14} strokeWidth={2} /> Generate</Link>
          </div>
          {generated.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Zap size={28} strokeWidth={1.5} /></div>
              <p>No papers generated yet</p>
              <Link to="/generate" className="dash-empty-link">Generate your first paper &rarr;</Link>
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
