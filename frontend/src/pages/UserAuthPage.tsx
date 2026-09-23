import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import { Sun, Moon, BrainCircuit, Zap, Shield } from 'lucide-react';

export default function UserAuthPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ identifier, password });
      login(res.data.access_token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-panel-left">
        <div className="auth-panel-orbs">
          <div className="auth-orb" />
          <div className="auth-orb" />
          <div className="auth-orb" />
        </div>
        <div className="auth-panel-left-content">
          <Link to="/login" className="auth-brand">ExamForge</Link>
          <h2 className="auth-panel-title">
            Craft Perfect Exams<br />
            <span className="auth-panel-gradient">in Minutes, Not Hours</span>
          </h2>
          <p className="auth-panel-desc">
            AI-powered question paper generation for educators who value their time.
          </p>
          <div className="auth-panel-features">
            <div className="auth-panel-feature">
              <div className="auth-panel-feature-icon"><BrainCircuit size={16} strokeWidth={2} /></div>
              <span>AI Question Extraction</span>
            </div>
            <div className="auth-panel-feature">
              <div className="auth-panel-feature-icon"><Zap size={16} strokeWidth={2} /></div>
              <span>Instant Paper Generation</span>
            </div>
            <div className="auth-panel-feature">
              <div className="auth-panel-feature-icon"><Shield size={16} strokeWidth={2} /></div>
              <span>Curriculum Aligned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-panel-right-top">
          <Link to="/login" className="back-link">&larr; Back</Link>
          <button
            className="auth-theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={15} strokeWidth={2} /> : <Sun size={15} strokeWidth={2} />}
          </button>
        </div>
        <div className="auth-form-wrapper">
          <div className="auth-form-card">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-subtitle">Sign in to your teacher account</p>
            {error && <div className="login-error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email or Username</label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
            <div className="auth-switch">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </div>
            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.85rem' }}>
              Forgot password? Contact your school administrator to reset credentials.
            </div>
            <div className="auth-alt-link">
              School administrator? <Link to="/login/admin">Admin Portal &rarr;</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
