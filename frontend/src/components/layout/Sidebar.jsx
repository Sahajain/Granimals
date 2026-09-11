/**
 * components/layout/Sidebar.jsx
 *
 * The left navigation sidebar. Shows:
 * - App logo/name
 * - Nav links (Dashboard, Customers)
 * - User info + Logout at the bottom
 *
 * NavLink from react-router-dom automatically adds an "active" class
 * when the current URL matches the link's path.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/customers', label: 'Customers', icon: '👥' },
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
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--primary)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: 'var(--shadow-glow)',
          }}>
            🚀
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              CMS
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Customer Portal
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600,
            color: 'var(--text-tertiary)', textTransform: 'uppercase',
            letterSpacing: '0.08em', padding: '0 8px',
          }}>
            Menu
          </span>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              marginBottom: '2px',
              transition: 'all var(--transition)',
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.style.color.includes('primary')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ── User Profile + Logout ─────────────────────────────── */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '12px',
        }}>
          {/* Avatar */}
          <div style={{
            width: 34, height: 34,
            background: 'var(--primary)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="truncate" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              {user?.full_name}
            </div>
            <div className="truncate" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {user?.role === 'admin' ? '⭐ Admin' : 'User'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-ghost w-full"
          style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
