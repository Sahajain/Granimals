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

  const handleChange = (e) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
        navigate('/customers');
      } else {
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
      background: 'var(--bg)',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)' }}>
            Customer Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {tab === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1.5rem',
          }}>
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.5rem 0',
                  border: 'none',
                  background: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  transition: 'color 150ms ease',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--danger-light)',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              borderRadius: 'var(--radius-md)',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                name="email"
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
                value={form.password}
                onChange={handleChange}
                required
                minLength={tab === 'register' ? 8 : undefined}
              />
              {tab === 'register' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  At least 8 characters
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: '0.25rem' }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Loading...</>
              ) : (
                tab === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Customer Management System
        </p>
      </div>
    </div>
  );
}
