/**
 * pages/customers/CustomerForm.jsx — Create & Edit Customer form.
 *
 * Smart reuse: ONE component handles BOTH create and edit.
 * How? We check if `:id` is in the URL params.
 *   - /customers/new      → id is undefined → CREATE mode
 *   - /customers/abc/edit → id = "abc"      → EDIT mode
 *
 * Edit mode: on mount, fetch the existing customer data and pre-fill the form.
 * Create mode: form starts empty.
 *
 * React hooks:
 * - useParams: read :id from URL
 * - useState: form fields, errors, loading states
 * - useEffect: fetch customer data when in edit mode
 * - useNavigate: go back after save
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';

// ── Form initial state ────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
  status: 'active',
};

export default function CustomerForm() {
  const { id } = useParams();         // undefined when creating
  const navigate = useNavigate();
  const isEditing = Boolean(id);       // true if id exists in URL

  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});       // field-level errors
  const [loading, setLoading]   = useState(false);    // submit loading
  const [fetching, setFetching] = useState(isEditing); // fetch loading (edit only)

  // ── Fetch Existing Customer (Edit Mode) ───────────────────────────
  useEffect(() => {
    if (!isEditing) return;

    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/api/customers/${id}`);
        // Pre-fill form with existing data
        // res.data might have null fields → replace with '' for controlled inputs
        setForm({
          name:    res.data.name    || '',
          email:   res.data.email   || '',
          phone:   res.data.phone   || '',
          company: res.data.company || '',
          notes:   res.data.notes   || '',
          status:  res.data.status  || 'active',
        });
      } catch {
        toast.error('Failed to load customer data');
        navigate('/customers');
      } finally {
        setFetching(false);
      }
    };

    fetchCustomer();
  }, [id, isEditing, navigate]);

  // ── Input Handler ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field as user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // ── Client-side Validation ────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim())  newErrors.name  = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (form.phone && !/^[\d\s\+\-\(\)]+$/.test(form.phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;  // true = valid
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Only send non-empty optional fields
      const payload = {
        name:   form.name.trim(),
        email:  form.email.trim(),
        status: form.status,
        ...(form.phone.trim()   && { phone:   form.phone.trim() }),
        ...(form.company.trim() && { company: form.company.trim() }),
        ...(form.notes.trim()   && { notes:   form.notes.trim() }),
      };

      if (isEditing) {
        await api.put(`/api/customers/${id}`, payload);
        toast.success('Customer updated successfully!');
        navigate(`/customers/${id}`);     // Go to detail page
      } else {
        const res = await api.post('/api/customers', payload);
        toast.success('Customer created successfully!');
        navigate(`/customers/${res.data.id}`);  // Go to new customer's detail
      }
    } catch (err) {
      const msg = err.response?.data?.detail;
      if (typeof msg === 'string') {
        toast.error(msg);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="spinner-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link
          to={isEditing ? `/customers/${id}` : '/customers'}
          style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--space-3)' }}
        >
          ← Back
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {isEditing ? 'Edit Customer' : 'New Customer'}
        </h1>
        <p className="text-muted text-sm" style={{ marginTop: 4 }}>
          {isEditing ? 'Update the customer information below.' : 'Fill in the details to add a new customer.'}
        </p>
      </div>

      {/* Form Card */}
      <form className="card" onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* Row: Name + Email */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Full Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className={`form-input ${errors.name ? 'error' : ''}`}
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                autoFocus
              />
              {errors.name && <span className="form-error">⚠ {errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Email Address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className={`form-input ${errors.email ? 'error' : ''}`}
                type="email"
                name="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="form-error">⚠ {errors.email}</span>}
            </div>
          </div>

          {/* Row: Phone + Company */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className={`form-input ${errors.phone ? 'error' : ''}`}
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone && <span className="form-error">⚠ {errors.phone}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                className="form-input"
                type="text"
                name="company"
                placeholder="Acme Corporation"
                value={form.company}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label className="form-label">Status</label>
            <select
              className="form-input"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              name="notes"
              placeholder="Any additional notes about this customer..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Form Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)',
          }}>
            <Link
              to={isEditing ? `/customers/${id}` : '/customers'}
              className="btn btn-secondary"
            >
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving...</>
                : isEditing ? '💾 Save Changes' : '+ Create Customer'
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
