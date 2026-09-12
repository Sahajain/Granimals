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
              background: '#fff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />

        <Routes>
          <Route path="/login" element={<Login />} />

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
