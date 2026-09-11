/**
 * pages/Login.jsx — Login & Register page.
 *
 * React concepts used:
 * - useState: tracks form fields + which tab is active (login/register)
 * - useNavigate: redirect after successful login
 * - useAuth: call login() from AuthContext
 * - Controlled form: every input value lives in React state
 *
 * Flow:
 *   User fills form → handleSubmit → authContext.login() / api.post('/register')
 *   → success → navigate('/customers')
 *   → error  → setError(message) → shows error banner
 */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Which tab is active: 'login' or 'register'
  const [tab, setTab] = useState('login');

  // Form state — controlled inputs
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    password: '',
  });

  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in → redirect to customers
  if (user) return <Navigate to="/customers" replace />;

  // ── Generic input handler ─────────────────────────────────────────
  // One handler for all inputs — uses input's name attribute
  const handleChange = (e) => {
    setError('');  // Clear error on any change
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevent default browser form submission
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
        navigate('/customers');
      } else {
        // Register
        if (!form.full_name.trim()) {
          setError('Full name is required'); return;
        }
        await api.post('/api/auth/register', {
          email: form.email,
          full_name: form.full_name,
          password: form.password,
        });
        toast.success('Account created! Please log in.');
        setTab('login');
        setForm(prev => ({ ...prev, password: '', full_name: '' }));
      }
    } catch (err) {
      // Extract error message from axios error
      const msg = err.response?.data?.detail || 'Something went wrong. Try again.';
      setError(Array.isArray(msg) ? msg[0]?.msg : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 'var(--space-4)',
    }}>
      {/* Background gradient glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 56, height: 56, background: 'var(--primary)',
            borderRadius: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, margin: '0 auto var(--space-4)',
            boxShadow: 'var(--shadow-glow)',
          }}>🚀</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Customer Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            {tab === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)', padding: 4,
            marginBottom: 'var(--space-6)',
          }}>
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '8px 0',
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  border: 'none', fontSize: '0.875rem', fontWeight: 500,
                  background: tab === t ? 'var(--bg-surface)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'var(--danger-light)', border: '1px solid var(--danger)',
              color: '#991b1b', borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: '0.875rem', marginBottom: 'var(--space-4)',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  name="full_name"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus={tab === 'login'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                placeholder={tab === 'register' ? 'At least 8 characters' : '••••••••'}
                value={form.password}
                onChange={handleChange}
                required
                minLength={tab === 'register' ? 8 : undefined}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> Loading...</>
              ) : (
                tab === 'login' ? '→ Sign In' : '→ Create Account'
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: 'var(--space-4)' }}>
          Customer Management System © 2026
        </p>
      </div>
    </div>
  );
}
