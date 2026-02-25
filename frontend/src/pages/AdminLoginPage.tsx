import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import { Sun, Moon, ShieldCheck, Users, BarChart3 } from 'lucide-react';

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ identifier, password });
      if (res.data.user.role !== 'admin') {
        setError('This account does not have admin access');
        return;
      }
      login(res.data.access_token, res.data.user);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left decorative panel — admin variant */}
      <div className="auth-panel-left auth-panel-admin">
        <div className="auth-panel-orbs">
          <div className="auth-orb" />
          <div className="auth-orb" />
          <div className="auth-orb" />
        </div>
        <div className="auth-panel-left-content">
          <Link to="/login" className="auth-brand">ExamForge<span className="auth-brand-admin">Admin</span></Link>
          <h2 className="auth-panel-title">
            Platform<br />
            <span className="auth-panel-gradient">Administration</span>
          </h2>
          <p className="auth-panel-desc">
            Manage users, monitor activity, and configure the ExamForge platform.
          </p>
          <div className="auth-panel-features">
            <div className="auth-panel-feature">
              <div className="auth-panel-feature-icon"><Users size={16} strokeWidth={2} /></div>
              <span>User Management</span>
            </div>
            <div className="auth-panel-feature">
              <div className="auth-panel-feature-icon"><BarChart3 size={16} strokeWidth={2} /></div>
              <span>Platform Analytics</span>
            </div>
            <div className="auth-panel-feature">
              <div className="auth-panel-feature-icon"><ShieldCheck size={16} strokeWidth={2} /></div>
              <span>Access Control</span>
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
            <div className="auth-admin-badge">Admin Portal</div>
            <h1 className="auth-form-title">Admin Sign In</h1>
            <p className="auth-form-subtitle">Enter your admin credentials to continue</p>
            {error && <div className="login-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email or Username</label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="admin@example.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
            <div className="auth-alt-link">
              <Link to="/login/user">&larr; Sign in as Teacher instead</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
