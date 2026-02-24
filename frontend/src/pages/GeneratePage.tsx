import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateAPI, questionsAPI } from '../services/api';
import { BOARDS, GRADES, SUBJECTS, DIFFICULTIES } from '../constants';
import type { GeneratedPaperListItem } from '../types';

export default function GeneratePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [board, setBoard] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [difficultyMix, setDifficultyMix] = useState<Record<string, number>>({ easy: 3, medium: 4, hard: 3 });
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState(180);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [papers, setPapers] = useState<GeneratedPaperListItem[]>([]);

  useEffect(() => {
    generateAPI.list().then(r => setPapers(r.data)).catch(() => {});
    questionsAPI.topics().then(r => setAvailableTopics(r.data)).catch(() => {});
  }, []);

  const toggleTopic = (t: string) => {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Generate Paper</h1>
        <p>Create a new AI-generated exam paper from your question bank</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <form onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="form-group">
              <label>Paper Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Mid-Term Examination 2026" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Board *</label>
                <select value={board} onChange={e => setBoard(e.target.value)} required>
                  <option value="">Select</option>
                  {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Grade *</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} required>
                  <option value="">Select</option>
                  {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} required>
                  <option value="">Select</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

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
            </div>

            {availableTopics.length > 0 && (
              <div className="form-group">
                <label>Topics (optional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {availableTopics.map(t => (
                    <button key={t} type="button"
                      className={`btn btn-sm ${topics.includes(t) ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleTopic(t)}
                    >{t}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Additional Instructions</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                placeholder="Any specific requirements for the paper..." />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Generating...</> : 'Generate Paper'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Previously Generated</h3>
          {papers.length === 0 ? (
            <div className="empty-state"><p>No papers generated yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Status</th></tr></thead>
                <tbody>
                  {papers.map(p => (
                    <tr key={p.id}>
                      <td><Link to={`/paper/${p.id}`}>{p.title}</Link></td>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
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
