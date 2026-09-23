import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronDown, Plus, X, Sparkles } from 'lucide-react';
import { generateAPI, questionsAPI } from '../services/api';
import { BOARDS, GRADES, SUBJECTS, DIFFICULTIES } from '../constants';
import type { GeneratedPaperListItem, GenerationQuota } from '../types';

export default function GeneratePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [board, setBoard] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [difficultyMix, setDifficultyMix] = useState<Record<string, number>>({ easy: 3, medium: 4, hard: 3 });
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState(180);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [papers, setPapers] = useState<GeneratedPaperListItem[]>([]);
  const [quota, setQuota] = useState<GenerationQuota | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    generateAPI.list().then(r => setPapers(r.data)).catch(() => {});
    generateAPI.quota().then(r => setQuota(r.data)).catch(() => {});
    questionsAPI.topics().then(r => setAvailableTopics(r.data)).catch(() => {});
  }, []);

  const toggleTopic = (t: string) => {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleAddCustomTopic = () => {
    const trimmed = customTopicInput.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics(prev => [...prev, trimmed]);
      setCustomTopicInput('');
    }
  };

  const handleDeletePaper = async (id: number) => {
    if (!confirm('Delete this generated paper?')) return;
    try {
      await generateAPI.delete(id);
      setPapers(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !board || !grade || !subject) {
      setError('Please fill all required fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await generateAPI.create({
        title, board, grade_level: grade, subject, topics,
        difficulty_mix: difficultyMix,
        total_marks: totalMarks,
        duration_minutes: duration,
        additional_instructions: instructions || undefined,
      });
      navigate(`/paper/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Generation failed');
      setLoading(false);
    }
  };

  const totalQuestions = Object.values(difficultyMix).reduce((a, b) => a + b, 0);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>Generate Paper</h1>
          <p>Create a new AI-generated exam paper from your question bank or curriculum standards</p>
        </div>
        {quota && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: quota.remaining > 0 ? 'var(--primary-light)' : 'rgba(239, 68, 68, 0.1)',
            color: quota.remaining > 0 ? 'var(--primary)' : 'var(--danger)',
            border: `1px solid ${quota.remaining > 0 ? 'var(--border)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}>
            <Sparkles size={14} />
            <span>Daily Quota: {quota.remaining} of {quota.limit} left</span>
          </div>
        )}
      </div>

      <div>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label>Paper Title <span className="required-star">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Mid-Term Examination 2026" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Board <span className="required-star">*</span></label>
                <select value={board} onChange={e => setBoard(e.target.value)} required>
                  <option value="">Select</option>
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Grade <span className="required-star">*</span></label>
                <select value={grade} onChange={e => setGrade(e.target.value)} required>
                  <option value="">Select</option>
                  {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Subject <span className="required-star">*</span></label>
                <select value={subject} onChange={e => setSubject(e.target.value)} required>
                  <option value="">Select</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Collapsible Advanced Options */}
            <button
              type="button"
              className="collapsible-header"
              onClick={() => setShowAdvanced(prev => !prev)}
            >
              <span className="collapsible-header-label">Advanced Options</span>
              <ChevronDown size={18} className={`collapsible-chevron${showAdvanced ? ' open' : ''}`} />
            </button>
            <div className={`collapsible-body${showAdvanced ? ' open' : ''}`}>
              <div className="form-row">
                <div className="form-group">
                  <label>Total Marks</label>
                  <input type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} min={10} />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={15} />
                </div>
              </div>

              <div className="form-group">
                <label>Difficulty Mix</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {DIFFICULTIES.map(d => (
                    <div key={d.value} style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem' }}>{d.label}</label>
                      <input type="number" min={0} max={20}
                        value={difficultyMix[d.value] || 0}
                        onChange={e => setDifficultyMix(prev => ({ ...prev, [d.value]: Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="form-hint" style={{ marginTop: '0.4rem', color: 'var(--gray-600)', fontSize: '0.82rem' }}>
                  <strong>{totalQuestions} questions</strong> across <strong>{totalMarks} marks</strong>
                  {totalQuestions > 0 ? ` (average ~${(totalMarks / totalQuestions).toFixed(1)} marks per question)` : ''}.
                </div>
              </div>

              <div className="form-group">
                <label>Topics & Curriculum Units (optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Type custom topic (e.g. Thermodynamics, Algebra) and press Add..."
                    value={customTopicInput}
                    onChange={e => setCustomTopicInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTopic(); } }}
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleAddCustomTopic}>
                    <Plus size={14} style={{ marginRight: '2px' }} /> Add
                  </button>
                </div>

                {/* Selected topics */}
                {topics.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', alignSelf: 'center' }}>Selected:</span>
                    {topics.map(t => (
                      <span
                        key={t}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          border: '1px solid var(--border)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => toggleTopic(t)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                          title="Remove topic"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {availableTopics.length > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.35rem' }}>Suggestions from your uploaded papers:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {availableTopics.filter(t => !topics.includes(t)).map(t => (
                        <button
                          key={t}
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.78rem', padding: '2px 8px' }}
                          onClick={() => toggleTopic(t)}
                        >
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Additional Instructions</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                  placeholder="Any specific requirements for the paper..." />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" /> Generating...</> : 'Generate Paper'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 700 }}>Previously Generated</h3>
          {papers.length === 0 ? (
            <div className="empty-state"><p>No papers generated yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {papers.map(p => (
                    <tr key={p.id}>
                      <td><Link to={`/paper/${p.id}`}>{p.title}</Link></td>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeletePaper(p.id)} title="Delete">
                          &#10005;
                        </button>
                      </td>
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
