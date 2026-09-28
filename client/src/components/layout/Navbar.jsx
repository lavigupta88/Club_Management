import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Calendar, LayoutDashboard } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container container">
        <Link to="/" className="navbar-brand">
          <Calendar className="brand-icon" size={24} />
          <span className="brand-text text-gradient">TCET Events</span>
        </Link>

        <div className="navbar-links">
          <Link to="/events" className="nav-link">Events</Link>
          
          {user ? (
            <>
              {(user.role === 'admin' || user.role === 'organizer') && (
                <Link to="/admin" className="nav-link">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              )}
              {user.role === 'student' && (
                <Link to="/my-registrations" className="nav-link">My Tickets</Link>
              )}
              
              <div className="nav-user-dropdown">
                <button className="nav-user-btn">
                  <User size={18} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
                <div className="dropdown-menu glass-panel">
                  <button onClick={handleLogout} className="dropdown-item text-danger">
                    <LogOut size={16} />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
