import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/customers', label: 'Customers' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Branding */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', letterSpacing: '-0.01em' }}>
          CMS
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
          Customer Portal
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all var(--transition)',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
            {user?.full_name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
            {user?.role === 'admin' ? 'Admin' : 'User'}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm w-full"
          style={{ justifyContent: 'center' }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
