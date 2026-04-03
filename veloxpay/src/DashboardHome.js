import React, { useState, useEffect } from 'react';
import './App.css';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';

function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    paid: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's invoice statistics
    
const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/invoices/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      setStats({
        pending: data.pending || 0,
        approved: data.approved || 0,
        paid: data.paid || 0,
        pendingAmount: parseFloat(data.pending_amount) || 0,
        approvedAmount: parseFloat(data.approved_amount) || 0,
        paidAmount: parseFloat(data.paid_amount) || 0,
      });
    } else {
      console.warn('Stats fetch failed with status:', response.status);
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

const fetchRecentInvoices = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/invoices?limit=3', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      setRecentInvoices(data);
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
  } finally {
    setLoading(false);
  }
};

    if (user?.id) {
      fetchStats();
      fetchRecentInvoices();
    }
  }, [user?.id]);

  return (
    <main className="dashboard-main">
      <header>
        <h2>Welcome back, {user?.business_name || user?.name || 'User'}</h2>
        <p>Here's what's happening with your invoices today</p>
      </header>

      <section className="stats-cards">
        <div className="card pending">
          <div className="card-icon"><i className="bi bi-clock"></i></div>
          <div>
            <h3>${stats.pendingAmount?.toLocaleString() || '0'}</h3>
            <p>Pending Approval</p>
            <small>{stats.pending} {stats.pending === 1 ? 'invoice' : 'invoices'}</small>
          </div>
        </div>
        <div className="card ready">
          <div className="card-icon"><i className="bi bi-check-circle"></i></div>
          <div>
            <h3>${stats.approvedAmount?.toLocaleString() || '0'}</h3>
            <p>Ready for Payment</p>
            <small>{stats.approved} {stats.approved === 1 ? 'invoice' : 'invoices'}</small>
          </div>
        </div>
        <div className="card paid">
          <div className="card-icon"><i className="bi bi-cash"></i></div>
          <div>
            <h3>${stats.paidAmount?.toLocaleString() || '0'}</h3>
            <p>Paid This Month</p>
            <small>{stats.paid} {stats.paid === 1 ? 'invoice' : 'invoices'}</small>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <h4>Quick Actions</h4>
        <div className="actions-row">
          <div className="action-card add-client">Add Client</div>
          <div className="action-card view-pending">View Pending</div>
        </div>
      </section>

      <section className="recent-invoices">
        <h4>Recent Invoices</h4>
        {loading ? (
          <div className="text-center py-4">
            <p>Loading your invoices...</p>
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="text-center py-4">
            <p>No invoices yet. <Link to="upload">Create your first invoice</Link></p>
          </div>
        ) : (
          <>
            {recentInvoices.map((invoice, index) => (
              <div key={index} className="invoice-card">
                <div>
                  <strong>{invoice.invoice_number || `INV-${invoice.id?.substring(0, 8)}`}</strong> 
                  <span className={`badge bg-${
                    invoice.status === 'pending' ? 'warning text-dark' :
                    invoice.status === 'approved' ? 'success' :
                    invoice.status === 'paid' ? 'primary' : 'secondary'
                  }`}>
                    {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Unknown'}
                  </span>
                  <div>{invoice.client_name}</div>
                  <small>{invoice.description || 'Invoice'}</small>
                </div>
                <div className="amount">
                  ${parseFloat(invoice.total_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}<br/>
                  <small>Due {new Date(invoice.due_date).toLocaleDateString() || 'TBD'}</small>
                </div>
              </div>
            ))}
          </>
        )}
        <div className="view-all"><Link to="invoices">View All</Link></div>
      </section>
    </main>
  );
}

export default DashboardHome;