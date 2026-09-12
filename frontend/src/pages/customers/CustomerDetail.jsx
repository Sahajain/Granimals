/**
 * pages/customers/CustomerDetail.jsx — View a single customer's full details.
 *
 * Features:
 * - Fetches customer by :id from URL
 * - Shows all fields in a readable layout
 * - Edit button → navigates to edit form
 * - Delete button → confirmation modal → delete → back to list
 *
 * React hooks:
 * - useParams: get :id from URL
 * - useState: customer data, loading, error, delete modal
 * - useEffect: fetch on mount
 * - useNavigate: go back or to edit page
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

// ── Status Badge ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = { active: 'badge-active', inactive: 'badge-inactive' };
  return <span className={`badge ${map[status] || 'badge-inactive'}`}>{status}</span>;
}

// ── Detail Row ────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '140px 1fr',
      gap: 'var(--space-4)', padding: 'var(--space-4) 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontSize: '0.9rem' }}>{value || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</span>
    </div>
  );
}

export default function CustomerDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [customer, setCustomer]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/api/customers/${id}`);
        setCustomer(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Customer not found.');
        } else {
          setError('Failed to load customer.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/customers/${id}`);
      toast.success(`${customer.name} deleted`);
      navigate('/customers');
    } catch {
      toast.error('Failed to delete customer');
      setDeleting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="spinner-center"><div className="spinner spinner-lg" /></div>
  );

  // ── Error ─────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>{error}</h2>
      <Link to="/customers" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
        Back to Customers
      </Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link
          to="/customers"
          style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--space-3)' }}
        >
          ← All Customers
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{customer.name}</h1>
              <StatusBadge status={customer.status} />
            </div>
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>
              {customer.company || 'No company'} · Added {new Date(customer.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Link to={`/customers/${id}/edit`} className="btn btn-secondary">
              Edit
            </Link>
            <button className="btn btn-danger" onClick={() => setShowDelete(true)}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: 0 }}>Customer Information</h2>

        <div style={{ marginTop: 'var(--space-2)' }}>
          <DetailRow label="Full Name" value={customer.name} />
          <DetailRow label="Email"     value={
            <a href={`mailto:${customer.email}`} style={{ color: 'var(--primary)' }}>
              {customer.email}
            </a>
          } />
          <DetailRow label="Phone"     value={
            customer.phone
              ? <a href={`tel:${customer.phone}`} style={{ color: 'var(--primary)' }}>{customer.phone}</a>
              : null
          } />
          <DetailRow label="Company"   value={customer.company} />
          <DetailRow label="Status"    value={<StatusBadge status={customer.status} />} />
          <DetailRow label="Notes"     value={
            customer.notes
              ? <span style={{ whiteSpace: 'pre-wrap' }}>{customer.notes}</span>
              : null
          } />
          <DetailRow label="Created"   value={new Date(customer.created_at).toLocaleString('en-IN')} />
          <DetailRow label="Updated"   value={new Date(customer.updated_at).toLocaleString('en-IN')} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Customer</h2>
              <button onClick={() => setShowDelete(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{customer.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button onClick={() => setShowDelete(false)} className="btn btn-secondary" disabled={deleting}>
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger" disabled={deleting}>
              {deleting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
