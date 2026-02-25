import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import { Sun, Moon, BrainCircuit, Zap, Shield } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.register({
        email,
        username,
        password,
        full_name: fullName,
        school_name: schoolName || undefined,
      });
      login(res.data.access_token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
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
            Join Thousands of<br />
            <span className="auth-panel-gradient">Educators Worldwide</span>
          </h2>
          <p className="auth-panel-desc">
            Create your free account and start generating exam papers with AI in minutes.
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
            <h1 className="auth-form-title">Create your account</h1>
            <p className="auth-form-subtitle">Start building smarter exams today</p>
            {error && <div className="login-error">{error}</div>}
            <form onSubmit={handleSignup}>
              <div className="auth-form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="johndoe" required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@school.edu" required />
              </div>
              <div className="auth-form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                </div>
                <div className="form-group">
                  <label>School Name <span style={{ color: 'var(--gray-400)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Springfield High" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Create Account'}
              </button>
            </form>
            <div className="auth-switch">
              Already have an account? <Link to="/login/user">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
