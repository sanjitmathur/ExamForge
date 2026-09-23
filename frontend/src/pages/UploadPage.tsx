import { useState, useRef, useEffect, type FormEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { papersAPI } from '../services/api';
import { BOARDS, GRADES, SUBJECTS } from '../constants';
import type { UploadedPaper } from '../types';
import { X, AlertCircle } from 'lucide-react';

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
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
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
            p.id === id ? { ...p, status: res.data.status, error_message: res.data.error_message } : p
          ));
        }
      } catch {
        clearInterval(pollingRef.current[id]);
        delete pollingRef.current[id];
      }
    }, 2000);
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter(f => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');
    });
    setFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select or drop at least one exam paper file (PDF, DOCX, or image) to upload.');
      fileRef.current?.click();
      return;
    }
    if (!board || !grade || !subject) {
      setError('Please select Board, Grade, and Subject before uploading.');
      return;
    }
    setError('');
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const newlyAdded: UploadedPaper[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: i + 1, total: files.length });
      try {
        const res = await papersAPI.upload(files[i], board, grade, subject);
        newlyAdded.push(res.data);
        startPolling(res.data.id);
      } catch (err: any) {
        errors.push(`${files[i].name}: ${err.response?.data?.detail || 'Upload failed'}`);
      }
    }

    if (newlyAdded.length > 0) {
      setPapers(prev => [...newlyAdded, ...prev]);
    }
    if (errors.length > 0) {
      setError(errors.join(' | '));
    }
    setFiles([]);
    if (fileRef.current) fileRef.current.value = '';
    setUploading(false);
    setUploadProgress(null);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const hasCompletedPapers = papers.some(p => p.status === 'completed' && p.question_count > 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Upload Papers</h1>
        <p>Upload past exam papers (single or batch) for AI question extraction</p>
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
              multiple
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files) addFiles(e.target.files);
              }}
            />
            {files.length > 0 ? (
              <div>
                <p style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>&#128196;</p>
                <p style={{ color: 'var(--gray-800)', fontWeight: 600, fontSize: '0.95rem' }}>
                  {files.length} {files.length === 1 ? 'file' : 'files'} selected for batch upload
                </p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--primary)' }}>
                  + Click or drop more files to add to batch
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>&#8682;</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--gray-700)', fontWeight: 600 }}>
                  Drop files here or click to browse
                </p>
                <p>Select single or multiple PDFs, DOCX, JPG, PNG (max 20MB per file)</p>
              </>
            )}
          </div>

          {/* Staged files preview list */}
          {files.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)' }}>
                Staged for upload ({files.length}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {files.map((f, idx) => (
                  <span
                    key={`${f.name}-${idx}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--gray-100)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.8rem',
                      color: 'var(--gray-800)',
                    }}
                  >
                    <span>{f.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                      ({(f.size / (1024 * 1024)).toFixed(1)}MB)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', display: 'flex' }}
                      title="Remove from batch"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? (
                <>
                  <span className="spinner" />{' '}
                  {uploadProgress ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...` : 'Uploading...'}
                </>
              ) : (
                files.length > 1 ? `Upload & Analyze (${files.length} Papers)` : 'Upload & Analyze'
              )}
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
                      <td style={{ fontWeight: 500 }}>
                        <div>{p.original_filename}</div>
                        {p.status === 'failed' && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--danger)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} />
                            <span>{p.error_message || 'Processing failed. Please check document quality and retry.'}</span>
                          </div>
                        )}
                      </td>
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
