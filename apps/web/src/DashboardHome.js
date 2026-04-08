import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import LoadingSpinner from './components/LoadingSpinner';

function DashboardHome() {
  const { user, token } = useAuth();
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

  // Toast / Modal state
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [addingClient, setAddingClient] = useState(false);

  useEffect(() => {
    console.log('=== DashboardHome useEffect triggered ===');
    console.log('User from context:', user);
    console.log('Token from context:', token ? 'PRESENT (length: ' + (token?.length || 0) + ')' : 'MISSING');

    const fetchStats = async () => {
      if (!token) {
        console.warn('No token available - skipping stats fetch');
        return;
      }

      try {
        console.log('Fetching stats with token...');
        const response = await fetch('http://localhost:5000/api/invoices/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Stats response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Stats data received:', data);
          setStats({
            pending: data.pending || 0,
            approved: data.approved || 0,
            paid: data.paid || 0,
            pendingAmount: parseFloat(data.pending_amount || 0),
            approvedAmount: parseFloat(data.approved_amount || 0),
            paidAmount: parseFloat(data.paid_amount || 0),
          });
        } else {
          console.warn('Stats fetch failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const fetchRecentInvoices = async () => {
      if (!token) {
        console.warn('No token available - skipping recent invoices fetch');
        return;
      }

      try {
        console.log('Fetching recent invoices with token...');
        const response = await fetch('http://localhost:5000/api/invoices?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Recent invoices response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Recent invoices received:', data.length, 'items');
          setRecentInvoices(data);
        }
      } catch (error) {
        console.error('Error fetching recent invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStats();
      fetchRecentInvoices();
    } else {
      setLoading(false);
    }
  }, [user?.id, token]);

  const handleAddClient = () => {
    setShowAddClient(true);
    setNewClient({ name: '', email: '', phone: '' });
  };

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const submitNewClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email) {
      alert("Name and Email are required");
      return;
    }

    setAddingClient(true);

    try {
      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClient)
      });

      if (response.ok) {
        alert('Client added successfully!');
        setShowAddClient(false);
      } else {
        alert('Failed to add client');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Network error while adding client');
    } finally {
      setAddingClient(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

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
            <h3>${stats.pendingAmount.toLocaleString()}</h3>
            <p>Pending Approval</p>
            <small>{stats.pending} {stats.pending === 1 ? 'invoice' : 'invoices'}</small>
          </div>
        </div>

        <div className="card ready">
          <div className="card-icon"><i className="bi bi-check-circle"></i></div>
          <div>
            <h3>${stats.approvedAmount.toLocaleString()}</h3>
            <p>Ready for Payment</p>
            <small>{stats.approved} {stats.approved === 1 ? 'invoice' : 'invoices'}</small>
          </div>
        </div>

        <div className="card paid">
          <div className="card-icon"><i className="bi bi-cash"></i></div>
          <div>
            <h3>${stats.paidAmount.toLocaleString()}</h3>
            <p>Paid This Month</p>
            <small>{stats.paid} {stats.paid === 1 ? 'invoice' : 'invoices'}</small>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <h4>Quick Actions</h4>
        <div className="actions-row">
          <div 
            className="action-card add-client" 
            onClick={handleAddClient}
            style={{ cursor: 'pointer' }}
          >
            Add Client
          </div>
          
        </div>
      </section>

      {/* Add Client Toast / Modal */}
      {showAddClient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Client</h3>
            <form onSubmit={submitNewClient}>
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newClient.name}
                  onChange={handleClientInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleClientInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={newClient.phone}
                  onChange={handleClientInputChange}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowAddClient(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit" 
                  disabled={addingClient}
                >
                  {addingClient ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="recent-invoices">
        <h4>Recent Invoices</h4>
        {loading ? (
          <div className="text-center py-4">
            <p>Loading your invoices...</p>
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="text-center py-4">
            <p>No invoices yet. <Link to="/upload">Create your first invoice</Link></p>
          </div>
        ) : (
          <>
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="invoice-card">
                <div>
                  <strong>{invoice.invoice_number || `INV-${invoice.id?.substring(0, 8)}`}</strong> 
                  <span className={`badge bg-${
                    invoice.status === 'pending' ? 'warning text-dark' :
                    invoice.status === 'approved' ? 'success' :
                    invoice.status === 'paid' ? 'primary' : 'secondary'
                  }`}>
                    {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Unknown'}
                  </span>
                  <div>{invoice.client_name || 'Unknown Client'}</div>
                  <small>{invoice.description || 'Invoice'}</small>
                </div>
                <div className="amount">
                  ${parseFloat(invoice.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <br/>
                  <small>Due {new Date(invoice.due_date).toLocaleDateString() || 'TBD'}</small>
                </div>
              </div>
            ))}
          </>
        )}
        <div className="view-all">
          <Link to="/invoices">View All Invoices →</Link>
        </div>
      </section>
    </main>
  );
}

export default DashboardHome;