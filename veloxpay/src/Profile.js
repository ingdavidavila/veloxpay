import React, { useState, useEffect } from 'react';
import './App.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalEarned: 0,
    approved: 0,
  });
  const [profileData, setProfileData] = useState({
    businessName: '',
    email: '',
    phone: '',
    bankAccount: '****7890'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize profile data from user context
    if (user) {
      setProfileData(prev => ({
        ...prev,
        businessName: user.business_name || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }

    // Fetch user stats
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/invoices/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats({
            totalInvoices: data.pending + data.approved + data.paid,
            totalEarned: (data.pendingAmount || 0) + (data.approvedAmount || 0) + (data.paidAmount || 0),
            approved: data.approved,
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
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

            <div className="detail-item">
              <i className="bi bi-credit-card"></i>
              <div>
                <label>Bank Account</label>
                <p>{!isEditing ? profileData.bankAccount : <input type="text" name="bankAccount" value={profileData.bankAccount} onChange={handleInputChange} />}</p>
              </div>
            </div>
          </div>

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
