import React, { useState, useEffect } from 'react';
import './App.css';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [validating, setValidating] = useState(true);

  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Validate token when component mounts
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Token is missing.');
      setValidating(false);
      return;
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Invalid or expired reset link');
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setError('Failed to verify reset link');
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reset password');
        return;
      }

      const data = await response.json();
      setSuccess(data.message || 'Password has been reset successfully');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="app-container">
        <div className="landing-box">
          <h1>Reset Your Password</h1>
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="app-container">
        <div className="landing-box">
          <h1>Reset Your Password</h1>
          <div className="alert alert-danger">{error}</div>
          <p className="mt-3">
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="landing-box">
        <h1>Reset Your Password</h1>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
            />
            <small className="form-text text-muted">
              At least 8 characters long
            </small>
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-success primary-button"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-3">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;