/**
 * pages/customers/CustomerList.jsx — The main customer table page.
 *
 * Features:
 * - Live search (debounced 400ms so we don't hit API on every keystroke)
 * - Status filter dropdown
 * - Pagination (previous/next + page numbers)
 * - Delete with confirmation modal
 * - Loading skeleton + empty state
 * - Link to create/edit/view each customer
 *
 * React hooks used:
 * - useState: customers, pagination, search, filter, loading, error, delete modal
 * - useEffect: fetch customers when page/search/status changes
 * - useCallback: stable function reference for fetchCustomers
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

// ── Status Badge Component ────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:   'badge-active',
    inactive: 'badge-inactive',
    prospect: 'badge-prospect',
  };
  return <span className={`badge ${map[status] || 'badge-inactive'}`}>{status}</span>;
}

// ── Confirm Delete Modal ──────────────────────────────────────────────
function DeleteModal({ customer, onConfirm, onCancel, loading }) {
  if (!customer) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Customer</h2>
          <button onClick={onCancel} className="btn btn-ghost btn-sm">✕</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{customer.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Deleting...</> : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function CustomerList() {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────
  const [customers, setCustomers]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Search + filter
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Delete modal
  const [deleting, setDeleting]       = useState(null);   // customer to delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Debounce Search ───────────────────────────────────────────────
  // Wait 400ms after user stops typing before triggering fetch.
  // Without this: every keystroke fires an API call.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);  // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);  // Cancel if user types again
  }, [search]);

  // ── Fetch Customers ───────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;

      const res = await api.get('/api/customers', { params });
      setCustomers(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  // Re-fetch whenever page, search, or status changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Delete ────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/customers/${deleting.id}`);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
      fetchCustomers();  // Refresh the list
    } catch {
      toast.error('Failed to delete customer');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Customers</h1>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>
            {total} {total === 1 ? 'customer' : 'customers'} total
          </p>
        </div>
        <Link to="/customers/new" className="btn btn-primary">
          + Add Customer
        </Link>
      </div>

      {/* ── Search + Filter Bar ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
        <div className="filter-bar">
          {/* Search */}
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <span className="search-icon" style={{ fontSize: 14 }}>🔍</span>
            <input
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              type="text"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: 140 }}
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>

          {/* Clear button */}
          {(search || status) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setStatus(''); setPage(1); }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          color: '#991b1b', borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-4)', marginBottom: 'var(--space-4)',
        }}>
          ⚠️ {error}
          <button onClick={fetchCustomers} style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          /* Loading skeleton */
          <div style={{ padding: 'var(--space-8)' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                height: 20, background: 'var(--bg-elevated)',
                borderRadius: 4, marginBottom: 12,
                opacity: 1 - i * 0.15,
              }} className="animate-pulse" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          /* Empty state */
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">
              {search || status ? 'No customers match your filters' : 'No customers yet'}
            </div>
            <p className="text-sm text-muted" style={{ marginTop: 8, marginBottom: 'var(--space-4)' }}>
              {search || status ? 'Try adjusting your search or filters' : 'Add your first customer to get started'}
            </p>
            {!search && !status && (
              <Link to="/customers/new" className="btn btn-primary">+ Add Customer</Link>
            )}
          </div>
        ) : (
          /* Data table */
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      <span
                        style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--primary)' }}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        {customer.name}
                      </span>
                    </td>
                    <td className="text-muted">{customer.email}</td>
                    <td>{customer.company || <span className="text-muted">—</span>}</td>
                    <td className="text-muted">{customer.phone || <span className="text-muted">—</span>}</td>
                    <td><StatusBadge status={customer.status} /></td>
                    <td className="text-muted text-sm">
                      {new Date(customer.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Link to={`/customers/${customer.id}`} className="btn btn-ghost btn-sm" title="View">
                          👁
                        </Link>
                        <Link to={`/customers/${customer.id}/edit`} className="btn btn-ghost btn-sm" title="Edit">
                          ✏️
                        </Link>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setDeleting(customer)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────── */}
        {!loading && customers.length > 0 && (
          <div className="pagination" style={{ padding: 'var(--space-4) var(--space-6)' }}>
            <span className="pagination-info">
              Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, total)} of {total}
            </span>

            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >‹</button>

              {/* Page number buttons */}
              {[...Array(Math.min(pages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`page-btn ${p === page ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              {pages > 5 && <span style={{ color: 'var(--text-tertiary)' }}>...</span>}

              <button
                className="page-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === pages}
              >›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────────── */}
      <DeleteModal
        customer={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
