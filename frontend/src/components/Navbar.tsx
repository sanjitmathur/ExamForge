import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Settings, UserRound, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleManageAccount = () => {
    setMenuOpen(false);
    navigate('/settings');
  };

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
          {theme === 'light' ? <Moon size={15} strokeWidth={2} /> : <Sun size={15} strokeWidth={2} />}
        </button>
        <div className="navbar-settings-wrap" ref={menuRef}>
          <button
            className={`settings-link${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            title="Settings"
          >
            <Settings size={17} strokeWidth={2} />
          </button>
          {menuOpen && (
            <div className="navbar-dropdown">
              <button className="navbar-dropdown-item" onClick={handleManageAccount}>
                <UserRound size={15} strokeWidth={2} />
                Manage Account
              </button>
              <div className="navbar-dropdown-divider" />
              <button className="navbar-dropdown-item danger" onClick={handleLogout}>
                <LogOut size={15} strokeWidth={2} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
