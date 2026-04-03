import React, { useState, useEffect } from 'react';

const PasswordInput = ({ onSubmit }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    special: false,
  });

  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

  useEffect(() => {
    setValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: specialCharRegex.test(password),
    });
  }, [password]);

  const allValid = Object.values(validation).every(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (allValid && onSubmit) {
      onSubmit(password);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '10px',
              paddingRight: '50px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={toggleShowPassword}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Password Requirements:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ color: validation.length ? 'green' : 'red' }}>
              {validation.length ? '✅' : '❌'} At least 8 characters
            </li>
            <li style={{ color: validation.uppercase ? 'green' : 'red' }}>
              {validation.uppercase ? '✅' : '❌'} At least 1 uppercase letter
            </li>
            <li style={{ color: validation.lowercase ? 'green' : 'red' }}>
              {validation.lowercase ? '✅' : '❌'} At least 1 lowercase letter
            </li>
            <li style={{ color: validation.special ? 'green' : 'red' }}>
              {validation.special ? '✅' : '❌'} At least 1 special character (!@#$%^&*)
            </li>
          </ul>
        </div>
        <button
          type="submit"
          disabled={!allValid}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            backgroundColor: allValid ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: allValid ? 'pointer' : 'not-allowed',
            fontSize: '16px',
          }}
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default PasswordInput;