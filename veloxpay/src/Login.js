import React, { useState, useEffect, useContext } from 'react';
import './App.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { AuthContext } from './AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Handle redirect from Apple/other OAuth providers
  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userData = { userId: payload.userId };
        login(token, userData);
        navigate('/dashboard');
      } catch (err) {
        console.error('Error decoding token:', err);
        login(token, {});
        navigate('/dashboard');
      }
    } else if (errorParam) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams, navigate, login]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
        return;
      }

      const data = await response.json();
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch('http://localhost:5000/api/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.credential }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Google login failed');
          return;
        }

        const data = await response.json();
        login(data.token, data.user);
        navigate('/dashboard');
      } catch (error) {
        console.error('Google login error:', error);
        setError('Google login failed');
      }
    },
    onError: () => setError('Google login failed'),
  });

  const handleAppleLogin = () => {
    window.open("http://localhost:5000/auth/apple", "Apple Login", "width=500,height=700");
  };

  return (
    <div className="premium-auth-page">
      <div className="premium-auth-box">
        <div className="auth-header">
          <h1>Welcome Back to VeloxPay</h1>
          <p>Sign in to manage your invoices and funding</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control premium-input"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control premium-input"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-gold btn-large w-100">
            Sign In
          </button>

          <div className="text-center mt-3">
            <small>
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </small>
          </div>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <div className="social-login">
          <button 
            type="button" 
            className="auth-button social-btn" 
            onClick={() => googleLogin()}
          >
            Continue with Google
          </button>
          <button 
            type="button" 
            className="auth-button social-btn" 
            onClick={handleAppleLogin}
          >
            Continue with Apple
          </button>
        </div>

        <p className="mt-4 text-center auth-footer-text">
          Don't have an account? <Link to="/signup" className="auth-link">Create one here</Link>
        </p>

        <p className="text-center mt-3">
          <Link to="/" className="back-home">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;