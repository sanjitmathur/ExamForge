import { useState, useRef, useEffect, type FormEvent, type DragEvent } from 'react';
import { papersAPI } from '../services/api';
import { BOARDS, GRADES, SUBJECTS } from '../constants';
import type { UploadedPaper } from '../types';

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
      // Start polling for any in-progress papers
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
              <label>Board</label>
              <select value={board} onChange={e => setBoard(e.target.value)} required>
                <option value="">Select board</option>
                {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Grade</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} required>
                <option value="">Select grade</option>
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Subject</label>
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
              <p style={{ color: 'var(--gray-800)', fontWeight: 500 }}>{file.name}</p>
            ) : (
              <>
                <p style={{ fontSize: '1rem', color: 'var(--gray-600)' }}>
                  Drop a file here or click to browse
                </p>
                <p>PDF, DOCX, JPG, PNG (max 20MB)</p>
              </>
            )}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? <><span className="spinner" /> Uploading...</> : 'Upload & Analyze'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Uploads</h2>
        {papers.length === 0 ? (
          <div className="empty-state"><p>No papers uploaded yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Board</th>
                  <th>Grade</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Questions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {papers.map(p => (
                  <tr key={p.id}>
                    <td>{p.original_filename}</td>
                    <td>{p.board || '-'}</td>
                    <td>{p.grade_level || '-'}</td>
                    <td>{p.subject || '-'}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    <td>{p.question_count}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDelete(p.id)}>
                        Delete
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
  );
}
