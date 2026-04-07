const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const authenticateToken = require('../middleware/auth.js');
const pool = require('../db');
const { triggerAdvanceAfterApproval } = require('../utils/invoiceService');

// ====================== MULTER SETUP FOR FILE UPLOAD ======================
const uploadDir = path.join(__dirname, '../uploads/invoices');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowed = /pdf|jpg|jpeg|png/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
  }
});

// ====================== UPLOAD INVOICE ======================
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const supplierId = "6330a481-2ec0-4e73-950f-19916fe0b302";

    if (!supplierId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      invoice_number,
      total_amount,
      due_date,
      client_id,
      description,
      term_days = 30
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Please upload an invoice file" });
    }

    if (!invoice_number || !total_amount || !due_date || !client_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (parseFloat(total_amount) <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    const filePath = req.file.path.replace(/\\/g, '/');

    // Calculate fee and advance
    let fee_percentage = 5.0;
    if (term_days >= 45) fee_percentage = 7.5;
    if (term_days >= 90) fee_percentage = 10.0;

    const advance_amount = Math.round(parseFloat(total_amount) * 0.85 * 100) / 100;

    const invoiceId = uuidv4();

    const insertQuery = `
      INSERT INTO invoices (
        id, supplier_id, customer_id, invoice_number, total_amount,
        issue_date, due_date, status, description, term_days, 
        fee_percentage, advance_amount, file_path, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, 'pending', $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, invoice_number, total_amount, due_date, status
    `;

    const result = await pool.query(insertQuery, [
      invoiceId, supplierId, client_id, invoice_number,
      parseFloat(total_amount), due_date, description || null,
      parseInt(term_days), fee_percentage, advance_amount, filePath
    ]);

    const newInvoice = result.rows[0];

    // Send approval email to client
    let emailSent = false;
    try {
      const { sendApprovalRequestEmail } = require('../utils/mailService');

      const clientResult = await pool.query("SELECT email, name FROM customers WHERE id = $1", [client_id]);
      const supplierResult = await pool.query("SELECT business_name FROM suppliers WHERE id = $1", [supplierId]);

      if (clientResult.rows.length > 0) {
        emailSent = await sendApprovalRequestEmail(
          clientResult.rows[0].email,
          newInvoice,
          supplierResult.rows[0]?.business_name || "Your Supplier"
        );
      }
    } catch (emailError) {
      console.warn("Failed to send approval email:", emailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Invoice uploaded successfully. Approval request sent to the client.",
      invoice: {
        id: newInvoice.id,
        invoice_number: newInvoice.invoice_number,
        status: newInvoice.status
      },
      emailSent
    });

  } catch (error) {
    console.error("Upload invoice error:", error);

    // Cleanup file if database fails
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) { console.error("File cleanup failed:", e); }
    }

    res.status(500).json({ error: error.message || "Failed to upload invoice" });
  }
});

// ====================== GET INVOICE STATS ======================
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const supplierId = req.user?.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID not found in token. Please log in again.' });
    }

    console.log('Stats route - supplierId from JWT:', supplierId);   // ← Debug

    const statsQuery = `
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) AS pending_amount,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END), 0) AS approved_amount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_amount
      FROM invoices
      WHERE supplier_id = $1;
    `;

    const result = await pool.query(statsQuery, [supplierId]);

    console.log('Stats query result:', result.rows[0]);   // ← Debug

    res.json(result.rows[0] || {
      pending: 0,
      approved: 0,
      paid: 0,
      pending_amount: 0,
      approved_amount: 0,
      paid_amount: 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ====================== GET RECENT INVOICES ======================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const supplierId = req.user?.supplierId;

    if (!supplierId) {
      return res.status(401).json({ error: 'Supplier ID not found in token. Please log in again.' });
    }

    console.log('Invoices route - supplierId from JWT:', supplierId);   // ← Debug

    const limit = parseInt(req.query.limit) || 20;

    const query = `
      SELECT 
        i.id, 
        i.invoice_number, 
        i.total_amount, 
        i.status, 
        i.description, 
        i.due_date, 
        i.created_at, 
        c.name AS client_name
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE i.supplier_id = $1
      ORDER BY i.created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [supplierId, limit]);

    console.log(`Returning ${result.rows.length} invoices for supplierId ${supplierId}`);

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// ====================== PUBLIC INVOICE (for Client Approval) ======================
router.get('/:identifier/public', async (req, res) => {
  const identifier = req.params.identifier;

  try {
    const isUUID = identifier.length > 30 && identifier.includes('-');
    const query = isUUID 
      ? "SELECT i.*, c.name as client_name, s.business_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id LEFT JOIN suppliers s ON s.id = i.supplier_id WHERE i.id = $1"
      : "SELECT i.*, c.name as client_name, s.business_name FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id LEFT JOIN suppliers s ON s.id = i.supplier_id WHERE i.invoice_number = $1";

    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Public invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================== CLIENT DECISION (Approve / Reject) ======================
router.post('/:identifier/client-decision', async (req, res) => {
  const identifier = req.params.identifier;
  const { decision, rejectionReason } = req.body;

  try {
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision' });
    }

    const findQuery = identifier.includes('-') && identifier.length > 30 
      ? "SELECT id FROM invoices WHERE id = $1" 
      : "SELECT id FROM invoices WHERE invoice_number = $1";

    const findResult = await pool.query(findQuery, [identifier]);

    if (findResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceId = findResult.rows[0].id;

    if (decision === 'approve') {
      const result = await triggerAdvanceAfterApproval(invoiceId);

      if (result.success) {
        return res.json({
          success: true,
          message: 'Invoice approved and 85% advance triggered',
          status: 'approved',
          advanceAmount: result.advanceAmount
        });
      } else {
        return res.status(400).json({ success: false, error: result.message });
      }
    }

    // Reject
    await pool.query(`
      UPDATE invoices 
      SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
      WHERE id = $2
    `, [rejectionReason || null, invoiceId]);

    res.json({ success: true, message: 'Invoice rejected', status: 'rejected' });

  } catch (error) {
    console.error('Client decision error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================== GET CLIENTS FOR DROPDOWN ======================
// Returns all customers (simple version - no supplier filter yet)
router.get('/clients', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        email,
        phone
      FROM customers 
      ORDER BY name ASC;
    `;

    const result = await pool.query(query);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

module.exports = router;