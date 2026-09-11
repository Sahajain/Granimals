/**
 * App.jsx — Root component: sets up routing and global providers.
 *
 * React Router Concepts:
 * - BrowserRouter  → enables URL-based routing (uses browser history API)
 * - Routes         → container for all Route definitions
 * - Route          → maps a URL path to a component
 * - Navigate       → programmatically redirect (like a redirect rule)
 * - Outlet         → renders the matched child route inside a layout
 *
 * Our Route Structure:
 *   /login                → Login page (public)
 *   /                     → ProtectedRoute → AppLayout (sidebar + topbar)
 *     /customers          → Customer list
 *     /customers/new      → Create customer form
 *     /customers/:id      → Customer detail
 *     /customers/:id/edit → Edit customer form
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages (we'll build these in Phase 5 — placeholders for now)
import Login from './pages/Login';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetail from './pages/customers/CustomerDetail';

export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider wraps everything → makes useAuth() available everywhere */}
      <AuthProvider>

        {/* Toaster: shows toast notifications (react-hot-toast) */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* ── Public Routes ──────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />

          {/* ── Protected Routes (require login) ───────────────────── */}
          {/* All routes inside AppLayout share the sidebar + topbar */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Default: redirect / → /customers */}
            <Route index element={<Navigate to="/customers" replace />} />

            {/* Customer routes */}
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/new" element={<CustomerForm />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="customers/:id/edit" element={<CustomerForm />} />
          </Route>

          {/* Catch-all: redirect unknown URLs to customers */}
          <Route path="*" element={<Navigate to="/customers" replace />} />
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}
