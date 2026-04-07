// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../db");

const passwordValidator = require("../middleware/passwordValidator");
const authenticateToken = require('../middleware/auth.js');

// Import mail service
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
    const userId = uuidv4();

    const query = `
      INSERT INTO users (id, name, business_name, email, phone_number, bank_account, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, business_name, created_at
    `;

    const result = await pool.query(query, [userId, name, business_name, email, phone_number, bank_account, password_hash]);

    const newUser = result.rows[0];

    // Create supplier record and link it
    const supplierId = uuidv4();
    await pool.query(`
      INSERT INTO suppliers (id, user_id, name, business_name, email, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [supplierId, newUser.id, newUser.name, newUser.business_name || newUser.name, newUser.email]);

    const token = jwt.sign(
      { 
        userId: newUser.id,
        supplierId: supplierId 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: newUser
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
// LOGIN
// ======================
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = `
      SELECT id, email, name, business_name, password_hash, 
             google_id, apple_id 
      FROM users 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
    `;

    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (user.google_id || user.apple_id) {
      return res.status(401).json({ 
        error: "This account was created with Google or Apple. Please use social login." 
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: "No password set on this account." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // === Find or create supplier link ===
    let supplierId;

    const supplierCheck = await pool.query(
      "SELECT id FROM suppliers WHERE user_id = $1 LIMIT 1", 
      [user.id]
    );

    if (supplierCheck.rows.length === 0) {
      // Create a supplier record linked to this user
      supplierId = uuidv4();
      await pool.query(`
        INSERT INTO suppliers (id, user_id, name, business_name, email, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [supplierId, user.id, user.name, user.business_name || user.name, user.email]);
    } else {
      supplierId = supplierCheck.rows[0].id;
    }

    // Create JWT with both userId and supplierId
    const token = jwt.sign(
      { 
        userId: user.id,
        supplierId: supplierId 
      },
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
        business_name: user.business_name,
        supplierId: supplierId   // Important for frontend
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
// PASSWORD RESET ROUTES
// ======================
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.json({ message: "If an account exists with this email, a password reset link will be sent." });
    }

    const userId = userResult.rows[0].id;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 3600000);

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [resetTokenHash, tokenExpiry, userId]
    );

    await sendPasswordResetEmail(email, resetToken);

    res.json({
      message: "If an account exists with this email, a password reset link will be sent."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

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

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [newPasswordHash, userId]
    );

    await sendPasswordResetConfirmation(userEmail).catch(err => 
      console.warn("Password reset confirmation email failed:", err)
    );

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// SOCIAL LOGIN ROUTES
// ======================

// Google Login
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Google credential is required" });
    }

    const { findOrCreateSocialUser } = require("../utils/socialAuth");

    const result = await findOrCreateSocialUser({
      provider: 'google',
      credential: credential,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || "Google login failed" });
    }

    // Link or create supplier
    let supplierId;
    const supplierCheck = await pool.query(
      "SELECT id FROM suppliers WHERE user_id = $1 LIMIT 1", 
      [result.user.id]
    );

    if (supplierCheck.rows.length === 0) {
      supplierId = uuidv4();
      await pool.query(`
        INSERT INTO suppliers (id, user_id, name, business_name, email, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [supplierId, result.user.id, result.user.name, result.user.business_name || result.user.name, result.user.email]);
    } else {
      supplierId = supplierCheck.rows[0].id;
    }

    const token = jwt.sign(
      { 
        userId: result.user.id,
        supplierId: supplierId 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Google login successful",
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        business_name: result.user.business_name
      }
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google login failed" });
  }
});

// Apple Login
router.post("/auth/apple", async (req, res) => {
  try {
    const { identityToken, user: appleUser } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: "Apple identity token is required" });
    }

    const { handleAppleLogin } = require("../utils/appleAuth");

    const result = await handleAppleLogin(identityToken, appleUser);

    if (!result.success) {
      return res.status(400).json({ error: result.error || "Apple login failed" });
    }

    // Link or create supplier
    let supplierId;
    const supplierCheck = await pool.query(
      "SELECT id FROM suppliers WHERE user_id = $1 LIMIT 1", 
      [result.user.id]
    );

    if (supplierCheck.rows.length === 0) {
      supplierId = uuidv4();
      await pool.query(`
        INSERT INTO suppliers (id, user_id, name, business_name, email, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [supplierId, result.user.id, result.user.name, result.user.business_name || result.user.name, result.user.email]);
    } else {
      supplierId = supplierCheck.rows[0].id;
    }

    const token = jwt.sign(
      { 
        userId: result.user.id,
        supplierId: supplierId 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Apple login successful",
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        business_name: result.user.business_name || null
      }
    });
  } catch (error) {
    console.error("Apple login error:", error);
    res.status(500).json({ error: "Apple login failed" });
  }
});

module.exports = router;