const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const pool = require("../db");

const passwordValidator = require("../middleware/passwordValidator");
const authenticateToken = require('../middleware/auth');

// Import mail service (Resend version)
const { 
  sendPasswordResetEmail, 
  sendPasswordResetConfirmation 
} = require("../utils/mailService");

const { findOrCreateSocialUser } = require("../utils/socialAuth");

const router = express.Router();

// ======================
// SIGNUP
// ======================
const handleSignup = async (req, res) => {
  try {
    const { name, business_name, email, phone_number, bank_account, password } = req.body;

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    const id = uuidv4();

    const query = `
      INSERT INTO users (id, name, business_name, email, phone_number, bank_account, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, business_name, created_at
    `;

    const result = await pool.query(query, [id, name, business_name, email, phone_number, bank_account, password_hash]);

    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === "23505") {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

router.post("/signup", passwordValidator, handleSignup);
router.post("/auth/signup", passwordValidator, handleSignup);

// ======================
// LOGIN (Already good - kept as is)
// ======================
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email received:', `"${email}"`);

    const query = `
      SELECT id, email, name, business_name, password_hash, 
             google_id, apple_id 
      FROM users 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
    `;

    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      console.log('→ No user found with that email');
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (user.google_id || user.apple_id) {
      return res.status(401).json({ 
        error: "This account was created with Google or Apple. Please use the social login buttons." 
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: "No password set on this account." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      console.log('→ Password does NOT match');
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log('→ LOGIN SUCCESSFUL ✅');

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        business_name: user.business_name
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.post("/login", handleLogin);
router.post("/auth/login", handleLogin);

// ======================
// PASSWORD RESET ROUTES (Updated)
// ======================
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.json({
        message: "If an account exists with this email, a password reset link will be sent."
      });
    }

    const userId = userResult.rows[0].id;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [resetTokenHash, tokenExpiry, userId]
    );

    // Send email using Resend
    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      console.warn(`Failed to send password reset email to ${email}, but token was stored`);
    }

    res.json({
      message: "If an account exists with this email, a password reset link will be sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Keep your verify and reset routes as they are (they look fine)
// ======================
// VERIFY RESET TOKEN
// ======================
router.post("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const userResult = await pool.query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [tokenHash]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    res.json({ message: "Token is valid" });
  } catch (error) {
    console.error("Verify reset token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// RESET PASSWORD
// ======================
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const userResult = await pool.query(
      "SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [tokenHash]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [newPasswordHash, userId]
    );

    // Send confirmation email (optional but good UX)
    try {
      await sendPasswordResetConfirmation(userEmail);
    } catch (emailError) {
      console.warn("Password reset successful, but confirmation email failed:", emailError);
    }

    res.json({
      message: "Password has been reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// GOOGLE, APPLE, SOCIAL ROUTES (unchanged for now)
// ======================
// ... (keep all your Google, Apple, and social routes as they are)

// ======================
// INVOICES ROUTES
// ======================
router.get('/invoices/stats', authenticateToken, async (req, res) => {
  try {
    const supplierId = req.user.userId || req.user.id;   // Important: check your JWT payload

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

    res.json(result.rows[0] || {
      pending: 0, approved: 0, paid: 0,
      pendingAmount: 0, approvedAmount: 0, paidAmount: 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    const supplierId = req.user.userId || req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const invoicesQuery = `
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

    const result = await pool.query(invoicesQuery, [supplierId, limit]);

    res.json(result.rows);
  } catch (error) {
    console.error('Invoices fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// ======================
// PUBLIC INVOICE DETAILS (for Approval Page - NO AUTH REQUIRED)
// ======================
router.get('/invoices/:identifier/public', async (req, res) => {
  const identifier = req.params.identifier;

  try {
    let query;
    let params;

    // Support both UUID and invoice_number
    if (identifier.length > 30 && identifier.includes('-')) {
      query = `
        SELECT 
          i.id,
          i.invoice_number,
          i.total_amount,
          i.due_date,
          i.description,
          c.name AS client_name,
          s.business_name AS supplier_business_name
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        LEFT JOIN suppliers s ON s.id = i.supplier_id
        WHERE i.id = $1
      `;
      params = [identifier];
    } else {
      query = `
        SELECT 
          i.id,
          i.invoice_number,
          i.total_amount,
          i.due_date,
          i.description,
          c.name AS client_name,
          s.business_name AS supplier_business_name
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        LEFT JOIN suppliers s ON s.id = i.supplier_id
        WHERE i.invoice_number = $1
      `;
      params = [identifier];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = result.rows[0];

    res.json({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      totalAmount: invoice.total_amount,
      dueDate: invoice.due_date,
      description: invoice.description,
      clientName: invoice.client_name,
      supplierBusinessName: invoice.supplier_business_name
    });
  } catch (error) {
    console.error('Error fetching public invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======================
// CLIENT DECISION: APPROVE OR REJECT INVOICE
// ======================
router.post('/invoices/:identifier/client-decision', async (req, res) => {
  const identifier = req.params.identifier;
  const { decision, rejectionReason } = req.body;

  try {
    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid decision. Must be "approve" or "reject"' });
    }

    // First, find the invoice (support both UUID and invoice_number)
    let findQuery;
    let params;

    if (identifier.length > 30 && identifier.includes('-')) {
      findQuery = "SELECT id FROM invoices WHERE id = $1";
      params = [identifier];
    } else {
      findQuery = "SELECT id FROM invoices WHERE invoice_number = $1";
      params = [identifier];
    }

    const findResult = await pool.query(findQuery, params);

    if (findResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceId = findResult.rows[0].id;

    if (decision === 'approve') {
      const { triggerAdvanceAfterApproval } = require('../utils/invoiceService');
      const result = await triggerAdvanceAfterApproval(invoiceId);

      if (result.success) {
        return res.json({
          success: true,
          message: 'Invoice approved successfully',
          status: 'approved',
          advanceAmount: result.advanceAmount
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: result.message || 'Failed to approve invoice' 
        });
      }
    } 

    // Reject case
    const updateQuery = `
      UPDATE invoices 
      SET 
        status = 'rejected',
        rejection_reason = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id, status
    `;

    const result = await pool.query(updateQuery, [rejectionReason || null, invoiceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json({
      success: true,
      message: 'Invoice rejected successfully',
      status: 'rejected'
    });

  } catch (error) {
    console.error('Error processing client decision:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======================
// UPLOAD INVOICE + SEND APPROVAL REQUEST TO CLIENT
// ======================
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/invoices/');   // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
  }
});

// Create uploads folder if it doesn't exist (add this at top of server.js if needed)
const fs = require('fs');
const uploadDir = 'uploads/invoices';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ======================
// UPLOAD ROUTE
// ======================
router.post('/invoices/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const supplierId = req.user.userId || req.user.id;

    const {
      invoice_number,
      total_amount,
      due_date,
      client_id,
      description,
      term_days
    } = req.body;

    // Validation
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an invoice file" });
    }

    if (!invoice_number || !total_amount || !due_date || !client_id || !term_days) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const invoiceId = uuidv4();
    const filePath = req.file.path;   // e.g. "uploads/invoices/1234567890-abc123.pdf"

    // Insert invoice into database
    const insertQuery = `
      INSERT INTO invoices (
        id, supplier_id, customer_id, invoice_number, total_amount,
        issue_date, due_date, status, description, term_days, 
        file_path, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, 'pending', $7, $8, $9, NOW(), NOW())
      RETURNING id, invoice_number, total_amount, due_date
    `;

    const result = await pool.query(insertQuery, [
      invoiceId,
      supplierId,
      client_id,
      invoice_number,
      parseFloat(total_amount),
      due_date,
      description || null,
      parseInt(term_days),
      filePath
    ]);

    const newInvoice = result.rows[0];

    // Get client email
    const clientResult = await pool.query(
      "SELECT email FROM customers WHERE id = $1", 
      [client_id]
    );

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    const clientEmail = clientResult.rows[0].email;

    // Get supplier business name
    const supplierResult = await pool.query(
      "SELECT business_name FROM suppliers WHERE id = $1", 
      [supplierId]
    );

    const supplierBusiness = supplierResult.rows[0]?.business_name || "Your Supplier";

    // Send approval request email to client
    const { sendApprovalRequestEmail } = require('../utils/mailService');

    const emailSent = await sendApprovalRequestEmail(
      clientEmail, 
      newInvoice, 
      supplierBusiness
    );

    res.status(201).json({
      success: true,
      message: "Invoice uploaded successfully. Approval request sent to client.",
      invoice: {
        id: newInvoice.id,
        invoice_number: newInvoice.invoice_number
      },
      filePath: filePath,
      emailSent: emailSent
    });

  } catch (error) {
    console.error("Error uploading invoice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;