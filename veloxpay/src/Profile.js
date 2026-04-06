import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { usePlaidLink } from 'react-plaid-link';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState({
    businessName: '',
    email: '',
    phone: '',
  });

  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalEarned: 0,
    approved: 0,
  });

  // Fetch user data and stats
  useEffect(() => {
    if (user) {
      setProfileData({
        businessName: user.business_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });

      // Check if supplier has connected a bank account
      setBankConnected(!!user.supplier_plaid_access_token || !!user.has_bank_account);
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/invoices/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalInvoices: (data.pending || 0) + (data.approved || 0) + (data.paid || 0),
            totalEarned: (data.pendingAmount || 0) + (data.approvedAmount || 0) + (data.paidAmount || 0),
            approved: data.approved || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_name: profileData.businessName,
          phone: profileData.phone,
        })
      });

      if (response.ok) {
        const updatedData = await response.json();
        updateUser(updatedData.user);
        setIsEditing(false);
        alert('Profile updated successfully');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  // Get Plaid Link Token for Supplier Bank (for receiving 85% advance)
  const getSupplierLinkToken = async () => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/plaid/supplier-link-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setLinkToken(data.link_token);
      } else {
        setError(data.error || 'Failed to initialize bank connection');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    }
  };

  // Handle successful Plaid connection
  const onPlaidSuccess = async (public_token, metadata) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/plaid/supplier-exchange-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_token,
          account_id: metadata.accounts[0]?.id,
          metadata
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Bank account connected successfully!\n\nYou can now receive 85% advances automatically when invoices are approved.');
        setBankConnected(true);
        window.location.reload(); // Refresh user data
      } else {
        alert('Failed to save bank account. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong while saving your bank account.');
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) console.error('Plaid Link exited with error:', err);
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <main className="dashboard-main">
      <div className="profile-container">
        <h1>Profile</h1>
        <p className="profile-subtitle">Manage your account and settings</p>

        {/* Stats Section */}
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#d4edda' }}>
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <div>
              <p className="stat-label">Total Invoices</p>
              <p className="stat-value">{stats.totalInvoices}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#d4edda' }}>
              <i className="bi bi-cash"></i>
            </div>
            <div>
              <p className="stat-label">Total Earned</p>
              <p className="stat-value">${stats.totalEarned?.toLocaleString() || '0'}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fff3cd' }}>
              <i className="bi bi-check-circle"></i>
            </div>
            <div>
              <p className="stat-label">Approved</p>
              <p className="stat-value">{stats.approved}</p>
            </div>
          </div>
        </div>

        {/* Business Account Section */}
        <div className="account-section">
          <div className="account-header">
            <div className="account-info">
              <div className="account-icon">
                <i className="bi bi-building"></i>
              </div>
              <div>
                <h3>{profileData.businessName || user?.name}</h3>
                <p>{profileData.email}</p>
              </div>
            </div>
            <button className="edit-btn" onClick={() => setIsEditing(!isEditing)}>
              <i className="bi bi-pencil"></i> Edit
            </button>
          </div>

          {/* Account Details */}
          <div className="account-details">
            <div className="detail-item">
              <i className="bi bi-person"></i>
              <div>
                <label>Business Name</label>
                <p>{!isEditing ? profileData.businessName : <input type="text" name="businessName" value={profileData.businessName} onChange={handleInputChange} />}</p>
              </div>
            </div>

            <div className="detail-item">
              <i className="bi bi-envelope"></i>
              <div>
                <label>Email</label>
                <p>{!isEditing ? profileData.email : <input type="email" name="email" value={profileData.email} onChange={handleInputChange} />}</p>
              </div>
            </div>

            <div className="detail-item">
              <i className="bi bi-telephone"></i>
              <div>
                <label>Phone Number</label>
                <p>{!isEditing ? profileData.phone : <input type="tel" name="phone" value={profileData.phone} onChange={handleInputChange} />}</p>
              </div>
            </div>

            {/* Improved Bank Account Section */}
            <div className="detail-item" style={{ marginTop: '25px', padding: '18px', border: '2px solid #4CAF50', borderRadius: '10px', backgroundColor: '#f8fff8' }}>
              <i className="bi bi-credit-card" style={{ color: '#4CAF50', fontSize: '24px' }}></i>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  Receiving Bank Account (for 85% Advances)
                </label>
                
                {bankConnected ? (
                  <div>
                    <p style={{ color: 'green', fontWeight: 'bold', margin: '8px 0' }}>
                      ✅ Bank account is connected and ready to receive automatic 85% advances.
                    </p>
                    <button 
                      onClick={getSupplierLinkToken}
                      style={{ 
                        padding: '9px 18px', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Change Bank Account
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '8px 0' }}>No bank account connected yet.</p>
                    <button 
                      onClick={getSupplierLinkToken}
                      style={{ 
                        padding: '12px 20px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '15px'
                      }}
                    >
                      Connect Bank Account for 85% Advances
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Show Plaid Open Button when linkToken is ready */}
          {linkToken && (
            <button 
              onClick={() => open()} 
              disabled={!ready}
              style={{ 
                marginTop: '12px', 
                padding: '12px 24px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                fontSize: '16px',
                width: '100%'
              }}
            >
              {ready ? 'Open Secure Bank Login' : 'Loading secure connection...'}
            </button>
          )}

          {isEditing && (
            <div className="edit-actions">
              <button className="btn-save" onClick={handleSaveChanges}>Save Changes</button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="settings-section">
          <h2>Settings</h2>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-content">
                <i className="bi bi-credit-card"></i>
                <span>Bank Accounts</span>
              </div>
              <i className="bi bi-chevron-right"></i>
            </div>

            <div className="setting-item">
              <div className="setting-content">
                <i className="bi bi-bell"></i>
                <span>Notifications</span>
              </div>
              <i className="bi bi-chevron-right"></i>
            </div>

            <div className="setting-item">
              <div className="setting-content">
                <i className="bi bi-shield"></i>
                <span>Security & 2FA</span>
              </div>
              <i className="bi bi-chevron-right"></i>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button className="logout-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i> Log Out
        </button>
      </div>
    </main>
  );
}

export default Profile;