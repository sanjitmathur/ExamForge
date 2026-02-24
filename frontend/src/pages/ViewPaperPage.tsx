import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { generateAPI, chatAPI, exportAPI } from '../services/api';
import type { GeneratedPaper, ConversationMessage } from '../types';

export default function ViewPaperPage() {
  const { id } = useParams<{ id: string }>();
  const paperId = Number(id);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<'paper' | 'answer_key'>('paper');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    loadPaper();
    chatAPI.history(paperId).then(r => setMessages(r.data)).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [paperId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadPaper = async () => {
    try {
      const res = await generateAPI.get(paperId);
      setPaper(res.data);
      if (res.data.status === 'generating') {
        startPolling();
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await generateAPI.status(paperId);
        if (res.data.status !== 'generating') {
          clearInterval(pollRef.current!);
          pollRef.current = undefined;
          loadPaper();
        }
      } catch {
        clearInterval(pollRef.current!);
        pollRef.current = undefined;
      }
    }, 2000);
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sending) return;
    const msg = chatInput.trim();
    setChatInput('');
    setSending(true);
    try {
      const res = await chatAPI.send(paperId, msg);
      setPaper(res.data.paper);
      setMessages(res.data.messages);
    } catch { /* ignore */ }
    setSending(false);
  };

  const downloadFile = async (fetchFn: (id: number) => Promise<any>, filename: string) => {
    try {
      const res = await fetchFn(paperId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };

  if (loading) return <div className="page"><div className="empty-state"><span className="spinner" /></div></div>;
  if (!paper) return <div className="page"><div className="empty-state"><p>Paper not found</p></div></div>;

  if (paper.status === 'generating') {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
          <p style={{ marginTop: '1rem' }}>Generating your paper... This may take a minute.</p>
        </div>
      </div>
    );
  }

  if (paper.status === 'failed') {
    return (
      <div className="page">
        <div className="card">
          <h2>Generation Failed</h2>
          <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{paper.error_message}</p>
        </div>
      </div>
    );
  }

  const content = view === 'paper' ? paper.content_markdown : paper.answer_key_markdown;

  return (
    <div className="page" style={{ maxWidth: '100%', padding: '1rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.25rem' }}>{paper.title}</h1>
      </div>

      <div className="export-buttons">
        <button className="btn btn-outline btn-sm" onClick={() => downloadFile(exportAPI.paperPdf, `${paper.title}.pdf`)}>
          Paper PDF
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => downloadFile(exportAPI.paperWord, `${paper.title}.docx`)}>
          Paper Word
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => downloadFile(exportAPI.answerKeyPdf, `${paper.title} - Answer Key.pdf`)}>
          Answer Key PDF
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => downloadFile(exportAPI.answerKeyWord, `${paper.title} - Answer Key.docx`)}>
          Answer Key Word
        </button>
      </div>

      <div className="paper-view">
        <div className="paper-preview">
          <div className="toggle-group">
            <button className={view === 'paper' ? 'active' : ''} onClick={() => setView('paper')}>Paper</button>
            <button className={view === 'answer_key' ? 'active' : ''} onClick={() => setView('answer_key')}>Answer Key</button>
          </div>
          <ReactMarkdown>{content || ''}</ReactMarkdown>
        </div>

        <div className="chat-sidebar">
          <div className="chat-header">Refine with AI</div>
          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
                Ask AI to modify the paper. e.g. "Add 2 more MCQs" or "Make question 5 harder"
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.role}`}>
                {m.role === 'assistant' ? (
                  m.content.includes('===ANSWER_KEY===')
                    ? 'Paper updated with your changes.'
                    : m.content
                ) : m.content}
              </div>
            ))}
            {sending && <div className="chat-msg assistant"><span className="spinner" /></div>}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input" onSubmit={handleSend}>
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask AI to refine..."
              disabled={sending}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !chatInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
