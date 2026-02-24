import { useEffect, useState } from 'react';
import { questionsAPI } from '../services/api';
import { BOARDS, GRADES, SUBJECTS, QUESTION_TYPES, DIFFICULTIES } from '../constants';
import type { ExtractedQuestion } from '../types';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});

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

  return (
    <div className="page">
      <div className="page-header">
        <h1>Question Bank</h1>
        <p>{questions.length} questions in your bank</p>
      </div>

      <div className="filter-bar">
        <div className="form-group">
          <label>Board</label>
          <select value={filters.board || ''} onChange={e => setFilter('board', e.target.value)}>
            <option value="">All</option>
            {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
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
          <label>Subject</label>
          <select value={filters.subject || ''} onChange={e => setFilter('subject', e.target.value)}>
            <option value="">All</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
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
          <label>Difficulty</label>
          <select value={filters.difficulty || ''} onChange={e => setFilter('difficulty', e.target.value)}>
            <option value="">All</option>
            {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
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

      {loading ? (
        <div className="empty-state"><span className="spinner" /></div>
      ) : questions.length === 0 ? (
        <div className="empty-state"><p>No questions found. Upload papers to build your question bank.</p></div>
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
              {q.board && <span className="badge badge-board">{q.board}</span>}
              {q.topic && <span className="badge badge-topic">{q.topic}</span>}
              {q.bloom_level && <span className="badge badge-bloom">{q.bloom_level}</span>}
              {q.marks && <span className="badge badge-marks">{q.marks} marks</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
