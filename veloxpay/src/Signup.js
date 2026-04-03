import React, { useState, useContext } from 'react';
import './App.css';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordToast, setShowPasswordToast] = useState(false);

  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    specialChar: false
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handlePasswordChange = (value) => {
  setPassword(value);

  if (value.length > 0) {
    setShowPasswordToast(true);
  } else {
    setShowPasswordToast(false);
  }

  setPasswordRules({
    length: /.{8,}/.test(value),
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    specialChar: /[!@#$%^&*]/.test(value)
  });
};

  const passwordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordValid) {
      setError('Password does not meet the required rules.');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          business_name: '',
          email,
          phone_number: '',
          bank_account: '',
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Signup failed');
        return;
      }

      const data = await response.json();
      setSuccess('Account created successfully! Logging you in...');

      setTimeout(() => {
        login(data.token, data.user);
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      console.error('Signup error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <div className="landing-box">
        <h1>Create an Account</h1>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {showPasswordToast && (
  <div className="password-toast mt-2">

    {passwordValid ? (
      <div className="text-success fw-bold">
        ✅ Password is strong
      </div>
    ) : (
      <>
        <div>{passwordRules.length ? "✅" : "❌"} At least 8 characters</div>
        <div>{passwordRules.uppercase ? "✅" : "❌"} At least one uppercase letter</div>
        <div>{passwordRules.lowercase ? "✅" : "❌"} At least one lowercase letter</div>
        <div>{passwordRules.specialChar ? "✅" : "❌"} At least one special character</div>
      </>
    )}

  </div>
)}

          </div>

          <button
            type="submit"
            className="btn btn-success primary-button"
            disabled={!passwordValid}
          >
            Sign Up
          </button>

        </form>

        <p className="mt-3">
          <Link to="/login">Already have an account? Log in</Link>
        </p>

        <p className="mt-3">
          <Link to="/">Home</Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;