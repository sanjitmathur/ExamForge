import { useState, useRef, useEffect, type FormEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { papersAPI } from '../services/api';
import { BOARDS, GRADES, SUBJECTS } from '../constants';
import type { UploadedPaper } from '../types';

const STATUS_CONFIG: Record<string, { label: string; dots: number; active?: boolean; error?: boolean }> = {
  pending:    { label: 'Queued', dots: 0, active: true },
  extracting: { label: 'Reading document...', dots: 1, active: true },
  analyzing:  { label: 'Extracting questions...', dots: 2, active: true },
  completed:  { label: 'Done', dots: 3 },
  failed:     { label: 'Failed', dots: 0, error: true },
};

function StatusDots({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, dots: 0 };
  const totalDots = 3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div className="status-dots">
        {Array.from({ length: totalDots }).map((_, i) => (
          <span
            key={i}
            className={`status-dot${
              config.error ? ' error' :
              i < config.dots ? ' filled' :
              i === config.dots && config.active ? ' active' : ''
            }`}
          />
        ))}
      </div>
      <span className="status-label">{config.label}</span>
    </div>
  );
}

export default function UploadPage() {
  const [board, setBoard] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [papers, setPapers] = useState<UploadedPaper[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    loadPapers();
    return () => {
      Object.values(pollingRef.current).forEach(clearInterval);
    };
  }, []);

  const loadPapers = async () => {
    try {
      const res = await papersAPI.list();
      setPapers(res.data);
      res.data.forEach((p) => {
        if (['pending', 'extracting', 'analyzing'].includes(p.status)) {
          startPolling(p.id);
        }
      });
    } catch { /* ignore */ }
  };

  const startPolling = (id: number) => {
    if (pollingRef.current[id]) return;
    pollingRef.current[id] = setInterval(async () => {
      try {
        const res = await papersAPI.status(id);
        if (!['pending', 'extracting', 'analyzing'].includes(res.data.status)) {
          clearInterval(pollingRef.current[id]);
          delete pollingRef.current[id];
          loadPapers();
        } else {
          setPapers(prev => prev.map(p =>
            p.id === id ? { ...p, status: res.data.status } : p
          ));
        }
      } catch {
        clearInterval(pollingRef.current[id]);
        delete pollingRef.current[id];
      }
    }, 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !board || !grade || !subject) {
      setError('Please fill all fields and select a file');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const res = await papersAPI.upload(file, board, grade, subject);
      setPapers(prev => [res.data, ...prev]);
      startPolling(res.data.id);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = async (id: number) => {
    try {
      await papersAPI.retry(id);
      setPapers(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'pending', error_message: null } : p
      ));
      startPolling(id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Retry failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this paper and its extracted questions?')) return;
    try {
      await papersAPI.delete(id);
      setPapers(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const hasCompletedPapers = papers.some(p => p.status === 'completed' && p.question_count > 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Upload Paper</h1>
        <p>Upload previous year papers for AI analysis and question extraction</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Board <span className="required-star">*</span></label>
              <select value={board} onChange={e => setBoard(e.target.value)} required>
                <option value="">Select board</option>
                {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Grade <span className="required-star">*</span></label>
              <select value={grade} onChange={e => setGrade(e.target.value)} required>
                <option value="">Select grade</option>
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Subject <span className="required-star">*</span></label>
              <select value={subject} onChange={e => setSubject(e.target.value)} required>
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div
            className={`upload-area${dragging ? ' dragging' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>&#128196;</p>
                <p style={{ color: 'var(--gray-800)', fontWeight: 600, fontSize: '0.9rem' }}>{file.name}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Click to change file</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>&#8682;</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--gray-700)', fontWeight: 600 }}>
                  Drop a file here or click to browse
                </p>
                <p>PDF, DOCX, JPG, PNG (max 20MB)</p>
              </>
            )}
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <><span className="spinner" /> Uploading...</> : 'Upload & Analyze'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem', fontWeight: 700 }}>Recent Uploads</h2>
        {papers.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>&#128196;</p>
            <p>No papers uploaded yet</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Subject</th>
                    <th>Progress</th>
                    <th>Questions</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.original_filename}</td>
                      <td>{p.subject || '-'}</td>
                      <td><StatusDots status={p.status} /></td>
                      <td style={{ fontWeight: 600 }}>{p.question_count}</td>
                      <td style={{ display: 'flex', gap: '0.25rem' }}>
                        {p.status === 'failed' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleRetry(p.id)} title="Retry analysis">
                            &#8635;
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)} title="Delete">
                          &#10005;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Post-upload guidance */}
            {hasCompletedPapers && (
              <div className="upload-guidance">
                <div className="upload-guidance-text">
                  Questions extracted! <Link to="/questions">View Question Bank</Link> or <Link to="/generate">Generate a Paper</Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
