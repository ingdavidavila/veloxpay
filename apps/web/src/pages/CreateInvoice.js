// src/pages/CreateInvoice.js
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import './CreateInvoice.css';

const CreateInvoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoiceData.items];
    newItems[index][field] = value;
    setInvoiceData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (invoiceData.items.length === 1) {
      alert('You must have at least one item.');
      return;
    }
    const newItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotal = () => {
    return invoiceData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    }, 0);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const total = calculateTotal();

    doc.setFontSize(22);
    doc.text('VeloxPay', 20, 20);
    doc.setFontSize(18);
    doc.text('Invoice', 20, 30);

    doc.setFontSize(11);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, 50);
    doc.text(`Date: ${invoiceData.date}`, 20, 58);
    doc.text(`Due Date: ${invoiceData.dueDate || 'N/A'}`, 20, 66);

    doc.text('Bill To:', 20, 80);
    doc.text(invoiceData.customerName || 'Customer Name', 20, 90);
    doc.text(invoiceData.customerEmail || '', 20, 98);
    doc.text(invoiceData.customerAddress || '', 20, 106);

    let y = 130;
    doc.text('Items:', 20, y);
    y += 10;

    invoiceData.items.forEach((item) => {
      if (item.description) {
        doc.text(`${item.description} ×${item.quantity} @ $${item.rate}`, 20, y);
        y += 10;
      }
    });

    doc.setFontSize(14);
    doc.text(`Total: $${total.toFixed(2)}`, 20, y + 15);

    if (invoiceData.notes) {
      doc.text('Notes:', 20, y + 35);
      doc.text(invoiceData.notes, 20, y + 45);
    }

    doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
  };

  return (
    <div className="create-invoice-page">
      <div className="invoice-form">
        <h1>Create New Invoice</h1>

        <div className="form-group">
          <label>Invoice Number</label>
          <input type="text" name="invoiceNumber" value={invoiceData.invoiceNumber} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={invoiceData.date} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Due Date</label>
          <input type="date" name="dueDate" value={invoiceData.dueDate} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Customer Name</label>
          <input type="text" name="customerName" value={invoiceData.customerName} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Customer Email</label>
          <input type="email" name="customerEmail" value={invoiceData.customerEmail} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Customer Address</label>
          <textarea name="customerAddress" value={invoiceData.customerAddress} onChange={handleChange} rows={3} />
        </div>

        <h3>Items</h3>
        {invoiceData.items.map((item, index) => (
          <div key={index} className="item-row">
            <input
              placeholder="Description"
              value={item.description}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
            />
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
            />
            <input
              type="number"
              placeholder="Rate ($)"
              value={item.rate}
              onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
            />
            <button 
              className="remove-btn"
              onClick={() => removeItem(index)}
            >
              ✕
            </button>
          </div>
        ))}

        <button onClick={addItem} className="add-item-btn">+ Add Item</button>

        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={invoiceData.notes} onChange={handleChange} rows={3} />
        </div>

        <div className="total-amount">
          <strong>Total: ${calculateTotal().toFixed(2)}</strong>
        </div>

        <button className="generate-pdf-btn" onClick={generatePDF}>
          Download PDF Invoice
        </button>
      </div>

      {/* Live Preview */}
      <div className="invoice-preview">
        <h3>Live Preview</h3>
        <div className="preview-box">
          <h2>VeloxPay Invoice</h2>
          <p><strong>Invoice #:</strong> {invoiceData.invoiceNumber}</p>
          <p><strong>Date:</strong> {invoiceData.date}</p>
          <p><strong>Due:</strong> {invoiceData.dueDate || 'N/A'}</p>

          <h4>Bill To</h4>
          <p>{invoiceData.customerName || 'Customer Name'}</p>
          <p>{invoiceData.customerEmail}</p>
          <p>{invoiceData.customerAddress}</p>

          <h4>Items</h4>
          <ul>
            {invoiceData.items.map((item, i) => (
              item.description && (
                <li key={i}>
                  {item.description} — {item.quantity} × ${item.rate} = ${(item.quantity * item.rate).toFixed(2)}
                </li>
              )
            ))}
          </ul>

          <h3>Total: ${calculateTotal().toFixed(2)}</h3>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;