import React, { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';

const AuthorizeACHPayment = ({ invoiceId, invoiceAmount, dueDate, onSuccess }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLinkToken = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          amount: invoiceAmount,     // full 100%
          due_date: dueDate
        })
      });

      const data = await response.json();

      if (response.ok && data.link_token) {
        setLinkToken(data.link_token);
      } else {
        setError(data.error || 'Failed to initialize Plaid Link');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaidSuccess = useCallback(async (public_token, metadata) => {
    try {
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          invoice_id: invoiceId,
          account_id: metadata.accounts?.[0]?.id,
          metadata
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Authorization successful!\n\nThe full amount ($${invoiceAmount}) will be automatically debited on ${dueDate}.`);
        onSuccess?.();
      } else {
        alert('Failed to save bank authorization. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong while saving the authorization.');
    }
  }, [invoiceId, invoiceAmount, dueDate]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        setError('Authorization was cancelled or failed.');
      }
    }
  });

  return (
    <div style={{ 
      padding: '25px', 
      border: '2px solid #4CAF50', 
      borderRadius: '8px',
      backgroundColor: '#f9fff9',
      marginTop: '30px'
    }}>
      <h3>Step 2: Authorize Automatic ACH Debit</h3>
      <p>
        To receive your <strong>85% early payment</strong> immediately, please authorize us to 
        automatically debit the <strong>full invoice amount (${invoiceAmount})</strong> 
        from your bank account on the due date: <strong>{dueDate}</strong>.
      </p>

      {!linkToken ? (
        <button 
          onClick={getLinkToken} 
          disabled={isLoading}
          style={{ padding: '12px 24px', fontSize: '16px' }}
        >
          {isLoading ? 'Preparing secure connection...' : 'Connect Bank Account & Authorize Debit'}
        </button>
      ) : (
        <button 
          onClick={() => open()} 
          disabled={!ready}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            backgroundColor: '#4CAF50', 
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {ready ? 'Open Bank Authorization' : 'Loading...'}
        </button>
      )}

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
};

export default AuthorizeACHPayment;