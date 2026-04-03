import React, { useState, useEffect } from 'react';
import './App.css';
import { useAuth } from './useAuth';

function Invoices() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/invoices', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setInvoices(data);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
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
      default: return 'bi-file-earmark';
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case 'pending': return '#fff3cd';
      case 'approved': return '#d4edda';
      case 'paid': return '#d1ecf1';
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
    if (diffDays === 1) return '1 day until due';
    return `${diffDays} days until due`;
  };

  // Calculate filter counts
  const filterCounts = {
    all: invoices.length,
    pending: invoices.filter(inv => inv.status === 'pending').length,
    approved: invoices.filter(inv => inv.status === 'approved').length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
  };

  const filters = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'pending', label: 'Pending', count: filterCounts.pending },
    { id: 'approved', label: 'Approved', count: filterCounts.approved },
    { id: 'paid', label: 'Paid', count: filterCounts.paid }
  ];

  const filteredInvoices = activeFilter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === activeFilter);

  return (
    <main className="dashboard-main">
      <div className="invoices-container">
        <h1>All Invoices</h1>
        <p className="invoices-subtitle">Track and manage all your invoices in one place</p>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label} <span className="filter-count">{filter.count}</span>
            </button>
          ))}
        </div>

        {/* Invoice List */}
        <div className="invoices-list">
          {loading ? (
            <div className="text-center py-5">
              <p>Loading your invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-5">
              <p>No invoices found in this category</p>
            </div>
          ) : (
            filteredInvoices.map(invoice => (
              <div key={invoice.id} className="invoice-list-item">
                <div className="invoice-left">
                  <div className="invoice-icon" style={{ backgroundColor: getStatusBgColor(invoice.status) }}>
                    <i className={`bi ${getStatusIcon(invoice.status)}`}></i>
                  </div>
                  <div className="invoice-info">
                    <h3>{invoice.invoice_number || `INV-${invoice.id?.substring(0, 8)}`}</h3>
                    <p className="client-name">{invoice.client_name}</p>
                    <p className="description">{invoice.description || 'Invoice'}</p>
                    <div className="invoice-meta">
                      <span className="meta-item">
                        <i className="bi bi-clock"></i> {calculateDaysUntilDue(invoice.due_date)}
                      </span>
                      <span className="meta-item">
                        Uploaded: {new Date(invoice.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="invoice-right">
                  <span className={`badge badge-${invoice.status}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                  <div className="invoice-amount">${parseFloat(invoice.total_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  {invoice.early_payout && (
                    <div className="early-payout">Early payout: ${parseFloat(invoice.early_payout).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  )}
                  <div className="due-date">Due {new Date(invoice.due_date).toLocaleDateString()}</div>
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
