import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ApproveInvoice.css';

function ApproveInvoice() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [ setActionTaken] = useState(false);


  

  useEffect(() => {
    const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/public`);
      
      if (!response.ok) throw new Error('Invoice not found');
      
      const data = await response.json();
      setInvoice(data);
    } catch (err) {
      setError(err.message || 'Could not load invoice');
    } finally {
      setLoading(false);
    }
  };
  }, [invoiceId]);

  

  const handleDecision = async (decision) => {
    if (decision === 'reject' && !rejectionReason.trim()) {
      if (!window.confirm('Reject without a reason?')) return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const body = decision === 'approve' 
        ? { decision: 'approve' }
        : { decision: 'reject', rejectionReason: rejectionReason.trim() };

      const response = await fetch(`http://localhost:5000/api/invoices/${invoiceId}/client-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setActionTaken(true);
        setSuccessMessage(decision === 'approve' 
          ? '✅ Invoice approved successfully! The supplier has been notified.'
          : '✅ Invoice rejected successfully. The supplier has been notified.');
      } else {
        setError(data.error || 'Failed to process your decision');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading invoice...</div>;
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success text-center p-5">
          <h2 className="mb-4">Thank You!</h2>
          <p className="lead">{successMessage}</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/')}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-page">
      <div className="approval-container">
        <div className="card-header">
          <h4>Invoice Approval</h4>
        </div>
        <div className="invoice-details">
          <h5>Invoice #{invoice?.invoice_number}</h5>
          <p><strong>Amount:</strong> ${parseFloat(invoice?.total_amount || 0).toLocaleString()}</p>
          <p><strong>Due Date:</strong> {invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Supplier:</strong> {invoice?.supplier_business_name || 'N/A'}</p>
          {invoice?.description && <p><strong>Description:</strong> {invoice.description}</p>}
        </div>
        <div>
          <div className="text-center">
            <p>Please make your decision below:</p>

            {!showRejectReason ? (
              <div className="d-grid gap-3">
                <button className="btn btn-success btn-lg" onClick={() => handleDecision('approve')} disabled={submitting}>
                  Approve Invoice
                </button>
                <button className="btn btn-danger btn-lg" onClick={() => setShowRejectReason(true)} disabled={submitting}>
                  Reject Invoice
                </button>
              </div>
            ) : (
              <div>
                <textarea
                  className="form-control mb-3"
                  rows="4"
                  placeholder="Reason for rejection (optional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="d-grid gap-2">
                  <button className="btn btn-danger" onClick={() => handleDecision('reject')} disabled={submitting}>
                    Confirm Rejection
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowRejectReason(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApproveInvoice;