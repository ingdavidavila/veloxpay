import React from 'react';
import './App.css';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo">Velox Pay</div>
        <nav>
          <ul>
            <li><Link to="">Dashboard</Link></li>
            <li><Link to="upload">Upload Invoice</Link></li>
            <li><Link to="invoices">All Invoices</Link></li>
            <li><Link to="profile">Profile</Link></li>
            <li><button className="logout-link" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Log Out</button></li>
          </ul>
        </nav>
      </aside>
      <div className="dashboard-content">
        <Outlet />
        <footer className="dashboard-footer">
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Support</a>
            <a href="#" className="footer-link">Contact Us</a>
          </div>
          <p>&copy; 2026 VeloxPay. A product of <span className="footer-company">Robot.inc</span></p>
        </footer>
      </div>
    </div>
  );
}

export default Dashboard;
