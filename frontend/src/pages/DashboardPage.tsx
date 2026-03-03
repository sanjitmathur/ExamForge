import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileUp, HelpCircle, Zap, BookOpen, Upload, Rocket, Check, ChevronRight, Sparkles } from 'lucide-react';
import { papersAPI, questionsAPI, generateAPI } from '../services/api';
import type { UploadedPaper, GeneratedPaperListItem, QuestionStats } from '../types';

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

  const statCards = [
    { label: 'Papers Uploaded', value: papers.length },
    { label: 'Questions Extracted', value: stats?.total_questions ?? 0 },
    { label: 'Papers Generated', value: generated.length },
    { label: 'Subjects Covered', value: stats ? Object.keys(stats.by_subject).length : 0 },
  ];

  const allZero = statCards.every(c => c.value === 0);
  const questionCount = stats?.total_questions ?? 0;

  const workflowSteps = [
    { label: 'Upload Papers', to: '/upload', count: papers.length, done: papers.length > 0 },
    { label: 'Question Bank', to: '/questions', count: questionCount, done: questionCount > 0 },
    { label: 'Generate Paper', to: '/generate', count: generated.length, done: generated.length > 0 },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your exam paper library</p>
      </div>

      {/* Onboarding banner for new users */}
      {allZero && (
        <div className="onboarding-banner">
          <div className="onboarding-banner-icon">
            <Sparkles size={18} strokeWidth={2} />
          </div>
          <div className="onboarding-banner-text">
            <strong>Welcome to ExamForge!</strong> Start by uploading a previous exam paper.
            We'll extract questions into your bank, then you can generate new papers with AI.
          </div>
        </div>
      )}

      {/* Workflow steps — always visible */}
      <div className="workflow-steps">
        {workflowSteps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Link to={step.to} className={`workflow-step${step.done ? ' completed' : ''}`}>
              <div className="workflow-step-num">
                {step.done ? <Check size={16} strokeWidth={2.5} /> : i + 1}
              </div>
              <div className="workflow-step-info">
                <span className="workflow-step-label">{step.label}</span>
                {step.count > 0 && (
                  <span className="workflow-step-count">{step.count} {step.count === 1 ? 'item' : 'items'}</span>
                )}
              </div>
            </Link>
            {i < workflowSteps.length - 1 && (
              <span className="workflow-step-arrow">
                <ChevronRight size={18} strokeWidth={2} />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Stat Cards — hidden when all zero */}
      {!allZero && (
        <div className="dash-stats-grid">
          {statCards.map((card, i) => (
            <div key={card.label} className="dash-stat-card">
              <div className="dash-stat-icon">{STAT_ICONS[i]}</div>
              <div className="dash-stat-info">
                <div className="dash-stat-value">{card.value}</div>
                <div className="dash-stat-label">{card.label}</div>
              </div>
            </div>
          ))}
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
