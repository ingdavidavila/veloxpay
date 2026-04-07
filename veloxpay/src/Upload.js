import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

function Upload() {
  const { token } = useAuth();

  const [file, setFile] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    clientId: '',
    description: '',
    termDays: '30'
  });

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!token) return;
      try {
        const response = await fetch('http://localhost:5000/api/invoices/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };
    fetchClients();
  }, [token]);

  // Auto-calculate Due Date whenever termDays changes
  useEffect(() => {
    if (!invoiceData.termDays) return;

    const today = new Date();
    const days = parseInt(invoiceData.termDays);
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + days);

    const formattedDueDate = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    setInvoiceData(prev => ({
      ...prev,
      dueDate: formattedDueDate
    }));
  }, [invoiceData.termDays]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload an invoice file");
      return;
    }

    if (!invoiceData.invoiceNumber || !invoiceData.amount || !invoiceData.dueDate || !invoiceData.clientId) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('invoice_number', invoiceData.invoiceNumber);
      formData.append('total_amount', invoiceData.amount);
      formData.append('due_date', invoiceData.dueDate);
      formData.append('client_id', invoiceData.clientId);
      formData.append('description', invoiceData.description || '');
      formData.append('term_days', invoiceData.termDays);

      const response = await fetch('http://localhost:5000/api/invoices/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFile(null);
        setInvoiceData({
          invoiceNumber: '',
          amount: '',
          dueDate: '',
          clientId: '',
          description: '',
          termDays: '30'
        });
      } else {
        setError(data.error || 'Failed to upload invoice');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setInvoiceData({
      invoiceNumber: '',
      amount: '',
      dueDate: '',
      clientId: '',
      description: '',
      termDays: '30'
    });
    setError('');
  };

  return (
    <main className="dashboard-main">
      <div className="upload-container">
        <h1>Upload New Invoice</h1>
        <p className="upload-subtitle">Submit your invoice for fast approval and 85% advance payment</p>

        {success && (
          <div className="alert alert-success mb-4">
            Invoice uploaded successfully! Approval request has been sent to the client.
          </div>
        )}

        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Document Upload Section */}
          <div className="form-section">
            <h3>Invoice Document</h3>
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <i className="bi bi-cloud-upload"></i>
              <p>Drop your invoice here or <label><span className="browse-link">browse</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                /></label></p>
              <small>Supports PDF, PNG, JPG up to 10MB</small>
              {file && <p className="file-name">✓ {file.name}</p>}
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="form-section">
            <h3>Invoice Details</h3>

            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                name="invoiceNumber"
                value={invoiceData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="INV-20260401"
                required
              />
            </div>

            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                name="amount"
                value={invoiceData.amount}
                onChange={handleInputChange}
                placeholder="15000.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Term</label>
              <select
                name="termDays"
                value={invoiceData.termDays}
                onChange={handleInputChange}
              >
                <option value="30">30 days (5% fee)</option>
                <option value="60">60 days (7.5% fee)</option>
                <option value="90">90 days (10% fee)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date (auto-calculated from term)</label>
              <input
                type="date"
                name="dueDate"
                value={invoiceData.dueDate}
                readOnly
                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
              />
              <small style={{ color: '#666' }}>This date is automatically calculated based on the selected Payment Term</small>
            </div>

            <div className="form-group">
              <label>Client / Buyer</label>
              <select
                name="clientId"
                value={invoiceData.clientId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description / Services</label>
              <textarea
                name="description"
                value={invoiceData.description}
                onChange={handleInputChange}
                placeholder="Web development services for February 2026 campaign"
                rows="4"
              ></textarea>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={handleCancel} 
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={loading || !file}
            >
              {loading ? 'Uploading Invoice...' : 'Submit for Approval & Funding'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Upload;