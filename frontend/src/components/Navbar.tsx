import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className={`navbar${isAdmin ? ' navbar-admin' : ''}`}>
      <div className="navbar-brand">
        <NavLink to={isAdmin ? '/admin' : '/'}>{isAdmin ? 'ExamForge Admin' : 'ExamForge'}</NavLink>
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
            <NavLink to="/questions" className={({ isActive }) => isActive ? 'active' : ''}>Question Bank</NavLink>
            <NavLink to="/generate" className={({ isActive }) => isActive ? 'active' : ''}>Generate</NavLink>
          </>
        )}
      </div>
      <div className="navbar-user">
        {isAdmin && <span className="badge badge-admin">Admin</span>}
        <span>{user.full_name}</span>
        <button onClick={handleLogout} className="btn btn-outline">Logout</button>
      </div>
    </nav>
  );
}
