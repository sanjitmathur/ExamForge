import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, Upload } from 'lucide-react';
import { questionsAPI } from '../services/api';
import { BOARDS, GRADES, SUBJECTS, QUESTION_TYPES, DIFFICULTIES } from '../constants';
import type { ExtractedQuestion } from '../types';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    questionsAPI.topics().then(r => setTopics(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    questionsAPI.list(params)
      .then(r => setQuestions(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const setFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const typeLabel = (t: string) => QUESTION_TYPES.find(qt => qt.value === t)?.label || t;

  // Count active hidden filters (board, type, topic)
  const hiddenFilterCount = [filters.board, filters.question_type, filters.topic].filter(Boolean).length;

  const hasAnyData = !loading && questions.length === 0 && Object.values(filters).every(v => !v);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Question Bank</h1>
        <p>{questions.length} questions in your bank</p>
      </div>

      {/* Primary filters */}
      <div className="filter-bar">
        <div className="form-group">
          <label>Subject</label>
          <select value={filters.subject || ''} onChange={e => setFilter('subject', e.target.value)}>
            <option value="">All</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Grade</label>
          <select value={filters.grade_level || ''} onChange={e => setFilter('grade_level', e.target.value)}>
            <option value="">All</option>
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Difficulty</label>
          <select value={filters.difficulty || ''} onChange={e => setFilter('difficulty', e.target.value)}>
            <option value="">All</option>
            {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <button
          type="button"
          className={`more-filters-btn${showMoreFilters ? ' active' : ''}`}
          onClick={() => setShowMoreFilters(prev => !prev)}
        >
          <SlidersHorizontal size={14} strokeWidth={2} />
          More filters
          {hiddenFilterCount > 0 && <span className="more-filters-count">{hiddenFilterCount}</span>}
        </button>
      </div>

      {/* Secondary filters */}
      {showMoreFilters && (
        <div className="filter-bar" style={{ marginTop: '-0.75rem' }}>
          <div className="form-group">
            <label>Board</label>
            <select value={filters.board || ''} onChange={e => setFilter('board', e.target.value)}>
              <option value="">All</option>
              {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={filters.question_type || ''} onChange={e => setFilter('question_type', e.target.value)}>
              <option value="">All</option>
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Topic</label>
            <select value={filters.topic || ''} onChange={e => setFilter('topic', e.target.value)}>
              <option value="">All</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : hasAnyData ? (
        <div className="empty-state">
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}><Upload size={36} strokeWidth={1.5} /></div>
          <p>No questions in your bank yet</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
            <Link to="/upload" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Upload papers
            </Link> to start building your question bank.
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <p>No questions match your filters</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
            Try adjusting or clearing some filters to see more results.
          </p>
        </div>
      ) : (
        questions.map(q => (
          <div key={q.id} className="question-card">
            <div className="question-text">{q.question_text}</div>
            {q.answer_text && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                <strong>Answer:</strong> {q.answer_text}
              </div>
            )}
            <div className="question-meta">
              <span className={`badge badge-${q.question_type}`}>{typeLabel(q.question_type)}</span>
              <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
              {q.topic && <span className="badge badge-topic">{q.topic}</span>}
              {q.marks && <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{q.marks} marks</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
