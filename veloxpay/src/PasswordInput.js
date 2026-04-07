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
    <div className="password-input-container">
      <form onSubmit={handleSubmit}>
        <div className="password-field-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
      
          />
          <button
            type="button"
            onClick={toggleShowPassword}
            className="password-toggle-btn"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <div className="password-requirements">
          <p>Password Requirements:</p>
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
          className={`password-submit-btn ${allValid ? 'enabled' : 'disabled'}`}
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default PasswordInput;