import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Account info form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [schoolName, setSchoolName] = useState(user?.school_name || '');
  const [accountMsg, setAccountMsg] = useState('');
  const [accountErr, setAccountErr] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg('');
    setAccountErr('');
    setAccountLoading(true);
    try {
      const res = await authAPI.updateProfile({
        full_name: fullName,
        username,
        email,
        school_name: schoolName,
      });
      updateUser(res.data);
      setAccountMsg('Profile updated successfully.');
    } catch (err: any) {
      setAccountErr(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (newPassword !== confirmPassword) {
      setPwErr('New passwords do not match.');
      return;
    }
    if (newPassword.length < 4) {
      setPwErr('New password must be at least 4 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwErr(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account, appearance, and session</p>
      </div>

      <div className="settings-grid">
        {/* Appearance */}
        <div className="card animate-slide-up">
          <h2><span className="card-icon">{'\uD83C\uDFA8'}</span> Appearance</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Theme</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
                Currently using <strong>{theme}</strong> mode
              </div>
            </div>
            <button
              className={`theme-toggle-btn ${theme}`}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  {theme === 'light' ? '\u263D' : '\u2600'}
                </span>
              </span>
              <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>

        {/* Session */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h2><span className="card-icon">{'\uD83D\uDD12'}</span> Session</h2>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Logged in as</div>
            <div style={{ fontWeight: 700, marginTop: '0.4rem', fontSize: '0.95rem' }}>{user.email}</div>
            <div className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`} style={{ marginTop: '0.6rem' }}>
              {user.role}
            </div>
          </div>
          <button className="btn btn-danger" onClick={handleLogout} style={{ width: '100%' }}>
            Logout
          </button>
        </div>

        {/* Account Information */}
        <div className="card full-width animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2><span className="card-icon">{'\uD83D\uDC64'}</span> Account Information</h2>
          {accountMsg && <div className="feedback-success">{accountMsg}</div>}
          {accountErr && <div className="login-error">{accountErr}</div>}
          <form onSubmit={handleAccountSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>School / Organization</label>
                <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={accountLoading}>
              {accountLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card full-width animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2><span className="card-icon">{'\uD83D\uDD10'}</span> Change Password</h2>
          {pwMsg && <div className="feedback-success">{pwMsg}</div>}
          {pwErr && <div className="login-error">{pwErr}</div>}
          <form onSubmit={handlePasswordChange}>
            <div className="form-row">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
