/**
 * components/layout/AppLayout.jsx
 *
 * The main layout wrapper used on all authenticated pages.
 * Composes: Sidebar + main content area with <Outlet />
 *
 * <Outlet /> is a React Router concept — it renders whatever
 * child route is currently active.
 *
 * Example: When user is at /customers, <Outlet /> renders <CustomerList />
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
