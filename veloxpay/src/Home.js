import logo from './logo.svg';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="app-container">
      <div className="landing-box">
        <div>
          <div>LOGO</div>

          <h1>Velox Pay</h1>

          <p>The fastest way to get paid for your work</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <i className="bi bi-cloud-upload"></i>
          </div>
          <div className="feature-text">
            <h4>Upload Invoices</h4><br></br>
            <p>Easily upload and submit invoices to your clients</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="feature-text">
            <h4>Get Approved</h4><br></br>
            <p>Clients review and approve in seconds</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <i className="bi bi-cash"></i>
          </div>
          <div className="feature-text">
            <h4>Get Paid Fast</h4><br></br>
            <p>Receive early payment instead of waiting for due date</p>
          </div>
        </div>

        <Link to="/signup" className="btn btn-success primary-button">Get Started</Link>

        <p><Link to="/login">I already have an account</Link></p>
      </div>
    </div>
  );
}

export default Home;