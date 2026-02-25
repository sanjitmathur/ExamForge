import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { UserRound, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

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
    if (newPassword.length < 6) {
      setPwErr('New password must be at least 6 characters.');
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

  if (!user) return null;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1>Manage Account</h1>
        <p>Update your profile and security settings</p>
      </div>

      <div className="settings-stack">
        {/* Account Information */}
        <div className="card animate-slide-up">
          <h2><span className="card-icon"><UserRound size={15} strokeWidth={2.2} /></span> Account Information</h2>
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
        <div className="card animate-slide-up" style={{ animationDelay: '0.06s' }}>
          <h2><span className="card-icon"><KeyRound size={15} strokeWidth={2.2} /></span> Change Password</h2>
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
