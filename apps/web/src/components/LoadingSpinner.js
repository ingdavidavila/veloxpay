import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: '#666'
    }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '16px', fontSize: '1rem' }}>{message}</p>
    </div>
  );
};

export default LoadingSpinner;