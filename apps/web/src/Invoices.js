import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

function Invoices() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
   const fetchInvoices = async () => {
  try {
    const token = localStorage.getItem('token');
    
    console.log('Fetching invoices...');
    console.log('Token exists:', !!token);
    console.log('User from context:', user);

    if (!token) {
      setError('No authentication token found. Please log in again.');
      setLoading(false);
      return;
    }

    const response = await fetch('http://localhost:5000/api/invoices?limit=50', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Invoices received:', data.length, 'items');
      setInvoices(data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      setError(`Failed to load invoices (${response.status})`);
    }
  } catch (err) {
    console.error('Network error fetching invoices:', err);
    setError('Network error while loading invoices');
  } finally {
    setLoading(false);
  }
};

    if (user?.id) {
      fetchInvoices();
    }
  }, [user?.id]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return 'bi-clock';
      case 'approved': return 'bi-check-circle';
      case 'paid': return 'bi-cash';
      case 'rejected': return 'bi-x-circle';
      default: return 'bi-file-earmark';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case 'pending': return '#fff3cd';
      case 'approved': return '#d4edda';
      case 'paid': return '#d1ecf1';
      case 'rejected': return '#f8d7da';
      default: return '#e2e3e5';
    }
  };

  const calculateDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days until due`;
  };

  const filterCounts = {
    all: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    approved: invoices.filter(inv => inv.status === 'approved').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    rejected: invoices.filter(inv => inv.status === 'rejected').length,
  };

  const filters = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'approved', label: 'Approved', count: filterCounts.approved },
    { id: 'paid', label: 'Paid', count: filterCounts.paid },
  ];

  const filteredInvoices = activeFilter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === activeFilter);

  if (loading) return <div className="text-center py-10">Loading your invoices...</div>;

  return (
    <main className="dashboard-main">
      <div className="invoices-container">
        <h1>All Invoices</h1>
        <p className="invoices-subtitle">Track and manage all your invoices in one place</p>

        <div className="filter-tabs">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label} <span className="filter-count">({filter.count})</span>
            </button>
          ))}
        </div>

        <div className="invoices-list">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-10">
              <p>No invoices found.</p>
            </div>
          ) : (
            filteredInvoices.map(invoice => (
              <div key={invoice.id} className="invoice-list-item">
                <div className="invoice-left">
                  <div className="invoice-icon" style={{ backgroundColor: getStatusBgColor(invoice.status) }}>
                    <i className={`bi ${getStatusIcon(invoice.status)}`}></i>
                  </div>
                  <div className="invoice-info">
                    <h3>{invoice.invoice_number}</h3>
                    <p className="client-name">{invoice.client_name || 'Unknown Client'}</p>
                    <p className="description">{invoice.description || 'No description'}</p>
                    <div className="invoice-meta">
                      <span className="meta-item">
                        <i className="bi bi-clock"></i> {calculateDaysUntilDue(invoice.due_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="invoice-right">
                  <span className={`badge badge-${invoice.status}`}>
                    {invoice.status ? invoice.status.toUpperCase() : 'UNKNOWN'}
                  </span>
                  <div className="invoice-amount">
                    ${parseFloat(invoice.total_amount || 0).toLocaleString()}
                  </div>
                  <div className="due-date">
                    Due {new Date(invoice.due_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

export default Invoices;