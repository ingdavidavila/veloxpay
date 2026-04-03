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
    const error = searchParams.get('error');

    if (token) {
      // Try to decode JWT to get user info (basic decode, not verification)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userData = {
          userId: payload.userId,
          // Add more user data if available
        };
        login(token, userData);
        navigate('/dashboard');
      } catch (err) {
        console.error('Error decoding token:', err);
        // Still set token even if decode fails
        login(token, {});
        navigate('/dashboard');
      }
    } else if (error) {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams, navigate, login]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credential: tokenResponse.credential,
          }),
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
    onError: () => {
      setError('Google login failed');
    },
  });

  const handleAppleLogin = () => {
    // Redirect to backend Apple auth endpoint
    window.open(
    "http://localhost:5000/auth/apple",
    "Apple Login",
    "width=500,height=700"
);
  };

  return (
    <div className="app-container">
      <div className="landing-box">
        <h1>Login to Velox Pay</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-success primary-button">Login</button>
          <div className="text-center mt-2">
            <small>
              <Link to="/forgot-password" style={{ fontSize: '0.9rem' }}>Forgot Password?</Link>
            </small>
          </div>
          <div className="social-login">
            <button type="button" className="btn btn-light auth-button" onClick={() => googleLogin()}>
              Continue with Google
            </button>
            <button type="button" className="btn btn-light auth-button" onClick={handleAppleLogin}>
              Continue with Apple
            </button>
          </div>
        </form>
        <p className="mt-3">
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;