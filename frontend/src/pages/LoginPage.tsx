import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="login-container">
      <button
        className="theme-toggle-floating"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '\u263D' : '\u2600'}
      </button>
      <div className="role-selector">
        <h1>ExamForge</h1>
        <p className="subtitle">AI-Powered Question Paper Generator</p>
        <div className="role-cards">
          <Link to="/login/admin" className="role-card">
            <div className="role-icon">&#128272;</div>
            <h2>Admin</h2>
            <p>Manage users, reset passwords, and oversee the platform</p>
          </Link>
          <Link to="/login/user" className="role-card">
            <div className="role-icon">&#128218;</div>
            <h2>Teacher</h2>
            <p>Upload papers, manage questions, and generate exams</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
