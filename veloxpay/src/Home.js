import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Chen",
      business: "Chen Design Studio",
      text: "VeloxPay got me paid in 4 hours instead of 45 days. The Plaid integration is seamless.",
      amount: "$12,400 funded"
    },
    {
      name: "Marcus Rodriguez",
      business: "Rodriguez Construction",
      text: "I upload on Friday and have cash Monday morning. No more chasing clients.",
      amount: "$47,800 funded"
    },
    {
      name: "Aisha Patel",
      business: "Patel Consulting",
      text: "The 85% advance is instant and the fees are transparent.",
      amount: "$9,250 funded"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page premium-landing">
      {/* Navbar */}
      <nav className="premium-navbar">
        <div className="nav-content">
          <div className="logo">
            <span className="logo-gold">Velox</span><span className="logo-green">Pay</span>
          </div>
          <div className="nav-links">
            <Link to="/login">Login</Link>
            <Link to="/signup" className="nav-cta">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="premium-hero">
        <div className="hero-content">
          <div className="premium-badge">POWERED BY PLAID • SECURE • FAST</div>
          
          <h1>
            Get paid faster.<br />
            <span className="gold-text">No waiting. No hassle.</span>
          </h1>
          
          <p className="hero-subtitle">
            Upload your invoice. Receive up to 85% instantly via secure ACH.<br />
            We handle collection automatically.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn btn-gold btn-large">Start Funding Today — Free</Link>
            <Link to="/login" className="btn btn-outline-gold">Sign in</Link>
          </div>

          <div className="trust-logos">
            <span>Secured by Plaid</span>
            <span>Bank-level security</span>
            <span>No credit checks</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="premium-features">
        <h2 className="section-title">How It Works</h2>
        <div className="features-grid">
          <div className="feature-card premium-card">
            <div className="feature-number">1</div>
            <h3>Upload Invoice</h3>
            <p>Drag & drop your invoice and choose your term.</p>
          </div>
          <div className="feature-card premium-card">
            <div className="feature-number">2</div>
            <h3>Client Approves</h3>
            <p>We notify your client. Approval triggers funding.</p>
          </div>
          <div className="feature-card premium-card">
            <div className="feature-number">3</div>
            <h3>Get 85% Instantly</h3>
            <p>Cash hits your bank account within hours.</p>
          </div>
          <div className="feature-card premium-card">
            <div className="feature-number">4</div>
            <h3>We Collect Later</h3>
            <p>Automatic collection on due date.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="premium-testimonials">
        <h2 className="section-title">What Our Suppliers Say</h2>
        
        <div className="testimonial-carousel">
          <div className="testimonial-card">
            <p className="testimonial-text">"{testimonials[currentTestimonial].text}"</p>
            <div className="testimonial-author">
              <strong>{testimonials[currentTestimonial].name}</strong><br />
              {testimonials[currentTestimonial].business}
              <div className="funded-amount">{testimonials[currentTestimonial].amount}</div>
            </div>
          </div>

          <div className="carousel-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="premium-fees">
        <h2 className="section-title">Simple & Transparent Fees</h2>
        <div className="fee-grid">
          <div className="fee-card premium-card">
            <div className="term">30 days</div>
            <div className="fee-percentage">5%</div>
          </div>
          <div className="fee-card premium-card popular">
            <div className="term">60 days</div>
            <div className="fee-percentage">7.5%</div>
            <p className="popular-tag">Most Popular</p>
          </div>
          <div className="fee-card premium-card">
            <div className="term">90 days</div>
            <div className="fee-percentage">10%</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="premium-cta">
        <h2>Ready to get paid faster?</h2>
        <p className="cta-subtitle">Join suppliers who no longer wait weeks for payment.</p>
        <Link to="/signup" className="btn btn-gold btn-large">
          Create Free Account
        </Link>
      </section>

      <footer className="dashboard-footer">
        <div className="footer-company">© 2026 VeloxPay • Premium Invoice Funding</div>
      </footer>
    </div>
  );
}

export default Home;