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

// Access tokens are deliberately short-lived. A stolen one is only useful for
// minutes, and the refresh token that replaces it is revocable because it is
// stored server side. Before this, a single 7-day token was the whole session.
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

// Mint an access token carrying the user's current token_version, so it can be
// revoked by bumping that column. Reads the version itself rather than
// trusting each call site to have selected it -- four call sites had already
// drifted apart in what they loaded.
const signAuthToken = async (userId, supplierId) => {
  const result = await pool.query(
    "SELECT token_version FROM users WHERE id = $1",
    [userId]
  );

  return jwt.sign(
    {
      userId,
      supplierId,
      tokenVersion: result.rows[0]?.token_version ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
};

const hashToken = (raw) => crypto.createHash("sha256").update(raw).digest("hex");

// Issue a refresh token. familyId continues an existing rotation chain, or
// starts a new one at login.
const issueRefreshToken = async (userId, familyId = null) => {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
     VALUES ($1, $2, COALESCE($3, gen_random_uuid()), $4)`,
    [userId, hashToken(raw), familyId, expiresAt]
  );

  return raw;
};

// Both halves of a session, for the four places that start one.
const issueSession = async (userId, supplierId) => ({
  token: await signAuthToken(userId, supplierId),
  refreshToken: await issueRefreshToken(userId),
});


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

    const { token, refreshToken } = await issueSession(newUser.id, supplierId);

    res.status(201).json({
      message: "User created successfully",
      token,
      refreshToken,
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
    const { token, refreshToken } = await issueSession(user.id, supplierId);

    res.json({
      message: "Login successful",
      token,
      refreshToken,
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

    // Bumping token_version signs out every existing session. A password
    // reset is usually a response to a compromise, so leaving the old
    // tokens working for another 7 days would defeat the point of it.
    await pool.query(
      `UPDATE users
         SET password_hash = $1,
             reset_token = NULL,
             reset_token_expiry = NULL,
             token_version = token_version + 1
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    // Same reasoning as logout-all: a live refresh token would undo the
    // access-token revocation within minutes.
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId]
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

    const { token, refreshToken } = await issueSession(result.user.id, supplierId);

    res.json({
      message: "Google login successful",
      token,
      refreshToken,
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

    const { token, refreshToken } = await issueSession(result.user.id, supplierId);

    res.json({
      message: "Apple login successful",
      token,
      refreshToken,
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

// Shared shape for the profile record, so a 409 hands back exactly what a
// fresh read would and the client can show the user what it actually is now.
const fetchProfileRow = async (userId) => {
  const result = await pool.query(
    `SELECT id, name, business_name, email, phone_number AS phone,
            avatar, created_at, updated_at
       FROM users
      WHERE id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
};

// ======================
// REFRESH
// ======================
// POST /api/auth/refresh  { refreshToken }
// Unauthenticated on purpose: the access token it replaces has usually
// expired, which is the whole reason for calling this.
router.post("/auth/refresh", async (req, res) => {
  const client = await pool.connect();

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "refreshToken is required" });
    }

    await client.query("BEGIN");

    // FOR UPDATE so two tabs refreshing at once cannot both spend the same
    // token and trip the reuse detection below on a perfectly honest client.
    const found = await client.query(
      `SELECT id, user_id, family_id, expires_at, used_at, revoked_at
         FROM refresh_tokens
        WHERE token_hash = $1
        FOR UPDATE`,
      [hashToken(refreshToken)]
    );

    if (found.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Invalid refresh token. Please log in again." });
    }

    const row = found.rows[0];

    // Replay of a spent token. Either someone copied it, or a stolen copy is
    // racing the real client -- and we cannot tell which, so we end the whole
    // chain and make the real user log in again.
    if (row.used_at) {
      await client.query(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = $1 AND revoked_at IS NULL",
        [row.family_id]
      );
      await client.query("COMMIT");
      console.warn("Refresh token reuse detected; revoked family", row.family_id);
      return res.status(401).json({ error: "Session ended for security reasons. Please log in again." });
    }

    if (row.revoked_at) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Session has been signed out. Please log in again." });
    }

    if (new Date(row.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    // Spend the presented token, then hand back a new one in the same family.
    await client.query("UPDATE refresh_tokens SET used_at = NOW() WHERE id = $1", [row.id]);

    const supplierResult = await client.query(
      "SELECT id FROM suppliers WHERE user_id = $1 LIMIT 1",
      [row.user_id]
    );

    await client.query("COMMIT");

    const supplierId = supplierResult.rows[0]?.id ?? null;
    const token = await signAuthToken(row.user_id, supplierId);
    const nextRefreshToken = await issueRefreshToken(row.user_id, row.family_id);

    res.json({ token, refreshToken: nextRefreshToken });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// ======================
// LOG OUT EVERYWHERE
// ======================
// POST /api/auth/logout-all
// Clients delete their own copy of the token on a normal logout, which is
// enough for that device. This is for the case that actually needs the
// server: a lost or stolen phone, or a session the user no longer trusts.
// Bumping token_version invalidates every token already issued, including
// the one making this call.
router.post("/auth/logout-all", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token. Please log in again." });
    }

    const result = await pool.query(
      "UPDATE users SET token_version = token_version + 1 WHERE id = $1 RETURNING token_version",
      [userId]
    );

    // Bumping token_version only kills access tokens. Without this, any live
    // refresh token would immediately mint a fresh one and the "log out"
    // would last about fifteen minutes.
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Signed out of all devices. Please log in again.",
      token_version: result.rows[0].token_version,
    });
  } catch (error) {
    console.error("Logout-all error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// CURRENT USER
// ======================
// GET /api/auth/me
// Consumed by DashboardScreen.js and ProfileScreen.js, which read
// business_name / name / email / phone and a bank-connected flag.
//
// The clients check `supplier_plaid_access_token || has_bank_account`, but we
// deliberately do NOT return the Plaid access token -- that is a server-side
// secret and must never reach a client. has_bank_account carries the same
// signal, and the clients' || falls through to it.
const handleMe = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token. Please log in again." });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.business_name,
        u.email,
        u.phone_number AS phone,
        u.avatar,
        u.created_at,
        -- Clients send this back on a profile update so the server can reject
        -- a write based on a copy of the record that is already out of date.
        u.updated_at,
        s.id AS supplier_id,
        COALESCE(s.bank_connected, FALSE) AS has_bank_account
      FROM users u
      LEFT JOIN suppliers s ON s.user_id = u.id
      WHERE u.id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch current user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.get("/auth/me", authenticateToken, handleMe);
// Alias, matching the /signup + /auth/signup pairing used above.
router.get("/me", authenticateToken, handleMe);

// ======================
// UPDATE PROFILE
// ======================
// PUT /api/user/profile
// Consumed by ProfileScreen.js and apps/web/src/Profile.js, which both send
// { business_name, phone } and expect { user } back.
//
// business_name is mirrored onto the supplier row because invoices join
// suppliers for the display name -- leaving them out of sync would make an
// edited profile show the old business name on every invoice.
router.put("/user/profile", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token. Please log in again." });
    }

    const { business_name, phone, name, updated_at } = req.body;

    await client.query("BEGIN");

    // Optimistic concurrency. updated_at is the version the client last read
    // (from /api/auth/me or a previous save). Conditioning the write on it
    // means two devices editing the same profile can no longer silently
    // overwrite each other -- the second one is told its copy is stale.
    //
    // Enforced only when the client sends it, so an older client keeps
    // working rather than being locked out by a deploy. Both of ours send it.
    if (updated_at) {
      const expected = new Date(updated_at);

      if (Number.isNaN(expected.getTime())) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "updated_at is not a valid timestamp" });
      }

      const current = await client.query(
        "SELECT updated_at FROM users WHERE id = $1",
        [userId]
      );

      if (current.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "User not found" });
      }

      // Compare instants, not strings: the client round-trips this through
      // JSON, so the formatting will not match character for character.
      if (current.rows[0].updated_at.getTime() !== expected.getTime()) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error:
            "This profile was changed on another device. Review the current details and try again.",
          current: await fetchProfileRow(userId),
        });
      }
    }

    // COALESCE($n, column) leaves a field untouched when the client omits it,
    // so a partial update cannot blank out the other fields.
    const updated = await client.query(
      `
      UPDATE users
      SET business_name = COALESCE($1, business_name),
          phone_number  = COALESCE($2, phone_number),
          name          = COALESCE($3, name),
          updated_at    = NOW()
      WHERE id = $4
      RETURNING id, name, business_name, email, phone_number AS phone, avatar, created_at, updated_at
      `,
      [business_name ?? null, phone ?? null, name ?? null, userId]
    );

    if (updated.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    await client.query(
      `
      UPDATE suppliers
      SET business_name = COALESCE($1, business_name),
          name          = COALESCE($2, name)
      WHERE user_id = $3
      `,
      [business_name ?? null, name ?? null, userId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Profile updated successfully",
      user: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;