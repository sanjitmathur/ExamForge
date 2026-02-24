import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className={`navbar${isAdmin ? ' navbar-admin' : ''}`}>
      <div className="navbar-brand">
        <NavLink to={isAdmin ? '/admin' : '/'}>
          ExamForge<span className={isAdmin ? 'navbar-admin-suffix' : 'navbar-user-suffix'}>{isAdmin ? 'Admin' : 'User'}</span>
        </NavLink>
      </div>
      <div className="navbar-links">
        {isAdmin ? (
          <>
            <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>Overview</NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
            <NavLink to="/upload" className={({ isActive }) => isActive ? 'active' : ''}>Upload</NavLink>
            <NavLink to="/questions" className={({ isActive }) => isActive ? 'active' : ''}>Questions</NavLink>
            <NavLink to="/generate" className={({ isActive }) => isActive ? 'active' : ''}>Generate</NavLink>
          </>
        )}
      </div>
      <div className="navbar-user">
        {isAdmin && <span className="badge badge-admin">Admin</span>}
        <span>{user.full_name}</span>
        <button
          className="theme-toggle-nav"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '\u263D' : '\u2600'}
        </button>
        <NavLink to="/settings" className={({ isActive }) => `settings-link${isActive ? ' active' : ''}`} title="Settings">
          &#9881;
        </NavLink>
      </div>
    </nav>
  );
}
