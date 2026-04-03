import React, { useState } from 'react';
import './App.css';

function Upload() {
  const [file, setFile] = useState(null);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    client: '',
    description: ''
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Invoice submitted:', { file, ...invoiceData });
  };

  const handleCancel = () => {
    setFile(null);
    setInvoiceData({
      invoiceNumber: '',
      amount: '',
      dueDate: '',
      client: '',
      description: ''
    });
  };

  return (
    <main className="dashboard-main">
      <div className="upload-container">
        <h1>Upload Invoice</h1>
        <p className="upload-subtitle">Submit your invoice for quick approval and payment</p>

        <form onSubmit={handleSubmit}>
          {/* Document Upload Section */}
          <div className="form-section">
            <h3>Invoice Document</h3>
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <i className="bi bi-cloud-upload"></i>
              <p>Drop your invoice here or <label><span className="browse-link">browse</span><input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
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
                placeholder="INV-2026-001"
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={invoiceData.amount}
                onChange={handleInputChange}
                placeholder="15000"
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="text"
                name="dueDate"
                value={invoiceData.dueDate}
                onChange={handleInputChange}
                placeholder="mm/dd/yyyy"
              />
            </div>

            <div className="form-group">
              <label>Client / Buyer</label>
              <select
                name="client"
                value={invoiceData.client}
                onChange={handleInputChange}
              >
                <option value="">Select a client</option>
                <option value="acme">Acme Corp</option>
                <option value="techstart">TechStart Inc</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description / Services</label>
              <textarea
                name="description"
                value={invoiceData.description}
                onChange={handleInputChange}
                placeholder="Web development services - February 2026"
                rows="5"
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="btn-submit">Submit Invoice</button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Upload;
